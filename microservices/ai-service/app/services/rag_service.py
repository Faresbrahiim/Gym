from sqlalchemy import text
from app.db.database import AsyncSessionLocal
from app.services.embedding_service import embedding_service

class RagService:

    async def search(self, question: str, top_k: int = 3) -> list[str]:
        vector = embedding_service.get_embedding(question)
        vector_str = "[" + ",".join(map(str, vector)) + "]"

        async with AsyncSessionLocal() as db:
            result = await db.execute(
                text("""
                    SELECT content, category
                    FROM rag_documents
                    ORDER BY embedding <-> CAST(:vec AS vector)
                    LIMIT :k
                """),
                {"vec": vector_str, "k": top_k}
            )
            rows = result.fetchall()

        return [row.content for row in rows]

rag_service = RagService()