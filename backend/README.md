# SignalSafe Backend (FastAPI + PostGIS)

Estimates cellular connectivity along a route from **real** data (OpenCelliD towers, OSM routing,
Open-Meteo elevation) using a physics-based propagation model. Outputs are **estimates**, labelled
as such; data-poor areas are **Unknown**. See [`../docs/METHODOLOGY.md`](../docs/METHODOLOGY.md).

## Prerequisites
- Python 3.11+
- A PostgreSQL + PostGIS database. Easiest: Docker (`docker compose up -d db`).
- (Optional but recommended) a free OpenCelliD API token for real tower data.

## Setup

```bash
cd backend
python -m venv .venv
# Windows:
. .venv/Scripts/activate
# macOS/Linux:
# source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env          # Windows: copy .env.example .env
```

Edit `.env`:
- `DATABASE_URL` — leave as-is if using the bundled docker compose.
- `OPENCELLID_TOKEN` — paste your token (register at https://www.opencellid.org).

## Start the database (Docker)

```bash
docker compose up -d db
```

Or point `DATABASE_URL` at any existing PostGIS instance.

## Initialise schema + load real towers

```bash
python -m scripts.init_db
python -m scripts.load_opencellid         # downloads India MCC 404/405, filtered to the demo bbox
# No token? Download a CSV manually from opencellid.org and:
# python -m scripts.load_opencellid --file path/to/404.csv
```

## Run the API

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- Interactive docs: http://localhost:8000/docs
- Health / tower count: http://localhost:8000/health

> **Note for the mobile app:** the phone must reach your machine over the LAN. Use your computer's
> LAN IP (e.g. `http://192.168.1.5:8000`) in `mobile/src/config.ts`, not `localhost`.

## Try the demo prediction (CLI)

```bash
python -m scripts.build_route_demo
```

## Optionally seed demo community reports

```bash
python -m scripts.seed_community
```

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET  | `/health` | status + tower count |
| GET  | `/meta/attribution` | data-source credits + disclaimer |
| GET  | `/meta/demo-route` | Hyderabad→Srisailam coords |
| POST | `/predict/route` | per-point estimated connectivity for a route |
| POST | `/recommend/route` | alternatives + best-connected recommendation |
| POST | `/community/report` | submit a real device signal reading |
| GET  | `/community/reports` | list community readings |
| POST | `/emergency/sync` | sync queued offline emergency messages |
| GET  | `/emergency/messages` | list synced emergency messages |

## Honesty guarantees
- No synthetic/fake training data is generated anywhere.
- No fabricated accuracy metrics are claimed.
- Every signal value returned is an estimate (`is_estimate: true`); Unknown is returned when data
  is insufficient.
