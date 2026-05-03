from app.services.intent_service import intent_service
from app.services.llm_service import llm_service
from app.services.prompt_builder import prompt_builder
from app.services.rag_service import rag_service
from app.services.user_profile_service import user_profile_service


class CoachService:
    async def generate(self, user_id: str, question: str) -> dict:
        profil = await user_profile_service.get_profile(user_id)

        intent = intent_service.detect(question)
        print(f"Intent detecte : {intent}")

        docs = []
        if intent != "greeting":
            docs = await rag_service.search(question)

        prompt = prompt_builder.build(profil, docs, question, intent)
        response = await llm_service.generate(prompt)

        return {
            "user_id": user_id,
            "question": question,
            "intent": intent,
            "recommendation": response,
        }


coach_service = CoachService()
