import asyncio
from app.db.database import engine, Base
from app.models.recommendation import Recommendation
from app.models.rag_document import RagDocument
from app.models.feedback import Feedback
from app.models.user_preferences import UserPreferences

async def create():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ Tables créées avec succès")

asyncio.run(create())