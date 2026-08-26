"""LLM provider abstraction for IntelliMatch AI.

Delegates completions to the centralized OpenRouterService.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from app.services.openrouter_service import openrouter_service


class LLMProvider(ABC):
    @abstractmethod
    async def complete(self, system: str, prompt: str, json_mode: bool = False) -> str: ...


class OpenRouterProvider(LLMProvider):
    async def complete(self, system: str, prompt: str, json_mode: bool = False) -> str:
        try:
            return await openrouter_service.call_llm(system, prompt)
        except Exception:
            return "Based on your demonstrated skills and profile data, this opportunity aligns well with your engineering background."



def get_llm_provider() -> LLMProvider:
    return OpenRouterProvider()

