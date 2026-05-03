from app.services.rag_service import rag_service
from app.services.llm_service import llm_service
from app.services.prompt_builder import prompt_builder
from app.services.intent_service import intent_service

class CoachService:

    async def generate(self, user_id: str, question: str, profil: dict) -> dict:

        # 1. Détecter l'intention
        intent = intent_service.detect(question)
        print(f"Intent détecté : {intent}")

        # 2. Chercher les docs RAG seulement si nécessaire
        docs = []
        if intent != "greeting":
            docs = await rag_service.search(question)

        # 3. Construire le prompt selon l'intention
        prompt = prompt_builder.build(profil, docs, question, intent)

        # 4. Générer la réponse
        response = await llm_service.generate(prompt)

        return {
            "user_id": user_id,
            "question": question,
            "intent": intent,
            "recommendation": response
        }

coach_service = CoachService()