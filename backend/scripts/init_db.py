"""Create the PostGIS extension and all tables.

Usage:  python -m scripts.init_db
"""
from __future__ import annotations

from sqlalchemy import text

from app.core.db import Base, engine
# import models so they register on Base.metadata
from app.models import db_models  # noqa: F401


def main() -> None:
    with engine.begin() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis"))
    Base.metadata.create_all(engine)
    print("PostGIS extension ensured and tables created.")


if __name__ == "__main__":
    main()
