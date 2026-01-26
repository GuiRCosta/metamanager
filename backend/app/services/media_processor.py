"""
Serviço de processamento de mídia para WhatsApp.
Transcrição de áudio usando OpenAI Whisper.
"""

import base64
import httpx
import tempfile
import os
from typing import Optional
from openai import AsyncOpenAI

from app.config import get_settings

settings = get_settings()


class MediaProcessor:
    """Processa áudio do WhatsApp."""

    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.openai_api_key)
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


# Singleton para reutilização
_media_processor: Optional[MediaProcessor] = None


def get_media_processor() -> MediaProcessor:
    """Retorna instância do processador de mídia."""
    global _media_processor
    if _media_processor is None:
        _media_processor = MediaProcessor()
    return _media_processor
