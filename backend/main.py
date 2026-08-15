import logging
import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from fastapi.exceptions import HTTPException
from contextlib import asynccontextmanager

from .config import settings
from .routes import weather, geocoding, air_quality

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    print(r"""
    ___    __                       _       __               __  __               
   /   |  / /_  ____ ___  ____  ___| |     / /___  ____ _  / /_/ /_  ___  _____ 
  / /| | / __/ / __ `__ \/ __ \/ ___/ | /| / / __ \/ __ `/ / __/ __ \/ _ \/ ___/ 
 / ___ |/ /_  / / / / / / /_/ (__  )| |/ |/ / /_/ / /_/ / / /_/ / / /  __/ /     
/_/  |_|\__/ /_/ /_/ /_/\____/____/ |__/|__/\____/\__,_/  \__/_/ /_/\___/_/      
                                                                                 
    """)
    yield

app = FastAPI(title=settings.app_name, debug=settings.debug, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(weather.router, prefix="/api", tags=["weather"])
app.include_router(geocoding.router, prefix="/api", tags=["geocoding"])
app.include_router(air_quality.router, prefix="/api", tags=["air_quality"])

@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(status_code=exc.status_code, content={"error": "HTTPException", "message": exc.detail})

@app.exception_handler(TimeoutError)
async def timeout_exception_handler(request: Request, exc: TimeoutError):
    return JSONResponse(status_code=504, content={"error": "TimeoutError", "message": "The request to the external API timed out."})

@app.exception_handler(ConnectionError)
async def connection_exception_handler(request: Request, exc: ConnectionError):
    return JSONResponse(status_code=502, content={"error": "ConnectionError", "message": "Could not connect to the external API."})

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(status_code=500, content={"error": "InternalServerError", "message": "An unexpected error occurred."})

# Create dummy directories if they don't exist to avoid startup errors
frontend_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")
assets_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "assets")
os.makedirs(frontend_dir, exist_ok=True)
os.makedirs(assets_dir, exist_ok=True)

app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")
app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")
