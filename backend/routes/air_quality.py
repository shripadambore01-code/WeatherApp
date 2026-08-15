from fastapi import APIRouter, Query, HTTPException
import httpx
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

TIMEOUT = 10.0

@router.get("/aqi")
async def get_aqi(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude")
):
    url = "https://air-quality-api.open-meteo.com/v1/air-quality"
    params = {
        "latitude": lat,
        "longitude": lon,
        "current": "us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,aerosol_optical_depth,dust,uv_index,uv_index_clear_sky",
        "hourly": "pm2_5,pm10,us_aqi,uv_index",
        "timezone": "auto"
    }
    
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            return response.json()
    except httpx.TimeoutException as e:
        logger.error(f"Timeout fetching AQI: {e}")
        raise TimeoutError("AQI API timeout")
    except httpx.RequestError as e:
        logger.error(f"Request error fetching AQI: {e}")
        raise ConnectionError("AQI API connection error")
    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP status error fetching AQI: {e}")
        raise HTTPException(status_code=e.response.status_code, detail="AQI API error")
