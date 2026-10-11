"""Build the Hyderabad -> Srisailam demo prediction end-to-end and print a summary.

Usage:  python -m scripts.build_route_demo
Requires: DB initialised and towers loaded, plus internet for OSRM + Open-Meteo.
"""
from __future__ import annotations

import asyncio
import json

from app.core.config import DEMO_ROUTE
from app.core.db import SessionLocal
from app.services import prediction
from app.services.routing import get_routes


async def _run() -> None:
    s = DEMO_ROUTE["start"]
    e = DEMO_ROUTE["end"]
    routes = await get_routes(s["lat"], s["lon"], e["lat"], e["lon"], alternatives=False)
    r = routes[0]
    with SessionLocal() as db:
        pred = await prediction.predict_route(
            db, r["polyline"], r["distance_m"], r["duration_s"],
            operator_net=None, radio=None, route_name=DEMO_ROUTE["name"],
        )
    print(json.dumps(pred["summary"], indent=2))
    print(f"Distance: {pred['distance_m']/1000:.1f} km | "
          f"points: {len(pred['points'])} | recovery markers: {len(pred['recovery_markers'])}")
    print(pred["disclaimer"])


if __name__ == "__main__":
    asyncio.run(_run())
