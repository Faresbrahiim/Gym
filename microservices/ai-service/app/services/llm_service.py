from groq import Groq
from app.core.config import settings


class LLMService:

    def __init__(self):
        self.client = None
        self.model = "llama-3.3-70b-versatile"

    def _get_client(self) -> Groq:
        if not settings.GROQ_API_KEY:
            raise RuntimeError("GROQ_API_KEY is not configured.")

        if self.client is None:
            self.client = Groq(api_key=settings.GROQ_API_KEY)

        return self.client

    async def generate(self, prompt: str) -> str:
        try:
            response = self._get_client().chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}]
            )
            return response.choices[0].message.content
        except Exception as e:
            raise Exception(f"Erreur LLM : {str(e)}")


llm_service = LLMService()
