"""
Agendador de mensagens automáticas via WhatsApp.
Envia relatórios diários e alertas de orçamento.
"""

import asyncio
import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Optional

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger

from app.services.evolution_client import EvolutionClient
from app.tools.meta_api import MetaAPI

logger = logging.getLogger(__name__)

SETTINGS_FILE = Path(__file__).parent.parent.parent / "data" / "settings.json"
BUDGET_STATE_FILE = Path(__file__).parent.parent.parent / "data" / "budget_alerts_state.json"


def load_settings() -> dict:
    """Carrega configurações do arquivo."""
    if SETTINGS_FILE.exists():
        with open(SETTINGS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def load_budget_state() -> dict:
    """Carrega estado dos alertas de orçamento enviados."""
    if BUDGET_STATE_FILE.exists():
        with open(BUDGET_STATE_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"alerts_sent": {}, "last_reset": None}


def save_budget_state(state: dict):
    """Salva estado dos alertas de orçamento."""
    BUDGET_STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(BUDGET_STATE_FILE, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2)


def get_evolution_client_from_settings() -> Optional[EvolutionClient]:
    """Cria cliente Evolution a partir das configurações salvas."""
    settings = load_settings()
    evolution = settings.get("evolution", {})

    if not evolution.get("enabled"):
        return None

    api_url = evolution.get("api_url")
    api_key = evolution.get("api_key")
    instance = evolution.get("instance")

    if not all([api_url, api_key, instance]):
        return None

    return EvolutionClient(
        api_url=api_url,
        api_key=api_key,
        instance=instance,
    )


def get_allowed_numbers() -> list[str]:
    """Obtém lista de números permitidos para receber mensagens."""
    settings = load_settings()
    evolution = settings.get("evolution", {})
    return evolution.get("allowed_numbers", [])


def get_notification_settings() -> dict:
    """Obtém configurações de notificação."""
    settings = load_settings()
    return settings.get("notifications", {})


def get_budget_settings() -> dict:
    """Obtém configurações de orçamento."""
    settings = load_settings()
    return settings.get("budget", {})


async def send_to_all_allowed(client: EvolutionClient, message: str):
    """Envia mensagem para todos os números permitidos."""
    numbers = get_allowed_numbers()

    if not numbers:
        logger.warning("Nenhum número configurado para receber mensagens")
        return

    for number in numbers:
        try:
            result = await client.send_text(number, message)
            if result.success:
                logger.info(f"Mensagem enviada para {number}")
            else:
                logger.error(f"Falha ao enviar para {number}: {result.message}")
        except Exception as e:
            logger.error(f"Erro ao enviar para {number}: {e}")


async def generate_daily_report() -> str:
    """Gera relatório diário de performance."""
    try:
        meta_api = MetaAPI()
        insights = await meta_api.get_account_insights(date_preset="today")

        if not insights:
            return "Nenhum dado disponível para hoje."

        spend = insights.get("spend", 0)
        impressions = insights.get("impressions", 0)
        clicks = insights.get("clicks", 0)
        conversions = insights.get("conversions", 0)
        ctr = insights.get("ctr", 0)
        cpc = insights.get("cpc", 0)

        # Obter campanhas ativas
        campaigns = await meta_api.get_campaigns()
        active_campaigns = [c for c in campaigns if c.get("effective_status") == "ACTIVE"]

        report = f"""*Relatório Diário - {datetime.now().strftime('%d/%m/%Y')}*

*Métricas Gerais:*
- Gasto: R$ {spend:,.2f}
- Impressões: {impressions:,}
- Cliques: {clicks:,}
- Conversões: {conversions:,}
- CTR: {ctr:.2f}%
- CPC: R$ {cpc:.2f}

*Campanhas Ativas:* {len(active_campaigns)}
"""

        # Adicionar top 3 campanhas por gasto
        if active_campaigns:
            campaigns_insights = await meta_api.get_all_campaigns_insights(date_preset="today")
            sorted_campaigns = sorted(
                [c for c in campaigns_insights if c.get("insights")],
                key=lambda x: x.get("insights", {}).get("spend", 0),
                reverse=True
            )[:3]

            if sorted_campaigns:
                report += "\n*Top Campanhas (por gasto):*\n"
                for c in sorted_campaigns:
                    name = c.get("name", "")[:30]
                    c_spend = c.get("insights", {}).get("spend", 0)
                    report += f"- {name}: R$ {c_spend:,.2f}\n"

        return report

    except Exception as e:
        logger.error(f"Erro ao gerar relatório diário: {e}")
        return f"Erro ao gerar relatório: {str(e)}"


async def check_budget_alerts():
    """Verifica e envia alertas de orçamento."""
    settings = load_settings()
    budget_settings = settings.get("budget", {})
    notification_settings = settings.get("notifications", {})

    if not notification_settings.get("immediate_alerts", True):
        return

    monthly_budget = budget_settings.get("monthly_budget", 0)
    if monthly_budget <= 0:
        return

    alerts_config = budget_settings.get("alerts", {})

    # Carregar estado dos alertas
    state = load_budget_state()

    # Resetar alertas no início do mês
    current_month = datetime.now().strftime("%Y-%m")
    if state.get("last_reset") != current_month:
        state = {"alerts_sent": {}, "last_reset": current_month}
        save_budget_state(state)

    try:
        meta_api = MetaAPI()
        insights = await meta_api.get_account_insights(date_preset="this_month")

        if not insights:
            return

        current_spend = insights.get("spend", 0)
        percentage = (current_spend / monthly_budget) * 100

        # Verificar cada threshold
        thresholds = [
            (50, "alert_50", "50%"),
            (80, "alert_80", "80%"),
            (100, "alert_100", "100%"),
        ]

        client = get_evolution_client_from_settings()
        if not client:
            return

        for threshold, config_key, label in thresholds:
            if not alerts_config.get(config_key, True):
                continue

            alert_key = f"threshold_{threshold}"
            if state["alerts_sent"].get(alert_key):
                continue

            if percentage >= threshold:
                priority = "ALTA" if threshold >= 80 else "MEDIA"
                message = f"""*Alerta de Orçamento - {label}*

Você atingiu {percentage:.1f}% do orçamento mensal.

*Orçamento:* R$ {monthly_budget:,.2f}
*Gasto atual:* R$ {current_spend:,.2f}
*Restante:* R$ {max(0, monthly_budget - current_spend):,.2f}

Prioridade: {priority}
"""
                await send_to_all_allowed(client, message)

                # Marcar como enviado
                state["alerts_sent"][alert_key] = datetime.now().isoformat()
                save_budget_state(state)

                logger.info(f"Alerta de orçamento {label} enviado")

        # Verificar projeção de excesso
        if alerts_config.get("projection_excess", True):
            alert_key = "projection_excess"
            if not state["alerts_sent"].get(alert_key):
                # Calcular projeção para o mês
                today = datetime.now()
                days_in_month = 30  # Simplificação
                days_passed = today.day
                if days_passed > 0:
                    daily_average = current_spend / days_passed
                    projected_spend = daily_average * days_in_month

                    if projected_spend > monthly_budget * 1.1:  # 10% acima
                        message = f"""*Alerta de Projeção de Orçamento*

Com o ritmo atual de gastos, você pode exceder o orçamento mensal.

*Orçamento:* R$ {monthly_budget:,.2f}
*Gasto atual:* R$ {current_spend:,.2f}
*Projeção mensal:* R$ {projected_spend:,.2f}
*Excesso projetado:* R$ {projected_spend - monthly_budget:,.2f}

Considere ajustar seus gastos ou aumentar o orçamento.
"""
                        await send_to_all_allowed(client, message)
                        state["alerts_sent"][alert_key] = datetime.now().isoformat()
                        save_budget_state(state)

    except Exception as e:
        logger.error(f"Erro ao verificar alertas de orçamento: {e}")


async def send_daily_report_job():
    """Job que envia o relatório diário."""
    notification_settings = get_notification_settings()

    if not notification_settings.get("daily_reports", True):
        logger.info("Relatórios diários desabilitados")
        return

    client = get_evolution_client_from_settings()
    if not client:
        logger.warning("Cliente Evolution não configurado")
        return

    report = await generate_daily_report()
    await send_to_all_allowed(client, report)
    logger.info("Relatório diário enviado")


async def check_budget_alerts_job():
    """Job que verifica alertas de orçamento."""
    await check_budget_alerts()


class WhatsAppScheduler:
    """Gerenciador de jobs agendados para WhatsApp."""

    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        self._started = False

    def _get_report_time(self) -> tuple[int, int]:
        """Obtém horário configurado para relatório diário."""
        notification_settings = get_notification_settings()
        report_time = notification_settings.get("report_time", "09:00")

        try:
            parts = report_time.split(":")
            hour = int(parts[0])
            minute = int(parts[1]) if len(parts) > 1 else 0
            return hour, minute
        except (ValueError, IndexError):
            return 9, 0  # Default: 09:00

    def start(self):
        """Inicia o scheduler com os jobs configurados."""
        if self._started:
            return

        # Job de relatório diário
        hour, minute = self._get_report_time()
        self.scheduler.add_job(
            send_daily_report_job,
            CronTrigger(hour=hour, minute=minute),
            id="daily_report",
            name="Relatório Diário WhatsApp",
            replace_existing=True,
        )

        # Job de verificação de orçamento (a cada 30 minutos)
        self.scheduler.add_job(
            check_budget_alerts_job,
            IntervalTrigger(minutes=30),
            id="budget_alerts",
            name="Verificação de Alertas de Orçamento",
            replace_existing=True,
        )

        self.scheduler.start()
        self._started = True
        logger.info(f"WhatsApp Scheduler iniciado - Relatório diário às {hour:02d}:{minute:02d}")

    def stop(self):
        """Para o scheduler."""
        if self._started:
            self.scheduler.shutdown()
            self._started = False
            logger.info("WhatsApp Scheduler parado")

    def update_report_time(self):
        """Atualiza o horário do relatório diário."""
        if not self._started:
            return

        hour, minute = self._get_report_time()

        # Remove job existente e adiciona com novo horário
        try:
            self.scheduler.remove_job("daily_report")
        except Exception:
            pass

        self.scheduler.add_job(
            send_daily_report_job,
            CronTrigger(hour=hour, minute=minute),
            id="daily_report",
            name="Relatório Diário WhatsApp",
            replace_existing=True,
        )

        logger.info(f"Horário do relatório atualizado para {hour:02d}:{minute:02d}")

    async def send_test_message(self, number: str) -> dict:
        """Envia mensagem de teste para um número."""
        client = get_evolution_client_from_settings()
        if not client:
            return {"success": False, "message": "WhatsApp não configurado"}

        try:
            message = f"""*Teste de Integração WhatsApp*

Esta é uma mensagem de teste do Gerenciador de Campanhas.

Se você recebeu esta mensagem, a integração está funcionando corretamente!

Data/Hora: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}
"""
            result = await client.send_text(number, message)
            return {"success": result.success, "message": result.message}
        except Exception as e:
            return {"success": False, "message": str(e)}

    async def send_report_now(self) -> dict:
        """Envia relatório imediatamente."""
        client = get_evolution_client_from_settings()
        if not client:
            return {"success": False, "message": "WhatsApp não configurado"}

        try:
            report = await generate_daily_report()
            await send_to_all_allowed(client, report)
            return {"success": True, "message": "Relatório enviado"}
        except Exception as e:
            return {"success": False, "message": str(e)}


# Singleton
_scheduler: Optional[WhatsAppScheduler] = None


def get_whatsapp_scheduler() -> WhatsAppScheduler:
    """Retorna instância do scheduler."""
    global _scheduler
    if _scheduler is None:
        _scheduler = WhatsAppScheduler()
    return _scheduler
