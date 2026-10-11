# Data Sources & Licensing

SignalSafe uses only real, public data. Attribution is required and included here.

## 1. OpenCelliD — cell tower locations
- URL: https://www.opencellid.org
- Access: free account → API token → `https://opencellid.org/ocid/downloads?token=<TOKEN>&type=mcc&file=<MCC>.csv.gz`
  (India MCC = **404** and **405**). Full world file is ~100+ MB gzipped; prefer the per-MCC file.
- CSV columns (header row present):
  `radio, mcc, net, area, cell, unit, lon, lat, range, samples, changeable, created, updated, averageSignal`
  - `radio` ∈ {GSM, UMTS, LTE, NR, CDMA}
  - `net` = MNC (operator); India examples: Jio 405-854/857/..., Airtel 404-10/.., Vi, BSNL.
  - `range` = estimated coverage radius (m); `samples` = measurements behind the record.
  - `averageSignal` is almost always 0 → **OpenCelliD has no usable measured signal.**
- License: **CC BY-SA 4.0** — attribution + share-alike required.
- Attribution string: `Cell data © OpenCelliD contributors (CC BY-SA 4.0)`.

## 2. OpenStreetMap / OSRM — routing & map tiles
- Routing: public OSRM demo server `https://router.project-osrm.org` (demo only; self-host for production).
- Tiles: `https://tile.openstreetmap.org/{z}/{x}/{y}.png` — **respect the OSM tile usage policy**
  (low volume, valid User-Agent). For heavier use, use a tile provider or self-host.
- License: map data © OpenStreetMap contributors, **ODbL**.
- Attribution string: `Map data © OpenStreetMap contributors (ODbL)` — shown in the app map overlay.

## 3. Open-Meteo — elevation
- URL: `https://api.open-meteo.com/v1/elevation?latitude=...&longitude=...`
- Free, no key, batchable (up to ~100 coords/request).
- License: **CC BY 4.0**.
- Attribution string: `Elevation © Open-Meteo (CC BY 4.0)`.

## 4. nPerf (measured signal) — NOT used
- Investigated per project requirement. nPerf measured coverage CSV is **paid / quote-only**, with
  no public API and no Bachupally-specific free dataset. **Not used.** This is the reason SignalSafe
  outputs labelled estimates instead of measured values. (See METHODOLOGY.md §1.)

---

### Where attribution appears in the app
- Map screen: persistent bottom overlay with OSM + OpenCelliD + Open-Meteo credits.
- About screen: full licensing text.
- API: `GET /meta/attribution` returns the attribution block as JSON.
