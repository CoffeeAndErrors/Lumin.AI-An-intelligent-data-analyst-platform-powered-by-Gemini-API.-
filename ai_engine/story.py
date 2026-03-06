"""
Story generation module for Lumin.ai.
Streams a structured data narrative using Google Gemini.
"""

import google.generativeai as genai
import os
import json
import asyncio
from dotenv import load_dotenv

load_dotenv()


def _get_model():
    """Configure Gemini at call-time so the key is always fresh from .env."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or api_key == "your_key_here":
        raise ValueError("GEMINI_API_KEY is not set in .env")
    genai.configure(api_key=api_key)
    # Try models in order of preference — gemini-2.5-flash is widely available on free tier
    for model_name in ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-2.0-flash"]:
        try:
            return genai.GenerativeModel(model_name), model_name
        except Exception:
            continue
    raise RuntimeError("No Gemini model available")


async def generate_story(eda: dict, metadata: dict, audience: str, depth: str):
    """
    Streams a structured data narrative using Gemini.
    Yields SSE-formatted strings.
    """

    sections_map = {
        "Brief":     ["[OVERVIEW]", "[KEY_FINDING_1]"],
        "Standard":  ["[OVERVIEW]", "[KEY_FINDING_1]", "[KEY_FINDING_2]", "[KEY_FINDING_3]"],
        "Deep Dive": ["[OVERVIEW]", "[KEY_FINDING_1]", "[KEY_FINDING_2]",
                      "[KEY_FINDING_3]", "[ANOMALY]", "[RECOMMENDATION]"]
    }
    sections = sections_map.get(depth, sections_map["Standard"])

    prompt = f"""You are Lumin, a precise and professional data analyst. Your job is to write a clear, structured narrative based on EDA results about a dataset in a storytelling format.

FORMAT RULES (follow strictly):
1. Use EXACTLY these section tags, each on its OWN line before the section text:
{chr(10).join(sections)}
2. Write short sentences 5-6per section. Keep sentences under 25 words each.
3. Use simple, direct grammar. Avoid complex or compound sentences.
4. Use bold,italics,markdown, bullet points, or any formatting only when necessary.
5. Every sentence must state a specific fact with a number, column name, or percentage.
6. Start each section immediately after its tag on the next line.

AUDIENCE GUIDE:
- EXECUTIVE: Focus on business impact. Use words like revenue, growth, efficiency.
- TECHNICAL: Focus on statistics. Mention distributions, correlations, standard deviations.
- GENERAL: Use everyday language. Explain what the numbers mean in plain terms.

EXAMPLE FORMAT:
[OVERVIEW]
This dataset contains 5,000 sales records across 8 columns. It covers transactions from January to December 2024. Only 0.5% of values are missing.

[KEY_FINDING_1]
The "revenue" column averages $45.20 per transaction. The median is $42.00, suggesting a slight right skew.

Dataset: {metadata.get('filename', 'dataset')}
Size: {metadata.get('rows', 0):,} rows x {metadata.get('cols', 0)} columns
Audience: {audience}
Depth: {depth}

EDA Results:
{json.dumps(eda, indent=2)[:4000]}"""

    try:
        model, model_name = _get_model()
    except ValueError as e:
        yield f"data: Error: {str(e)}\n\n"
        yield "data: [ERROR]\n\n"
        return
    except RuntimeError as e:
        yield f"data: Error: {str(e)}\n\n"
        yield "data: [ERROR]\n\n"
        return

    loop = asyncio.get_event_loop()

    def blocking_stream():
        return model.generate_content(prompt, stream=True)

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
