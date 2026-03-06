"""
FastAPI entry point for Lumin.ai AI Engine.
Exposes endpoints for EDA computation, story generation, and chat.
"""

import json
import os
from typing import Any

import pandas as pd
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from chat import chat_with_data
from eda import compute_eda
from story import generate_story

load_dotenv()

import google.generativeai as genai
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

app = FastAPI(title="Lumin.ai Engine", version="1.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Pydantic request models ──────────────────────────────────────────────────


class EDARequest(BaseModel):
    headers: list
    rows: list
    filename: str


class StoryRequest(BaseModel):
    eda: dict
    metadata: dict
    audience: str
    depth: str


class ChatRequest(BaseModel):
    messages: list
    metadata: dict
    eda: dict


# ── Routes ───────────────────────────────────────────────────────────────────


@app.get("/health")
async def health():
    return {"status": "ok", "version": "1.0"}


@app.post("/eda")
async def eda_endpoint(req: EDARequest):
    """Build a DataFrame from headers + rows and compute EDA statistics."""
    try:
        # Convert rows (list of lists) into DataFrame
        df = pd.DataFrame(req.rows, columns=req.headers)
        result = compute_eda(df, req.filename)
        return result
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/story")
async def story_endpoint(req: StoryRequest):
    """Stream an AI-generated data narrative (SSE)."""
    return StreamingResponse(
        generate_story(
            eda=req.eda,
            metadata=req.metadata,
            audience=req.audience,
            depth=req.depth,
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@app.post("/chat")
async def chat_endpoint(req: ChatRequest):
    """Stream a conversational AI response about the dataset (SSE)."""
    return StreamingResponse(
        chat_with_data(
            messages=req.messages,
            metadata=req.metadata,
            eda=req.eda,
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
