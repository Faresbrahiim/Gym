import asyncio
import glob
import json
import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv

load_dotenv()

from app.db.database import AsyncSessionLocal, init_db
from app.models.rag_document import RagDocument
from app.services.embedding_service import embedding_service


async def bootstrap_db():
    await init_db()
    print("Database initialized.")


async def index_all_documents():
    await bootstrap_db()

    files = glob.glob("data/rag_documents/**/*.json", recursive=True)
    print(f"Indexing {len(files)} documents...")

    async with AsyncSessionLocal() as db:
        for filepath in files:
            with open(filepath, encoding="utf-8") as f:
                doc = json.load(f)

            embedding = embedding_service.get_embedding(doc["contenu"])

            rag_doc = RagDocument(
                title=doc["titre"],
                content=doc["contenu"],
                category=doc["categorie"],
                embedding=embedding,
            )
            db.add(rag_doc)
            print(f"Indexed: {doc['titre']}")

        await db.commit()
        print("Indexing completed.")


if __name__ == "__main__":
    asyncio.run(index_all_documents())
