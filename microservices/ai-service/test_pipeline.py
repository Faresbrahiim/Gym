import asyncio
import os
from dotenv import load_dotenv
load_dotenv()

async def main():
    print("=== TEST PIPELINE COMPLET ===\n")

    # Test RAG search
    print("1. Test RAG Search...")
    from app.services.rag_service import rag_service
    docs = await rag_service.search("je veux perdre du poids")
    print(f"Documents trouvés : {len(docs)}")
    print(f"Contenu : {docs[0][:100]}...")
    print("RAG : OK\n")

    # Test pipeline complet
    print("2. Test Coach Service...")
    from app.services.coach_service import coach_service
    user_id = os.getenv("TEST_USER_ID")

    if not user_id:
        print("TEST_USER_ID not set, skipping coach-service integration test.")
        print("=== PIPELINE PARTIAL : OK ===")
        return

    result = await coach_service.generate(
        user_id=user_id,
        question="Propose-moi un plan repas pour cette semaine",
    )
    print(f"Recommandation : {result['recommendation'][:200]}...")
    print("COACH SERVICE : OK\n")
    print("=== PIPELINE COMPLET : OK ===")

asyncio.run(main())
