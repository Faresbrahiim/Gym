import asyncio
import os

from dotenv import load_dotenv

from app.repositories.recommendation_repository import RecommendationRepository
from app.services.coach_service import CoachService
from app.services.intent_service import IntentService
from app.services.llm_service import LLMService
from app.services.prompt_builder import PromptBuilder
from app.services.rag_service import RagService
from app.services.user_profile_service import UserProfileService

load_dotenv()


async def main():
    print("=== TEST PIPELINE COMPLET ===\n")

    print("1. Test RAG Search...")
    rag_service = RagService()
    docs = await rag_service.search("je veux perdre du poids")
    print(f"Documents trouves : {len(docs)}")
    print(f"Contenu : {docs[0][:100]}...")
    print("RAG : OK\n")

    print("2. Test Coach Service...")
    user_id = os.getenv("TEST_USER_ID")

    if not user_id:
        print("TEST_USER_ID not set, skipping coach-service integration test.")
        print("=== PIPELINE PARTIAL : OK ===")
        return

    coach_service = CoachService(
        user_profile_reader=UserProfileService(),
        intent_detector=IntentService(),
        rag_searcher=rag_service,
        prompt_builder=PromptBuilder(),
        llm_generator=LLMService(),
        recommendation_store=RecommendationRepository(),
    )

    result = await coach_service.generate(
        user_id=user_id,
        question="Propose-moi un plan repas pour cette semaine",
    )
    print(f"Recommandation : {result.recommendation[:200]}...")
    print("COACH SERVICE : OK\n")
    print("=== PIPELINE COMPLET : OK ===")


asyncio.run(main())
