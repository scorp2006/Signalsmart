"""Routing via OSRM (OpenStreetMap-based) and elevation via Open-Meteo.

Both are real public services. Network failures are handled gracefully so the API returns a clear
error rather than fabricating a route.
"""
from __future__ import annotations

import httpx

from app.core.config import settings


class RoutingError(RuntimeError):
    pass


async def get_routes(
    start_lat: float, start_lon: float, end_lat: float, end_lon: float, alternatives: bool = True
) -> list[dict]:
    """Return one or more driving routes from OSRM.

    Each route: {polyline: [[lat,lon],...], distance_m, duration_s}.
    OSRM expects lon,lat order.
    """
    coords = f"{start_lon},{start_lat};{end_lon},{end_lat}"
    url = f"{settings.OSRM_BASE_URL}/route/v1/driving/{coords}"
    params = {
        "overview": "full",
        "geometries": "geojson",
        "alternatives": "true" if alternatives else "false",
    }
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()
    except Exception as exc:  # noqa: BLE001
        raise RoutingError(f"OSRM routing failed: {exc}") from exc

    if data.get("code") != "Ok" or not data.get("routes"):
        raise RoutingError(f"OSRM returned no route (code={data.get('code')}).")

    routes = []
    for r in data["routes"]:
        # GeoJSON coordinates are [lon, lat]; convert to [lat, lon]
        poly = [[c[1], c[0]] for c in r["geometry"]["coordinates"]]
        routes.append(
            {"polyline": poly, "distance_m": r["distance"], "duration_s": r["duration"]}
        )
    return routes


async def get_elevations(points: list[dict]) -> list[float | None]:
    """Fetch elevation (m) for each {lat,lon} point from Open-Meteo. Batches of 100.

    Returns a list aligned with `points`; None where unavailable.
    """
    elevations: list[float | None] = []
    batch = 100
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            for i in range(0, len(points), batch):
                chunk = points[i : i + batch]
                lats = ",".join(f"{p['lat']:.5f}" for p in chunk)
                lons = ",".join(f"{p['lon']:.5f}" for p in chunk)
                resp = await client.get(
                    settings.OPEN_METEO_ELEVATION_URL,
                    params={"latitude": lats, "longitude": lons},
                )
                resp.raise_for_status()
                vals = resp.json().get("elevation", [])
                # pad/truncate to chunk length
                for j in range(len(chunk)):
                    elevations.append(vals[j] if j < len(vals) else None)
    except Exception:  # noqa: BLE001
        # Elevation is an enhancement; if it fails, return Nones (terrain term = 0).
        missing = len(points) - len(elevations)
        elevations.extend([None] * max(0, missing))
    return elevations
