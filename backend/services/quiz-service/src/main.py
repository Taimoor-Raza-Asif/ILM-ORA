from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from .routes import quiz_Routes
from .database import connect_db, close_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    print("Starting Quiz Service...")
    connect_db()
    yield
    print("Shutting down Quiz Service...")
    close_db()

app = FastAPI(
    title="Adaptive Quiz Service",
    description="Microservice for Adaptive RIASEC Assessment with persistent storage",
    version="2.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(quiz_Routes.router)

@app.get("/health")
def health_check():
    from .database.db import is_database_available
    return {
        "status": "ok",
        "service": "quiz-service",
        "version": "2.0.0",
        "mongodb": is_database_available(),
        "features": ["persistent_storage", "back_navigation", "resume_session"]
    }