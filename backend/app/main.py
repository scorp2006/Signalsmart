"""SignalSafe FastAPI application entrypoint.

Run:  uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
Docs: http://localhost:8000/docs
"""
from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router

app = FastAPI(
    title="SignalSafe API",
    version="1.0.0",
    description=(
        "AI-Powered Travel Safety & Connectivity Platform. "
        "Signal values are ESTIMATES from a physics-based propagation model over real tower and "
        "terrain data — not measurements. Data-poor areas are marked Unknown."
    ),
)

# Allow the React Native app (any origin during development) to call the API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/")
def root():
    return {
        "name": "SignalSafe API",
        "docs": "/docs",
        "note": "Signal values are estimates, not measurements. See /meta/attribution.",
    }
