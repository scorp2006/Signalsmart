"""Download and load REAL OpenCelliD cell-tower data into PostGIS.

Downloads the per-MCC CSV(s) for the configured countries (India = 404,405), filtered to a bounding
box around the demo route to keep the load fast, and inserts them into the cell_towers table.

Usage:
    python -m scripts.load_opencellid                  # uses .env OPENCELLID_TOKEN + OCID_MCC_LIST
    python -m scripts.load_opencellid --file towers.csv  # load a CSV you already downloaded

OpenCelliD CSV columns (header present):
    radio, mcc, net, area, cell, unit, lon, lat, range, samples, changeable, created, updated, averageSignal

License: data © OpenCelliD contributors, CC BY-SA 4.0.
"""
from __future__ import annotations

import argparse
import csv
import gzip
import io
import sys

import httpx
from sqlalchemy import text

from app.core.config import settings
from app.core.db import SessionLocal, engine
from app.models import db_models  # noqa: F401  (register tables)

# Bounding box around Hyderabad -> Srisailam (with margin). Keeps the import small & relevant.
# lat: 15.7 .. 17.7 , lon: 78.2 .. 79.1
BBOX = {"lat_min": 15.7, "lat_max": 17.7, "lon_min": 78.2, "lon_max": 79.1}

DOWNLOAD_URL = "https://opencellid.org/ocid/downloads"


def _in_bbox(lat: float, lon: float) -> bool:
    return (
        BBOX["lat_min"] <= lat <= BBOX["lat_max"]
        and BBOX["lon_min"] <= lon <= BBOX["lon_max"]
    )


def _download_mcc(mcc: int) -> bytes:
    if not settings.OPENCELLID_TOKEN:
        raise SystemExit(
            "OPENCELLID_TOKEN is not set. Register free at https://www.opencellid.org, get an API "
            "token, and put it in backend/.env — or pass --file with a CSV you downloaded manually."
        )
    params = {"token": settings.OPENCELLID_TOKEN, "type": "mcc", "file": f"{mcc}.csv.gz"}
    print(f"Downloading OpenCelliD data for MCC {mcc} ...")
    with httpx.Client(timeout=120.0, follow_redirects=True) as client:
        resp = client.get(DOWNLOAD_URL, params=params)
        resp.raise_for_status()
        return resp.content


def _iter_rows(raw_gz: bytes):
    with gzip.open(io.BytesIO(raw_gz), mode="rt", encoding="utf-8", errors="replace") as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            yield row


def _iter_rows_plain(path: str):
    with open(path, "r", encoding="utf-8", errors="replace") as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            yield row


def _insert_rows(rows_iter) -> int:
    inserted = 0
    batch: list[dict] = []
    BATCH = 2000
    insert_sql = text(
        """
        INSERT INTO cell_towers (radio, mcc, net, area, cell, lon, lat, range_m, samples, geom)
        VALUES (:radio, :mcc, :net, :area, :cell, :lon, :lat, :range_m, :samples,
                ST_SetSRID(ST_MakePoint(:lon, :lat), 4326))
        """
    )
    with SessionLocal() as db:
        for row in rows_iter:
            try:
                lat = float(row["lat"])
                lon = float(row["lon"])
            except (KeyError, ValueError, TypeError):
                continue
            if not _in_bbox(lat, lon):
                continue
            batch.append(
                {
                    "radio": (row.get("radio") or "").strip() or "LTE",
                    "mcc": int(row.get("mcc") or 0),
                    "net": int(row.get("net") or 0),
                    "area": int(row.get("area") or 0),
                    "cell": int(float(row.get("cell") or 0)),
                    "lon": lon,
                    "lat": lat,
                    "range_m": int(float(row.get("range") or 0)),
                    "samples": int(float(row.get("samples") or 0)),
                }
            )
            if len(batch) >= BATCH:
                db.execute(insert_sql, batch)
                db.commit()
                inserted += len(batch)
                print(f"  inserted {inserted} towers...", end="\r")
                batch = []
        if batch:
            db.execute(insert_sql, batch)
            db.commit()
            inserted += len(batch)
    print(f"\nInserted {inserted} towers within the demo bounding box.")
    return inserted


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--file", help="Load a local OpenCelliD CSV instead of downloading.")
    parser.add_argument("--truncate", action="store_true", help="Clear cell_towers first.")
    args = parser.parse_args()

    if args.truncate:
        with engine.begin() as conn:
            conn.execute(text("TRUNCATE cell_towers RESTART IDENTITY"))
        print("Cleared cell_towers.")

    if args.file:
        print(f"Loading from local file {args.file} ...")
        _insert_rows(_iter_rows_plain(args.file))
        return

    total = 0
    for mcc in settings.mcc_list:
        try:
            raw = _download_mcc(mcc)
            total += _insert_rows(_iter_rows(raw))
        except httpx.HTTPStatusError as e:
            print(f"Download for MCC {mcc} failed ({e.response.status_code}). "
                  f"Check your token / rate limit, or use --file.", file=sys.stderr)
    if total == 0:
        print("No towers loaded. Verify OPENCELLID_TOKEN and network access, or use --file.")


if __name__ == "__main__":
    main()
