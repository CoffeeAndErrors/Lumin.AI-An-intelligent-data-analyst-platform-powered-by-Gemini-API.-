"""
Chat module for Lumin.ai — conversational interface powered by Google Gemini.
"""

import google.generativeai as genai
import os
import json
import asyncio
from dotenv import load_dotenv

load_dotenv()


def _get_model(system_instruction: str):
    """Configure Gemini at call-time so the key is always fresh from .env."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or api_key == "your_key_here":
        raise ValueError("GEMINI_API_KEY is not set in .env")
    genai.configure(api_key=api_key)
    # Try models in order of preference — gemini-2.5-flash is widely available on free tier
    for model_name in ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-2.0-flash"]:
        try:
            return genai.GenerativeModel(
                model_name=model_name,
                system_instruction=system_instruction
            ), model_name
        except Exception:
            continue
    raise RuntimeError("No Gemini model available")


async def chat_with_data(messages: list, metadata: dict, eda: dict):
    """
    Streams conversational AI responses using Gemini.
    Maintains full conversation history.
    Yields SSE-formatted strings.
    """

    if not messages:
        yield "data: [DONE]\n\n"
        return

    eda_summary = {
        "overview":        eda.get("overview", {}),
        "statistics":      eda.get("statistics", [])[:8],
        "topCorrelations": eda.get("topCorrelations", [])[:5],
        "numericCols":     eda.get("numericCols", []),
        "categoricalCols": eda.get("categoricalCols", [])
    }

    system_instruction = f"""You are Lumin, an expert AI data analyst embedded directly into a dataset.

Dataset Info: {json.dumps(metadata)}
EDA Summary: {json.dumps(eda_summary)}

Your rules:
1. Always answer using specific numbers from the dataset
2. Keep answers to 3-5 sentences unless the user explicitly asks for more
3. When a chart would genuinely help understanding, include ONE tag only:
   [CHART:bar:columnName] OR [CHART:line:columnName] OR [CHART:pie:columnName]
   Use the EXACT column name from the dataset. Only use real column names.
4. After every answer add exactly one line starting with [SUGGEST] 
   containing a smart follow-up question the user might want to ask next
5. If the question cannot be answered from available data, say so directly and suggest what can be answered"""

    # Convert messages history to Gemini format
    # Gemini uses 'user' and 'model' roles (not 'assistant')
    gemini_history = []
    for msg in messages[:-1]:  # all except last message
        role = "model" if msg["role"] == "assistant" else "user"
        content = msg.get("content", "").strip()
        if content:  # skip empty placeholder messages
            gemini_history.append({
                "role": role,
                "parts": [content]
            })

    # Last message is the new user query
    last_message = messages[-1].get("content", "").strip() if messages else ""

    if not last_message:
        yield "data: [DONE]\n\n"
        return

    try:
        model, model_name = _get_model(system_instruction)
    except ValueError as e:
        yield f"data: Error: {str(e)}\n\n"
        yield "data: [ERROR]\n\n"
        return
    except RuntimeError as e:
        yield f"data: Error: {str(e)}\n\n"
        yield "data: [ERROR]\n\n"
        return

    chat_session = model.start_chat(history=gemini_history)
    loop = asyncio.get_event_loop()

    def blocking_stream():
        return chat_session.send_message(last_message, stream=True)

    try:
        response = await loop.run_in_executor(None, blocking_stream)
    except Exception as e:
        yield f"data: Gemini error: {str(e)[:200]}\n\n"
        yield "data: [ERROR]\n\n"
        return

    try:
        for chunk in response:
            try:
                text = chunk.text
                if text:
                    yield f"data: {text}\n\n"
            except Exception:
                continue
    except Exception as e:
        yield f"data: Stream error: {str(e)[:200]}\n\n"
        yield "data: [ERROR]\n\n"
        return

    yield "data: [DONE]\n\n"
