"""
Cliente para Evolution API (WhatsApp).
"""

import httpx
from typing import Optional
from app.models.whatsapp import SendTextRequest, SendMediaRequest, WhatsAppResponse


class EvolutionClient:
    """Cliente para interagir com a Evolution API."""

    def __init__(
        self,
        api_url: Optional[str] = None,
        api_key: Optional[str] = None,
        instance: Optional[str] = None,
    ):
        """
        Inicializa o cliente Evolution API.

        Prioridade de configuração:
        1. Parâmetros passados no construtor
        2. Configurações JSON (data/settings.json)
        3. Variáveis de ambiente (.env)
        """
        # Import local para evitar circular import
        from app.api.settings import get_evolution_config

        config = get_evolution_config()

        self.api_url = (api_url or config.api_url).rstrip("/")
        self.api_key = api_key or config.api_key
        self.instance = instance or config.instance

        self.headers = {
            "Content-Type": "application/json",
            "apikey": self.api_key,
        }

    def _get_url(self, endpoint: str) -> str:
        """Constrói a URL completa para um endpoint."""
        return f"{self.api_url}/{endpoint}"

    async def _request(
        self,
        method: str,
        endpoint: str,
        data: Optional[dict] = None,
        params: Optional[dict] = None,
    ) -> dict:
        """Faz uma requisição à API."""
        url = self._get_url(endpoint)

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.request(
                method=method,
                url=url,
                headers=self.headers,
                json=data,
                params=params,
            )
            response.raise_for_status()
            return response.json()

    def _format_number(self, number: str) -> str:
        """
        Formata número de telefone para o padrão do WhatsApp.
        Remove caracteres especiais e adiciona código do país se necessário.
        """
        # Remove caracteres não numéricos
        clean_number = "".join(filter(str.isdigit, number))

        # Remove @s.whatsapp.net se presente
        clean_number = clean_number.replace("@s.whatsapp.net", "")

        # Se começa com 0, remove
        if clean_number.startswith("0"):
            clean_number = clean_number[1:]

        # Se não tem código do país (Brasil = 55), adiciona
        if len(clean_number) <= 11:
            clean_number = f"55{clean_number}"

        return clean_number

    async def send_text(
        self,
        number: str,
        text: str,
        delay: Optional[int] = None,
    ) -> WhatsAppResponse:
        """
        Envia mensagem de texto.

        Args:
            number: Número do destinatário
            text: Texto da mensagem
            delay: Delay em milissegundos antes de enviar

        Returns:
            WhatsAppResponse com resultado
        """
        try:
            formatted_number = self._format_number(number)

            data = {
                "number": formatted_number,
                "text": text,
            }

            if delay:
                data["delay"] = delay

            result = await self._request(
                "POST",
                f"message/sendText/{self.instance}",
                data=data,
            )

            return WhatsAppResponse(
                success=True,
                message="Mensagem enviada com sucesso",
                message_id=result.get("key", {}).get("id"),
            )

        except Exception as e:
            return WhatsAppResponse(
                success=False,
                message=f"Erro ao enviar mensagem: {str(e)}",
            )

    async def send_image(
        self,
        number: str,
        image_url: str,
        caption: Optional[str] = None,
    ) -> WhatsAppResponse:
        """
        Envia imagem.

        Args:
            number: Número do destinatário
            image_url: URL da imagem
            caption: Legenda opcional

        Returns:
            WhatsAppResponse com resultado
        """
        try:
            formatted_number = self._format_number(number)

            data = {
                "number": formatted_number,
                "media": image_url,
                "mediatype": "image",
            }

            if caption:
                data["caption"] = caption

            result = await self._request(
                "POST",
                f"message/sendMedia/{self.instance}",
                data=data,
            )

            return WhatsAppResponse(
                success=True,
                message="Imagem enviada com sucesso",
                message_id=result.get("key", {}).get("id"),
            )

        except Exception as e:
            return WhatsAppResponse(
                success=False,
                message=f"Erro ao enviar imagem: {str(e)}",
            )

    async def send_audio(
        self,
        number: str,
        audio_url: str,
    ) -> WhatsAppResponse:
        """
        Envia áudio.

        Args:
            number: Número do destinatário
            audio_url: URL do áudio

        Returns:
            WhatsAppResponse com resultado
        """
        try:
            formatted_number = self._format_number(number)

            data = {
                "number": formatted_number,
                "audio": audio_url,
            }

            result = await self._request(
                "POST",
                f"message/sendWhatsAppAudio/{self.instance}",
                data=data,
            )

            return WhatsAppResponse(
                success=True,
                message="Áudio enviado com sucesso",
                message_id=result.get("key", {}).get("id"),
            )

        except Exception as e:
            return WhatsAppResponse(
                success=False,
                message=f"Erro ao enviar áudio: {str(e)}",
            )

    async def send_document(
        self,
        number: str,
        document_url: str,
        filename: str,
        caption: Optional[str] = None,
    ) -> WhatsAppResponse:
        """
        Envia documento.

        Args:
            number: Número do destinatário
            document_url: URL do documento
            filename: Nome do arquivo
            caption: Legenda opcional

        Returns:
            WhatsAppResponse com resultado
        """
        try:
            formatted_number = self._format_number(number)

            data = {
                "number": formatted_number,
                "media": document_url,
                "mediatype": "document",
                "fileName": filename,
            }

            if caption:
                data["caption"] = caption

            result = await self._request(
                "POST",
                f"message/sendMedia/{self.instance}",
                data=data,
            )

            return WhatsAppResponse(
                success=True,
                message="Documento enviado com sucesso",
                message_id=result.get("key", {}).get("id"),
            )

        except Exception as e:
            return WhatsAppResponse(
                success=False,
                message=f"Erro ao enviar documento: {str(e)}",
            )

    async def send_reaction(
        self,
        number: str,
        message_id: str,
        emoji: str,
    ) -> WhatsAppResponse:
        """
        Envia reação a uma mensagem.

        Args:
            number: Número do chat
            message_id: ID da mensagem para reagir
            emoji: Emoji da reação

        Returns:
            WhatsAppResponse com resultado
        """
        try:
            formatted_number = self._format_number(number)

            data = {
                "key": {
                    "remoteJid": f"{formatted_number}@s.whatsapp.net",
                    "id": message_id,
                },
                "reaction": emoji,
            }

            result = await self._request(
                "POST",
                f"message/sendReaction/{self.instance}",
                data=data,
            )

            return WhatsAppResponse(
                success=True,
                message="Reação enviada com sucesso",
            )

        except Exception as e:
            return WhatsAppResponse(
                success=False,
                message=f"Erro ao enviar reação: {str(e)}",
            )

    async def check_number(self, number: str) -> dict:
        """
        Verifica se um número está registrado no WhatsApp.

        Args:
            number: Número para verificar

        Returns:
            Dict com informações do número
        """
        try:
            formatted_number = self._format_number(number)

            result = await self._request(
                "POST",
                f"chat/whatsappNumbers/{self.instance}",
                data={"numbers": [formatted_number]},
            )

            return {
                "exists": len(result) > 0 and result[0].get("exists", False),
                "jid": result[0].get("jid") if result else None,
            }

        except Exception:
            return {"exists": False, "jid": None}

    async def get_profile_picture(self, number: str) -> Optional[str]:
        """
        Obtém foto de perfil de um número.

        Args:
            number: Número do contato

        Returns:
            URL da foto de perfil ou None
        """
        try:
            formatted_number = self._format_number(number)

            result = await self._request(
                "POST",
                f"chat/fetchProfilePictureUrl/{self.instance}",
                data={"number": formatted_number},
            )

            return result.get("profilePictureUrl")

        except Exception:
            return None

    async def set_presence(self, presence: str = "available") -> bool:
        """
        Define presença (online/offline).

        Args:
            presence: "available", "unavailable", "composing", "recording"

        Returns:
            True se sucesso
        """
        try:
            await self._request(
                "POST",
                f"chat/setPresence/{self.instance}",
                data={"presence": presence},
            )
            return True
        except Exception:
            return False

    async def send_typing(self, number: str, duration: int = 3000) -> bool:
        """
        Envia indicador de digitação.

        Args:
            number: Número do chat
            duration: Duração em milissegundos

        Returns:
            True se sucesso
        """
        try:
            formatted_number = self._format_number(number)

            await self._request(
                "POST",
                f"chat/sendPresence/{self.instance}",
                data={
                    "number": formatted_number,
                    "presence": "composing",
                    "delay": duration,
                },
            )
            return True
        except Exception:
            return False


# Singleton para reutilização
_evolution_client: Optional[EvolutionClient] = None


def get_evolution_client() -> EvolutionClient:
    """Retorna instância do cliente Evolution."""
    global _evolution_client
    if _evolution_client is None:
        _evolution_client = EvolutionClient()
    return _evolution_client
