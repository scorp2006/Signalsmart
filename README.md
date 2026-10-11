# SignalSafe — AI-Powered Travel Safety & Connectivity Platform

SignalSafe helps travellers prepare for low-connectivity areas (hills, forests, highways,
villages) **before** they travel and supports them **during** travel.

- **Before travel:** analyses a route using real cell-tower data (OpenCelliD), road geometry
  (OpenStreetMap) and terrain (Open-Meteo elevation), then **estimates** cellular signal along
  the route with a physics-based propagation model. It flags weak zones / blackspots, suggests
  connectivity-aware routes, marks likely signal-recovery points, and prompts offline download.
- **During travel:** offline navigation, live GPS + (where the device permits) real cellular
  signal strength monitoring, an offline emergency-message queue that auto-syncs when
  connectivity returns, and a community coverage map that improves future estimates.

> ### ⚠️ Honesty / data note (read this)
> Freely downloadable **measured** signal data for the demo region does **not** exist
> (OpenCelliD provides *tower locations*, not signal measurements; nPerf's measured data is
> paid/quote-only). Therefore SignalSafe outputs **estimated** signal values from a documented
> physics model, **clearly labelled as estimates**, and marks data-poor areas as **Unknown**.
> **No fake training data is generated and no accuracy claims are fabricated.**
> See [`docs/METHODOLOGY.md`](docs/METHODOLOGY.md) for the full model, assumptions and limitations.

---

## Repository layout

```
signalsafe/
├── backend/      FastAPI + PostgreSQL/PostGIS. Data pipeline + RSRP estimator + REST API.
├── mobile/       Bare React Native Android app (real dBm via native module; estimate fallback).
├── docs/         METHODOLOGY.md, LIMITATIONS, data sources & licensing.
└── README.md     (this file)
```

## Tech stack

| Layer    | Tech |
|----------|------|
| Mobile   | React Native (bare, Android), react-native-maps (OSM tiles), AsyncStorage, native signal module |
| Backend  | FastAPI, SQLAlchemy, GeoAlchemy2, PostgreSQL + PostGIS |
| ML/Model | Physics-based log-distance path-loss RSRP estimator (scikit-learn optional calibration layer) |
| Data     | OpenCelliD (towers), OpenStreetMap / OSRM (routing), Open-Meteo (elevation) |

## Quick start

1. **Backend** — see [`backend/README.md`](backend/README.md). TL;DR:
   ```bash
   cd backend
   python -m venv .venv && . .venv/Scripts/activate   # Windows
   pip install -r requirements.txt
   cp .env.example .env            # edit DB creds + OpenCelliD token
   # start PostGIS (docker compose up -d db) or point .env at your own PostGIS
   python -m scripts.init_db
   python -m scripts.load_opencellid        # downloads/loads real towers for the region
   uvicorn app.main:app --reload
   ```
   API docs then live at http://localhost:8000/docs

2. **Mobile** — see [`mobile/README.md`](mobile/README.md). TL;DR:
   ```bash
   cd mobile
   npm install
   # set API_BASE_URL in src/config.ts to your machine's LAN IP:8000
   npx react-native run-android      # real device or emulator
   ```

## Status of features

| Feature | State |
|---|---|
| Route search (start→dest, custom routes) | ✅ working |
| ML/physics prediction of weak/blackspot zones | ✅ working (estimated, labelled) |
| Color-coded connectivity map (Good/Moderate/Weak/Blackspot/Unknown) | ✅ working |
| Connectivity-aware route recommendation | ✅ working |
| Signal-recovery markers | ✅ working |
| Offline route/data download | ✅ working |
| Live GPS monitoring | ✅ working |
| Live real dBm monitoring | ✅ on real device (native module); labelled estimate fallback otherwise |
| Emergency message offline queue + auto-sync | ✅ working |
| Community coverage map | ✅ working (contribute + view) |

## Attribution / licensing

- Cell data © OpenCelliD contributors, **CC BY-SA 4.0**.
- Map data © OpenStreetMap contributors, **ODbL**.
- Elevation via Open-Meteo (CC BY 4.0).
See [`docs/DATA_SOURCES.md`](docs/DATA_SOURCES.md).
