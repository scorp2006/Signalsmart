"""End-to-end route connectivity prediction and route recommendation."""
from __future__ import annotations

import statistics

from sqlalchemy.orm import Session

from app.core import config
from app.services import routing, towers
from app.services.geo import resample_polyline
from app.services.rsrp_model import estimate_point, terrain_penalty_db, categorize, rsrp_from_tower
from app.services.geo import haversine_m


async def predict_route(
    db: Session,
    polyline: list[list[float]],
    distance_m: float,
    duration_s: float | None,
    operator_net: int | None,
    radio: str | None,
    route_name: str | None = None,
) -> dict:
    """Produce per-point estimates, recovery markers, and a summary for one route geometry."""
    points = resample_polyline(polyline, config.ROUTE_SAMPLE_SPACING_M)
    elevations = await routing.get_elevations(points)

    # terrain variability over a small sliding window -> environment hint
    elev_values = [e for e in elevations if e is not None]
    global_terrain_std = statistics.pstdev(elev_values) if len(elev_values) > 1 else 0.0

    predicted = []
    for idx, p in enumerate(points):
        near = towers.towers_near(
            db, p["lat"], p["lon"], config.TOWER_SEARCH_RADIUS_M,
            operator_net=operator_net, radio=radio,
        )
        # local terrain std over a +/-3 point window
        lo, hi = max(0, idx - 3), min(len(elevations), idx + 4)
        window = [e for e in elevations[lo:hi] if e is not None]
        local_std = statistics.pstdev(window) if len(window) > 1 else global_terrain_std

        est = estimate_point(
            p["lat"], p["lon"], near,
            point_elev_m=elevations[idx], terrain_std_m=local_std,
        )
        predicted.append(
            {
                "lat": p["lat"],
                "lon": p["lon"],
                "distance_m": p["distance_m"],
                "elevation_m": elevations[idx],
                "rsrp_dbm_estimated": est["rsrp_dbm_estimated"],
                "category": est["category"],
                "nearest_tower_distance_m": est["nearest_tower_distance_m"],
                "is_estimate": True,
            }
        )

    recovery = _recovery_markers(predicted)
    summary = _summarize(predicted)

    return {
        "route_name": route_name,
        "distance_m": distance_m,
        "duration_s": duration_s,
        "polyline": polyline,
        "points": predicted,
        "recovery_markers": recovery,
        "summary": summary,
        "attribution": config.ATTRIBUTION,
        "disclaimer": config.ATTRIBUTION["disclaimer"],
    }


def _recovery_markers(points: list[dict]) -> list[dict]:
    """Mark the first point where signal recovers (to Good/Moderate) after a Weak/Blackspot run."""
    markers = []
    in_bad = False
    bad = {"Weak", "Blackspot"}
    good = {"Good", "Moderate"}
    for p in points:
        if p["category"] in bad:
            in_bad = True
        elif in_bad and p["category"] in good:
            markers.append(
                {
                    "lat": p["lat"],
                    "lon": p["lon"],
                    "distance_m": p["distance_m"],
                    "category": p["category"],
                }
            )
            in_bad = False
    return markers


def _summarize(points: list[dict]) -> dict:
    counts = {c: 0 for c in ["Good", "Moderate", "Weak", "Blackspot", "Unknown"]}
    for p in points:
        counts[p["category"]] = counts.get(p["category"], 0) + 1
    n = len(points) or 1
    blackspot_fraction = counts["Blackspot"] / n
    # connectivity score 0..100 (Unknown counts as neutral-low)
    weights = {"Good": 1.0, "Moderate": 0.7, "Weak": 0.35, "Blackspot": 0.0, "Unknown": 0.25}
    score = 100.0 * sum(weights[p["category"]] for p in points) / n
    return {
        "total_points": n,
        "counts": counts,
        "blackspot_fraction": round(blackspot_fraction, 3),
        "connectivity_score": round(score, 1),
    }


async def recommend_routes(
    db: Session,
    start_lat: float,
    start_lon: float,
    end_lat: float,
    end_lon: float,
    operator_net: int | None,
    radio: str | None,
) -> dict:
    """Fetch alternative OSM routes, predict each, and recommend the best-connected one."""
    raw_routes = await routing.get_routes(start_lat, start_lon, end_lat, end_lon, alternatives=True)

    alts = []
    for i, r in enumerate(raw_routes):
        pred = await predict_route(
            db, r["polyline"], r["distance_m"], r["duration_s"], operator_net, radio,
            route_name=f"Route {i + 1}",
        )
        alts.append(
            {
                "label": f"Route {i + 1}",
                "distance_m": r["distance_m"],
                "duration_s": r["duration_s"],
                "connectivity_score": pred["summary"]["connectivity_score"],
                "blackspot_fraction": pred["summary"]["blackspot_fraction"],
                "prediction": pred,
            }
        )

    # recommend highest connectivity score; tie-break on shorter distance
    best_idx = max(
        range(len(alts)),
        key=lambda i: (alts[i]["connectivity_score"], -alts[i]["distance_m"]),
    )
    reason = (
        f"Highest estimated connectivity score ({alts[best_idx]['connectivity_score']}/100) "
        f"with {round(alts[best_idx]['blackspot_fraction'] * 100)}% estimated blackspot coverage."
    )
    return {"recommended_index": best_idx, "reason": reason, "routes": alts}
