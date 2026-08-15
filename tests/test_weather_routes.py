import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    response = await client.get("/api/health")
    assert response.status_code == 200

@pytest.mark.asyncio
async def test_geocode(client: AsyncClient):
    response = await client.get("/api/geocode?q=London")
    assert response.status_code == 200

@pytest.mark.asyncio
async def test_weather(client: AsyncClient):
    response = await client.get("/api/weather?lat=51.5&lon=-0.12")
    assert response.status_code == 200

@pytest.mark.asyncio
async def test_aqi(client: AsyncClient):
    response = await client.get("/api/aqi?lat=51.5&lon=-0.12")
    assert response.status_code == 200

@pytest.mark.asyncio
async def test_geocode_empty(client: AsyncClient):
    response = await client.get("/api/geocode?q=")
    assert response.status_code in [400, 422]
