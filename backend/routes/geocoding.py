from fastapi import APIRouter, HTTPException, Query
import httpx
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

INDIAN_STATES = {
    'odisha': {'name': 'Bhubaneswar', 'state': 'Odisha', 'country': 'India', 'latitude': 20.2961, 'longitude': 85.8245, 'timezone': 'Asia/Kolkata'},
    'orissa': {'name': 'Bhubaneswar', 'state': 'Odisha', 'country': 'India', 'latitude': 20.2961, 'longitude': 85.8245, 'timezone': 'Asia/Kolkata'},
    'maharashtra': {'name': 'Mumbai', 'state': 'Maharashtra', 'country': 'India', 'latitude': 19.0760, 'longitude': 72.8777, 'timezone': 'Asia/Kolkata'},
    'karnataka': {'name': 'Bengaluru', 'state': 'Karnataka', 'country': 'India', 'latitude': 12.9716, 'longitude': 77.5946, 'timezone': 'Asia/Kolkata'},
    'tamil nadu': {'name': 'Chennai', 'state': 'Tamil Nadu', 'country': 'India', 'latitude': 13.0827, 'longitude': 80.2707, 'timezone': 'Asia/Kolkata'},
    'tamilnadu': {'name': 'Chennai', 'state': 'Tamil Nadu', 'country': 'India', 'latitude': 13.0827, 'longitude': 80.2707, 'timezone': 'Asia/Kolkata'},
    'kerala': {'name': 'Thiruvananthapuram', 'state': 'Kerala', 'country': 'India', 'latitude': 8.5241, 'longitude': 76.9366, 'timezone': 'Asia/Kolkata'},
    'gujarat': {'name': 'Ahmedabad', 'state': 'Gujarat', 'country': 'India', 'latitude': 23.0225, 'longitude': 72.5714, 'timezone': 'Asia/Kolkata'},
    'rajasthan': {'name': 'Jaipur', 'state': 'Rajasthan', 'country': 'India', 'latitude': 26.9124, 'longitude': 75.7873, 'timezone': 'Asia/Kolkata'},
    'punjab': {'name': 'Chandigarh', 'state': 'Punjab', 'country': 'India', 'latitude': 30.7333, 'longitude': 76.7794, 'timezone': 'Asia/Kolkata'},
    'delhi': {'name': 'New Delhi', 'state': 'Delhi', 'country': 'India', 'latitude': 28.6139, 'longitude': 77.2090, 'timezone': 'Asia/Kolkata'},
    'jammu and kashmir': {'name': 'Srinagar', 'state': 'Jammu & Kashmir', 'country': 'India', 'latitude': 34.0837, 'longitude': 74.7973, 'timezone': 'Asia/Kolkata'},
    'ladakh': {'name': 'Leh', 'state': 'Ladakh', 'country': 'India', 'latitude': 34.1526, 'longitude': 77.5771, 'timezone': 'Asia/Kolkata'},
    'alandi': {'name': 'Alandi', 'state': 'Maharashtra', 'country': 'India', 'latitude': 18.6774, 'longitude': 73.8967, 'timezone': 'Asia/Kolkata'},
    'pune': {'name': 'Pune', 'state': 'Maharashtra', 'country': 'India', 'latitude': 18.5204, 'longitude': 73.8567, 'timezone': 'Asia/Kolkata'}
}

@router.get("/geocode")
async def geocode_city(
    q: str = Query(..., description="City or State name to search"),
    limit: int = Query(5, description="Maximum results"),
    lang: str = Query("en", description="Language code")
):
    if not q or not q.strip():
        raise HTTPException(status_code=400, detail="Query parameter 'q' cannot be empty.")
    
    clean_q = q.lower().strip()
    if clean_q in INDIAN_STATES:
        s = INDIAN_STATES[clean_q]
        return {
            "results": [{
                "name": f"{s['state']} ({s['name']})",
                "country": s["country"],
                "admin1": s["state"],
                "latitude": s["latitude"],
                "longitude": s["longitude"],
                "timezone": s["timezone"]
            }]
        }
        
    url = f"https://geocoding-api.open-meteo.com/v1/search?name={q}&count={limit}&language={lang}&format=json"
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url)
            response.raise_for_status()
            data = response.json()
            if data.get("results"):
                return data
            for k, v in INDIAN_STATES.items():
                if k in clean_q or clean_q in k:
                    return {
                        "results": [{
                            "name": f"{v['state']} ({v['name']})",
                            "country": v["country"],
                            "admin1": v["state"],
                            "latitude": v["latitude"],
                            "longitude": v["longitude"],
                            "timezone": v["timezone"]
                        }]
                    }
            return data
    except Exception as e:
        logger.error(f"Error calling geocoding API: {e}")
        raise HTTPException(status_code=502, detail="Error fetching geocoding data.")

@router.get("/reverse-geocode")
async def reverse_geocode(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude")
):
    url = f"https://geocoding-api.open-meteo.com/v1/search?latitude={lat}&longitude={lon}&count=1&format=json"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url)
            response.raise_for_status()
            return response.json()
    except Exception as e:
        logger.error(f"Error in reverse geocoding: {e}")
        raise HTTPException(status_code=502, detail="Error reverse geocoding coordinates.")
