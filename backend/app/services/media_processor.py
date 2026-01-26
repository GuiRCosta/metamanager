"""
Serviço de processamento de mídia para WhatsApp.
Transcrição de áudio (Whisper) e análise de imagem/vídeo (GPT-4 Vision).
"""

import base64
import httpx
from typing import Optional
from openai import AsyncOpenAI

from app.config import get_settings

settings = get_settings()


class MediaProcessor:
    """Processa diferentes tipos de mídia do WhatsApp."""

    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.openai_api_key)
        self.vision_model = settings.openai_vision_model
        self.whisper_model = settings.openai_whisper_model

    async def download_media(self, url: str) -> bytes:
        """Baixa mídia de uma URL."""
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.get(url)
            response.raise_for_status()
            return response.content

    async def transcribe_audio(
        self,
        audio_url: Optional[str] = None,
        audio_base64: Optional[str] = None,
        language: str = "pt",
    ) -> str:
        """
        Transcreve áudio para texto usando OpenAI Whisper.

        Args:
            audio_url: URL do arquivo de áudio
            audio_base64: Áudio em base64
            language: Idioma do áudio (default: português)

        Returns:
            Texto transcrito
        """
        try:
            if audio_url:
                audio_data = await self.download_media(audio_url)
            elif audio_base64:
                audio_data = base64.b64decode(audio_base64)
            else:
                return "[Erro: Nenhum áudio fornecido]"

            # Whisper aceita arquivos, não bytes diretamente
            # Precisamos criar um arquivo temporário ou usar a API de forma diferente
            import tempfile
            import os

            with tempfile.NamedTemporaryFile(suffix=".ogg", delete=False) as temp_file:
                temp_file.write(audio_data)
                temp_path = temp_file.name

            try:
                with open(temp_path, "rb") as audio_file:
                    transcript = await self.client.audio.transcriptions.create(
                        model=self.whisper_model,
                        file=audio_file,
                        language=language,
                    )
                return transcript.text
            finally:
                os.unlink(temp_path)

        except Exception as e:
            return f"[Erro na transcrição: {str(e)}]"

    async def analyze_image(
        self,
        image_url: Optional[str] = None,
        image_base64: Optional[str] = None,
        caption: Optional[str] = None,
        context: str = "Você é um assistente de marketing digital analisando imagens para campanhas.",
    ) -> str:
        """
        Analisa uma imagem usando GPT-4 Vision.

        Args:
            image_url: URL da imagem
            image_base64: Imagem em base64
            caption: Legenda da imagem (contexto adicional)
            context: Contexto do sistema

        Returns:
            Descrição/análise da imagem
        """
        try:
            content = []

            # Adicionar texto se houver caption
            user_text = "Descreva esta imagem de forma concisa e relevante para o contexto de marketing digital."
            if caption:
                user_text = f"O usuário enviou esta imagem com a legenda: '{caption}'. Descreva a imagem e como ela se relaciona com o contexto."

            content.append({"type": "text", "text": user_text})

            # Adicionar imagem
            if image_url:
                content.append({
                    "type": "image_url",
                    "image_url": {"url": image_url},
                })
            elif image_base64:
                content.append({
                    "type": "image_url",
                    "image_url": {"url": f"data:image/jpeg;base64,{image_base64}"},
                })
            else:
                return "[Erro: Nenhuma imagem fornecida]"

            response = await self.client.chat.completions.create(
                model=self.vision_model,
                messages=[
                    {"role": "system", "content": context},
                    {"role": "user", "content": content},
                ],
                max_tokens=500,
            )

            return response.choices[0].message.content or "[Sem descrição disponível]"

        except Exception as e:
            return f"[Erro na análise da imagem: {str(e)}]"

    async def analyze_video(
        self,
        video_url: Optional[str] = None,
        video_base64: Optional[str] = None,
        caption: Optional[str] = None,
    ) -> str:
        """
        Analisa um vídeo.
        Nota: GPT-4 Vision não suporta vídeos diretamente.
        Esta função extrai frames e analisa.

        Args:
            video_url: URL do vídeo
            video_base64: Vídeo em base64
            caption: Legenda do vídeo

        Returns:
            Descrição/análise do vídeo
        """
        try:
            # GPT-4 Vision não processa vídeos diretamente
            # Retornamos uma mensagem informando isso
            # Em produção, poderia-se extrair frames e analisar

            response_text = "Recebi seu vídeo"
            if caption:
                response_text += f" com a legenda: '{caption}'"

            response_text += ". No momento, não consigo analisar vídeos diretamente, mas posso ajudar com informações sobre campanhas de vídeo no Meta Ads. O que você gostaria de saber?"

            return response_text

        except Exception as e:
            return f"[Erro no processamento do vídeo: {str(e)}]"

    async def process_media(
        self,
        media_type: str,
        url: Optional[str] = None,
        base64_data: Optional[str] = None,
        caption: Optional[str] = None,
    ) -> tuple[str, str]:
        """
        Processa mídia e retorna o conteúdo extraído.

        Args:
            media_type: Tipo da mídia (audio, image, video)
            url: URL da mídia
            base64_data: Dados em base64
            caption: Legenda

        Returns:
            Tuple (tipo_processado, conteudo_texto)
        """
        if media_type == "audio":
            text = await self.transcribe_audio(audio_url=url, audio_base64=base64_data)
            return ("audio_transcription", f"[Transcrição de áudio]: {text}")

        elif media_type == "image":
            description = await self.analyze_image(
                image_url=url,
                image_base64=base64_data,
                caption=caption,
            )
            return ("image_analysis", f"[Análise de imagem]: {description}")

        elif media_type == "video":
            description = await self.analyze_video(
                video_url=url,
                video_base64=base64_data,
                caption=caption,
            )
            return ("video_info", description)

        else:
            return ("unknown", f"[Tipo de mídia não suportado: {media_type}]")


# Singleton para reutilização
_media_processor: Optional[MediaProcessor] = None


def get_media_processor() -> MediaProcessor:
    """Retorna instância do processador de mídia."""
    global _media_processor
    if _media_processor is None:
        _media_processor = MediaProcessor()
    return _media_processor
