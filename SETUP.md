# SignalSafe — Full Setup & Run Guide

Everything is built and verified (backend imports clean; mobile passes `tsc`). Follow these steps to
run it, then push to GitHub.

---

## 0. What you need installed
- **Python 3.11+** (for backend)
- **Docker** (easiest way to get PostGIS) — or your own PostgreSQL+PostGIS
- **Node.js 18+** (for mobile)
- **Android Studio + SDK (Platform 35)** and an emulator or a real Android phone
- A free **OpenCelliD API token** (https://www.opencellid.org → register → API token) for real
  tower data. Optional: you can instead download a CSV manually and load with `--file`.

---

## 1. Backend (FastAPI + PostGIS)

```bash
cd backend
python -m venv .venv
. .venv/Scripts/activate            # Windows (Git Bash / PowerShell: .venv\Scripts\activate)
pip install -r requirements.txt
copy .env.example .env              # macOS/Linux: cp .env.example .env
# edit .env -> set OPENCELLID_TOKEN

docker compose up -d db             # starts PostGIS on localhost:5432
python -m scripts.init_db          # creates PostGIS extension + tables
python -m scripts.load_opencellid  # loads REAL towers for India near the demo route
python -m scripts.seed_community   # (optional) a few demo community points

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Check it: open http://localhost:8000/health (should show `tower_count > 0` after loading).
Try the demo prediction from the CLI: `python -m scripts.build_route_demo`

> No OpenCelliD token yet? Download a country CSV from opencellid.org and run:
> `python -m scripts.load_opencellid --file path\to\404.csv`

---

## 2. Mobile (React Native, Android)

```bash
cd mobile
npm install
```

Edit `src/config.ts` → `API_BASE_URL`:
- Emulator: `http://10.0.2.2:8000` (default)
- Real phone (same Wi-Fi): `http://<your-PC-LAN-IP>:8000`  (get IP via `ipconfig`)

Run:
```bash
npm start           # terminal 1 (Metro)
npm run android     # terminal 2 (build + install)
```

First launch asks for Location + Phone permissions (needed for real signal dBm). On an emulator the
live signal falls back to a labelled estimate — that's expected.

---

## 3. Demo flow (what to show)
1. **Plan** tab → start "Hyderabad", destination "Srisailam" → **Analyze connectivity**.
2. See the colour-coded route, the connectivity score, alternative routes, the recommended one, and
   green signal-recovery markers. Tap **Download for offline use**.
3. **Travel** tab → live GPS dot on the map, current signal (real dBm on a phone, else estimate).
4. **Emergency** tab → type a message while "offline" → it queues → turn connectivity back on → it
   auto-syncs (check backend `GET /emergency/messages`).
5. **Community** tab → contribute your current signal; see points on the map.
6. **About** tab → methodology, data sources, honest estimate disclaimer.

---

## 4. Push to GitHub (you do this)

From the `signalsafe` folder:

```bash
cd signalsafe
git init
git add .
git commit -m "SignalSafe: RN Android app + FastAPI/PostGIS backend + physics RSRP estimator"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

Notes:
- `.gitignore` already excludes `node_modules/`, `.venv/`, `.env`, and downloaded datasets, but KEEPS
  the Gradle wrapper jar and the debug keystore (both needed to build).
- Don't commit your real `.env` (it's ignored) — share the token separately if needed.

---

## 5. Honesty summary (for your report/viva)
- Real data: OpenCelliD towers, OpenStreetMap routing/tiles, Open-Meteo elevation.
- No free **measured** signal data exists for the route (nPerf is paid), so signal is **estimated**
  via a documented physics propagation model, always labelled, with **Unknown** where data is thin.
- **No fabricated training data. No fabricated accuracy claims.** See `docs/METHODOLOGY.md`.
