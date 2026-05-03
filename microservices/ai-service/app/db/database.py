from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

engine = create_async_engine(settings.DATABASE_URL, echo=settings.SQL_ECHO)
Base = declarative_base()

AsyncSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session


async def init_db():
    import app.models  # Registers SQLAlchemy models before create_all runs.

    async with engine.begin() as conn:
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        await conn.run_sync(Base.metadata.create_all)
        await _sync_recommendation_type_enum(conn)


async def _sync_recommendation_type_enum(conn) -> None:
    enum_values = [
        "greeting",
        "salle_info",
        "general",
        "nutrition",
        "coaching",
    ]

    for value in enum_values:
        await conn.execute(
            text(f"ALTER TYPE recommendationtype ADD VALUE IF NOT EXISTS '{value}'")
        )
