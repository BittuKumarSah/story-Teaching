import asyncio
import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# On Windows, we need to use SelectorEventLoop for psycopg async
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from app.db.session import engine, Base
from app.models import *

async def init_db():
    if not os.getenv("DATABASE_URL"):
        print("ERROR: DATABASE_URL environment variable not set!")
        print("Please set DATABASE_URL in .env file or environment variables")
        print("Example: postgresql+psycopg://postgres:password@db.project.supabase.co:5432/postgres")
        sys.exit(1)
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Database tables created successfully!")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(init_db())