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
    profil = {
        "firstName": "Ahmed",
        "age": 25,
        "weight_kg": 90,
        "height_cm": 180,
        "fitness_goal": "perte de poids",
        "experience_level": "debutant"
    }
    result = await coach_service.generate(
        user_id="test-123",
        question="Propose-moi un plan repas pour cette semaine",
        profil=profil
    )
    print(f"Recommandation : {result['recommendation'][:200]}...")
    print("COACH SERVICE : OK\n")
    print("=== PIPELINE COMPLET : OK ===")

asyncio.run(main())