# SignalSafe — Methodology, Assumptions & Limitations

This document explains **how SignalSafe estimates cellular signal along a route**, what data is
real, what is estimated, and the limits of those estimates. It exists because the project's data
policy is: *use real public data, never fabricate measurements or accuracy, and clearly label
every estimated value.*

---

## 1. Data sources (all real, all public)

| Data | Source | What it provides | License |
|------|--------|------------------|---------|
| Cell tower locations | **OpenCelliD** | lat/lon, radio type (GSM/UMTS/LTE/NR), MCC/MNC, coverage `range`, `samples` | CC BY-SA 4.0 |
| Road / route geometry | **OpenStreetMap** via **OSRM** | drivable route polyline between start & destination | ODbL |
| Terrain elevation | **Open-Meteo Elevation API** | elevation (m) at each sampled point | CC BY 4.0 |

**What does NOT exist freely:** per-location *measured* RSRP for the demo region. OpenCelliD stores
tower positions (its `averageSignal` column is almost always 0 — no measured signal). nPerf has
measured maps but the CSV is paid/quote-only with no public API. Therefore **we do not have ground-truth
signal labels**, so we do **not** train a supervised signal-strength regressor on fabricated labels.

---

## 2. The estimation model (physics-based, not fabricated)

Signal is estimated with a **log-distance path-loss propagation model**, a standard,
peer-reviewed RF engineering model — not invented numbers.

### 2.1 Per-tower received power

For a point `p` on the route and a nearby tower `t`:

```
PL(d) = PL(d0) + 10 · n · log10(d / d0) + X_terrain
RSRP_t(p) = EIRP_t − PL(d)
```

- `d` = great-circle distance from `p` to tower `t` (from real coordinates), floored at `d0 = 10 m`.
- `n` = path-loss exponent, chosen by **environment class** derived from real data:
  - urban / dense (many towers nearby): `n ≈ 3.0`
  - suburban: `n ≈ 3.5`
  - rural / open: `n ≈ 4.0`
  - forest / hilly (high terrain variance): `n ≈ 4.5`
- `EIRP_t` = assumed effective radiated power per radio type (documented constants, §2.3).
- `X_terrain` = extra loss when terrain **obstructs** the tower→point line (derived from the real
  Open-Meteo elevation profile — a simple terrain-blockage term, §2.4).

### 2.2 Combining towers

A phone camps on the **best** available cell, so the estimated RSRP at `p` is:

```
RSRP(p) = max over nearby towers t of RSRP_t(p)
```

Only towers within a search radius (default 15 km) and matching the selected operator/radio are
considered. If **no** tower is within range, or local tower `samples` are too sparse, the point is
labelled **Unknown** rather than guessed.

### 2.3 Assumed constants (documented, adjustable in `app/core/config.py`)

| Radio | Assumed EIRP (dBm) | Typical freq (MHz) |
|-------|--------------------|--------------------|
| NR (5G)  | 62 | 3500 |
| LTE (4G) | 60 | 1800 |
| UMTS (3G)| 58 | 2100 |
| GSM (2G) | 55 | 900 |

These are **assumptions**, not measurements. They are transparent constants and can be calibrated
if/when real measurements become available (see §4).

### 2.4 Terrain term

The elevation profile between tower and point is sampled. If intermediate terrain rises above the
straight line-of-sight between the tower antenna height and the phone, an obstruction penalty
(scaled by how far above LOS the terrain intrudes) is added to `X_terrain`. Hills/forests therefore
produce weaker estimates and more blackspots — reflecting reality qualitatively.

---

## 3. Output categories

Estimated RSRP (dBm) is mapped to a category **for display only**:

| Category   | RSRP range (dBm) |
|------------|------------------|
| Good       | ≥ −85 |
| Moderate   | −85 to −100 |
| Weak       | −100 to −110 |
| Blackspot  | < −110 |
| **Unknown**| no tower in range / insufficient data |

**Every category and dBm value in the UI is labelled `estimated`.** Unknown is a first-class
result, never silently filled in.

---

## 4. Optional calibration layer (honest ML, only if real data appears)

`app/services/calibration.py` contains an **optional** scikit-learn model that can learn a
correction between the physics estimate and *real measured* RSRP — **but it only activates if a
real measurement file is supplied** (`data/raw/measurements.csv`). With no real measurements, the
calibration is disabled and the raw physics estimate is used. This keeps a real ML path available
without ever fabricating training data.

---

## 5. Limitations (state these in any demo/report)

1. **Estimates, not measurements.** Values come from a propagation model over real tower/terrain
   data, not from measured drive tests. Treat them as planning guidance.
2. **Tower data is incomplete.** OpenCelliD is crowd-sourced; some towers are missing or stale, so
   real coverage may differ. Sparse areas are marked Unknown.
3. **EIRP/antenna assumptions are generic**, not operator-specific.
4. **Terrain model is simplified** (coarse elevation sampling, no building/foliage database).
5. **No indoor modelling**, no interference/load modelling.
6. **On-device live dBm** depends on the Android device and OS; some phones restrict or coarsen it.
   Where unavailable, the app shows the estimated value, labelled as such.

---

## 6. Reproducibility

- `scripts/load_opencellid.py` downloads/loads the real tower CSV for the region.
- `scripts/build_route_demo.py` builds the Hyderabad→Srisailam demo prediction end-to-end.
- All constants live in `app/core/config.py`. Nothing is hidden or hard-faked.
