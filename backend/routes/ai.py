"""
Atmos AI / SkyMind API Route
Integrates Gemini LLM with strict weather context grounding and deterministic fallback.
"""

import httpx
import logging
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Any, List, Optional

from ..config import settings
from ..intelligence.ai_assistant import ask_atmos_ai
from ..intelligence.nlp_parser import parse_natural_query

router = APIRouter(prefix="/ai", tags=["ai"])
logger = logging.getLogger(__name__)


class AskAIRequest(BaseModel):
    question: str
    city_name: str
    current_data: Dict[str, Any]
    hourly_data: Optional[List[Dict[str, Any]]] = None
    daily_data: Optional[Dict[str, Any]] = None


class ParseQueryRequest(BaseModel):
    query: str


@router.post("/ask")
async def handle_ai_ask(req: AskAIRequest):
    """
    Processes natural questions using Gemini API when available,
    grounded with verified telemetry, falling back to deterministic intelligence tools.
    """
    # 1. First run deterministic tool answer for baseline precision
    fallback_response = ask_atmos_ai(
        question=req.question,
        city_name=req.city_name,
        current_data=req.current_data,
        hourly_data=req.hourly_data,
        daily_data=req.daily_data
    )

    api_key = settings.gemini_api_key
    if not api_key:
        return {
            **fallback_response,
            "source": "deterministic_engine",
            "ai_status": "API key not configured — using deterministic rule engine."
        }

    # 2. Call Gemini model with strict grounding prompt
    verified_context = (
        f"Verified Weather in {req.city_name}:\n"
        f"- Current Temp: {fallback_response['verified_metrics'].get('temperature')}\n"
        f"- Feels Like: {fallback_response['verified_metrics'].get('feels_like')}\n"
        f"- Rain Probability: {fallback_response['verified_metrics'].get('rain_probability')}\n"
        f"- Wind Speed: {fallback_response['verified_metrics'].get('wind')}\n"
        f"- UV Index: {fallback_response['verified_metrics'].get('uv')}\n"
        f"- AQI: {fallback_response['verified_metrics'].get('aqi')}\n"
        f"- Deterministic Analysis: {fallback_response['answer']}\n"
    )

    system_prompt = (
        "You are Atmos AI (SkyMind), a hyper-accurate, concise meteorological intelligence assistant. "
        "Your answers must be helpful, direct, practical, and strictly adhere to the provided verified weather context. "
        "NEVER contradict or invent temperatures, precipitation percentages, or conditions outside the context. "
        "Keep answers under 3 short sentences with actionable advice."
    )

    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": f"{system_prompt}\n\nContext:\n{verified_context}\n\nUser Question: {req.question}"}
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": 150
            }
        }

        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                ai_text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                return {
                    **fallback_response,
                    "answer": ai_text,
                    "source": "gemini_llm_grounded",
                    "ai_status": "online"
                }
            else:
                logger.warning(f"Gemini API returned status {resp.status_code}: {resp.text}")
    except Exception as e:
        logger.warning(f"Gemini LLM call failed or timed out: {e}")

    # Fallback return
    return {
        **fallback_response,
        "source": "deterministic_engine_fallback",
        "ai_status": "AI explanation unavailable — showing verified calculated recommendation."
    }


@router.post("/parse-query")
async def handle_parse_query(req: ParseQueryRequest):
    return parse_natural_query(req.query)
