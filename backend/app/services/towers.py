"""Spatial queries over the real OpenCelliD tower table (PostGIS)."""
from __future__ import annotations

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.services.rsrp_model import TowerLite


def towers_near(
    db: Session,
    lat: float,
    lon: float,
    radius_m: float,
    operator_net: int | None = None,
    radio: str | None = None,
    limit: int = 50,
) -> list[TowerLite]:
    """Return towers within `radius_m` of (lat,lon), nearest first, using a PostGIS GIST index.

    Uses geography distance (ST_DWithin / ST_Distance over geography) for metre accuracy.
    """
    clauses = ["ST_DWithin(geom::geography, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography, :radius)"]
    params: dict = {"lat": lat, "lon": lon, "radius": radius_m, "limit": limit}
    if operator_net is not None:
        clauses.append("net = :net")
        params["net"] = operator_net
    if radio is not None:
        clauses.append("radio = :radio")
        params["radio"] = radio
    where = " AND ".join(clauses)

    sql = text(
        f"""
        SELECT lat, lon, radio, net, range_m, samples,
               ST_Distance(geom::geography, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography) AS dist
        FROM cell_towers
        WHERE {where}
        ORDER BY dist ASC
        LIMIT :limit
        """
    )
    rows = db.execute(sql, params).fetchall()
    return [
        TowerLite(
            lat=r.lat, lon=r.lon, radio=r.radio or "LTE",
            net=r.net, range_m=r.range_m or 0, samples=r.samples or 0,
        )
        for r in rows
    ]


def tower_count(db: Session) -> int:
    return db.execute(text("SELECT COUNT(*) FROM cell_towers")).scalar() or 0
