"""Seed a few community reports so the Community screen isn't empty in the demo.

These are explicitly marked source='demo' so they are never confused with real device measurements.

Usage:  python -m scripts.seed_community
"""
from __future__ import annotations

from geoalchemy2.elements import WKTElement

from app.core.db import SessionLocal
from app.models.db_models import CommunityReport

# A handful of points along the Hyderabad -> Srisailam corridor.
SEED = [
    (17.3850, 78.4867, -78.0, "LTE", "Jio"),
    (17.1000, 78.6000, -95.0, "LTE", "Airtel"),
    (16.8000, 78.7000, -108.0, "GSM", "BSNL"),
    (16.5000, 78.8000, None, None, "Vi"),       # user reported no signal
    (16.0733, 78.8687, -88.0, "LTE", "Jio"),
]


def main() -> None:
    with SessionLocal() as db:
        for lat, lon, rsrp, radio, op in SEED:
            db.add(
                CommunityReport(
                    lat=lat, lon=lon, rsrp_dbm=rsrp, radio=radio, operator=op,
                    source="demo",
                    geom=WKTElement(f"POINT({lon} {lat})", srid=4326),
                )
            )
        db.commit()
    print(f"Seeded {len(SEED)} demo community reports (source='demo').")


if __name__ == "__main__":
    main()
