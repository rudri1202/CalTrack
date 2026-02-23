"""
CalTrack API - Personal calorie tracker REST backend.
FastAPI app with auth, meal logging, goals, reports, and AI assistant.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, goals, entries, reports, ai, import_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """App lifecycle: startup and shutdown hooks."""
    # Startup
    yield
    # Shutdown


app = FastAPI(
    title="CalTrack API",
    description="Personal Calorie Tracker — REST API",
    version="1.0.0",
    lifespan=lifespan,
)

# Allow frontend dev servers to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routers
app.include_router(auth.router)
app.include_router(goals.router)
app.include_router(entries.router)
app.include_router(reports.router)
app.include_router(ai.router)
app.include_router(import_router.router)


@app.get("/health")
async def health_check():
    """Liveness/readiness probe for deployment."""
    return {"status": "ok", "service": "CalTrack API"}
