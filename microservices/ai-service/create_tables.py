import asyncio

from app.db.database import init_db


async def create():
    await init_db()
    print("Tables created successfully.")


asyncio.run(create())
