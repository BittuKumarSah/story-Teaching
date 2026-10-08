import asyncio
import sys

# On Windows, we need to use SelectorEventLoop for psycopg async
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes import router as api_router
from app.db.session import init_db


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-powered educational storytelling for children"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(api_router, prefix="/api")


@app.on_event("startup")
async def startup():
    await init_db()


@app.get("/")
async def root():
    return {"message": "StoryTeacher API", "version": settings.APP_VERSION}


@app.get("/health")
async def health():
    return {"status": "healthy"}