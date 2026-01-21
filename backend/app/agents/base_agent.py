from abc import ABC, abstractmethod
from typing import Optional
import json

from openai import AsyncOpenAI

from app.config import get_settings

settings = get_settings()


class BaseAgent(ABC):
    """Classe base para todos os agentes de IA."""

    def __init__(self, name: str, description: str):
        self.name = name
        self.description = description
        self.client = AsyncOpenAI(api_key=settings.openai_api_key)
        self.model = settings.openai_model
        self.tools = self._register_tools()

    @abstractmethod
    def _register_tools(self) -> list[dict]:
        """Registra as ferramentas disponíveis para o agente."""
        pass

    @abstractmethod
    def _get_system_prompt(self, context: Optional[dict] = None) -> str:
        """Retorna o prompt de sistema do agente."""
        pass

    @abstractmethod
    async def _execute_tool(self, tool_name: str, arguments: dict) -> str:
        """Executa uma ferramenta específica."""
        pass

    async def process_message(
        self,
        message: str,
        context: Optional[dict] = None,
    ) -> dict:
        """Processa uma mensagem do usuário."""
        messages = [
            {"role": "system", "content": self._get_system_prompt(context)},
            {"role": "user", "content": message},
        ]

        response = await self._chat_completion(messages)

        if response.choices[0].message.tool_calls:
            tool_results = await self._handle_tool_calls(
                response.choices[0].message.tool_calls
            )

            messages.append(response.choices[0].message)
            for tool_result in tool_results:
                messages.append(tool_result)

            response = await self._chat_completion(messages)

        return {
            "response": response.choices[0].message.content,
            "agent_type": self.name,
        }

    async def _chat_completion(self, messages: list[dict]):
        """Faz uma chamada para o modelo."""
        return await self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            tools=self.tools if self.tools else None,
            tool_choice="auto" if self.tools else None,
        )

    async def _handle_tool_calls(self, tool_calls) -> list[dict]:
        """Processa as chamadas de ferramenta."""
        results = []

        for tool_call in tool_calls:
            tool_name = tool_call.function.name
            arguments = json.loads(tool_call.function.arguments)

            result = await self._execute_tool(tool_name, arguments)

            results.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "content": result,
            })

        return results
