# from fastapi import FastAPI
# from contextlib import asynccontextmanager
# from src.routes.rec_Routes import router as rec_router   # adjust path if needed
# from src.controllers.rec_Controller import load_artifacts

# @asynccontextmanager
# async def lifespan(app: FastAPI):
#     # Startup: Preload ML model
#     print("🚀 Starting Recommendation Service...")
#     print("⏳ Preloading ML model (this may take a few seconds)...")
#     load_artifacts()
#     print("✅ Startup complete! Model ready.")
#     yield
#     # Shutdown (if needed)
#     print("🛑 Shutting down Recommendation Service...")

# app = FastAPI(
#     title="Recommendation Service",
#     version="1.0.0",
#     description="API for degree recommendations",
#     lifespan=lifespan
# )

# # Health Check Route
# @app.get("/health")
# def health_check():
#     return {"status": "ok"}

# # Load Recommendation Routes
# app.include_router(rec_router)

# if __name__ == "__main__":
#     import uvicorn
#     import os

#     port = int(os.environ.get("PORT", 3000))
#     uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)







# backend/services/recommendation-service/src/main.py
import sys
import os
from pathlib import Path

# Add the parent directory to sys.path so Python can find the 'src' module
# This ensures imports work regardless of where the script is run from
current_dir = Path(__file__).resolve().parent
parent_dir = current_dir.parent
sys.path.insert(0, str(parent_dir))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Now these imports should work
from src.routes.rec_Routes import router as rec_router

app = FastAPI(
    title="Recommendation Service",
    description="AI-powered degree recommendation service using Random Forest",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(rec_router)

@app.get("/")
def root():
    return {
        "service": "Recommendation Service",
        "status": "running",
        "version": "1.0.0"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 3003))
    print(f"Starting Recommendation Service on port {port}")
    uvicorn.run(
        "src.main:app",
        host="0.0.0.0",
        port=port,
        reload=True
    )