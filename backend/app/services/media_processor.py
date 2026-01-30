"""
Serviço de processamento de mídia para WhatsApp.
Transcrição de áudio usando OpenAI Whisper ou Gemini via OpenRouter.
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
        self.provider = settings.transcription_provider.lower()

        if self.provider == "whisper":
            # Whisper requer API OpenAI diretamente
            self.whisper_client = AsyncOpenAI(api_key=settings.llm_api_key)
            self.whisper_model = settings.llm_whisper_model
        else:
            # OpenRouter para Gemini
            self.openrouter_client = AsyncOpenAI(
                api_key=settings.llm_api_key,
                base_url=settings.llm_base_url or "https://openrouter.ai/api/v1",
            )
            self.transcription_model = settings.transcription_model

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
        Transcreve áudio para texto.

        Args:
            audio_url: URL do arquivo de áudio
            audio_base64: Áudio em base64
            language: Idioma do áudio (default: português)

        Returns:
            Texto transcrito
        """
        if self.provider == "whisper":
            return await self._transcribe_with_whisper(audio_url, audio_base64, language)
        else:
            return await self._transcribe_with_openrouter(audio_url, audio_base64, language)

    async def _transcribe_with_whisper(
        self,
        audio_url: Optional[str],
        audio_base64: Optional[str],
        language: str,
    ) -> str:
        """Transcreve usando OpenAI Whisper."""
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
                    transcript = await self.whisper_client.audio.transcriptions.create(
                        model=self.whisper_model,
                        file=audio_file,
                        language=language,
                    )
                return transcript.text
            finally:
                os.unlink(temp_path)

        except Exception as e:
            return f"[Erro na transcrição Whisper: {str(e)}]"

    async def _transcribe_with_openrouter(
        self,
        audio_url: Optional[str],
        audio_base64: Optional[str],
        language: str,
    ) -> str:
        """Transcreve usando Gemini via OpenRouter."""
        try:
            if audio_url:
                audio_data = await self.download_media(audio_url)
                audio_b64 = base64.b64encode(audio_data).decode("utf-8")
            elif audio_base64:
                audio_b64 = audio_base64
            else:
                return "[Erro: Nenhum áudio fornecido]"

            # Detectar formato do áudio (assume ogg para WhatsApp)
            audio_format = "ogg"

            # Prompt para transcrição
            lang_name = "português" if language == "pt" else language
            prompt = f"Transcreva este áudio em {lang_name}. Retorne apenas o texto transcrito, sem explicações ou formatação adicional."

            # Chamada via OpenRouter com input_audio
            response = await self.openrouter_client.chat.completions.create(
                model=self.transcription_model,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "input_audio",
                                "input_audio": {
                                    "data": audio_b64,
                                    "format": audio_format,
                                },
                            },
                        ],
                    }
                ],
            )

            transcription = response.choices[0].message.content
            return transcription.strip() if transcription else "[Erro: Transcrição vazia]"

        except Exception as e:
            return f"[Erro na transcrição OpenRouter: {str(e)}]"


# Singleton para reutilização
_media_processor: Optional[MediaProcessor] = None


def get_media_processor() -> MediaProcessor:
    """Retorna instância do processador de mídia."""
    global _media_processor
    if _media_processor is None:
        _media_processor = MediaProcessor()
    return _media_processor
