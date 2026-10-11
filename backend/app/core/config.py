"""Central configuration. All tunable constants live here — nothing is hidden or hard-faked.

The RSRP estimation constants are documented assumptions (see docs/METHODOLOGY.md), not
measurements. They are transparent and adjustable.
"""
from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # --- Database ---
    DATABASE_URL: str = "postgresql+psycopg2://signalsafe:signalsafe@localhost:5432/signalsafe"

    # --- OpenCelliD ---
    OPENCELLID_TOKEN: str = ""
    OCID_MCC_LIST: str = "404,405"  # India

    # --- External services ---
    OSRM_BASE_URL: str = "https://router.project-osrm.org"
    OPEN_METEO_ELEVATION_URL: str = "https://api.open-meteo.com/v1/elevation"

    # --- API ---
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000

    @property
    def mcc_list(self) -> list[int]:
        return [int(x) for x in self.OCID_MCC_LIST.split(",") if x.strip()]


settings = Settings()


# ---------------------------------------------------------------------------
# RSRP / propagation model constants (documented assumptions, see METHODOLOGY.md)
# ---------------------------------------------------------------------------

# Assumed effective radiated power (dBm) and representative frequency (MHz) per radio type.
RADIO_PROFILE: dict[str, dict[str, float]] = {
    "NR":   {"eirp_dbm": 62.0, "freq_mhz": 3500.0, "tx_height_m": 30.0},
    "LTE":  {"eirp_dbm": 60.0, "freq_mhz": 1800.0, "tx_height_m": 30.0},
    "UMTS": {"eirp_dbm": 58.0, "freq_mhz": 2100.0, "tx_height_m": 30.0},
    "GSM":  {"eirp_dbm": 55.0, "freq_mhz": 900.0,  "tx_height_m": 30.0},
    "CDMA": {"eirp_dbm": 55.0, "freq_mhz": 850.0,  "tx_height_m": 30.0},
}
DEFAULT_RADIO = "LTE"

# Path-loss exponent per environment class (dimensionless).
PATH_LOSS_EXPONENT = {
    "urban": 3.0,
    "suburban": 3.5,
    "rural": 4.0,
    "forest_hilly": 4.5,
}

# Reference distance for path loss (metres) and min clamp distance.
REF_DISTANCE_M = 10.0
MIN_DISTANCE_M = 10.0

# Phone antenna height (metres) used for terrain line-of-sight check.
RX_HEIGHT_M = 1.5

# Tower search radius when estimating a point's signal (metres).
TOWER_SEARCH_RADIUS_M = 15000.0

# A point is 'Unknown' if the nearest usable tower is farther than this (metres)
# or no tower of the requested operator/radio exists in range.
MAX_USABLE_TOWER_DISTANCE_M = 15000.0

# Minimum OpenCelliD 'samples' for a tower to count as reliable.
MIN_TOWER_SAMPLES = 1

# Terrain obstruction penalty scaling (dB per metre of intrusion above line-of-sight),
# capped to avoid unrealistic values.
TERRAIN_PENALTY_DB_PER_M = 0.4
TERRAIN_PENALTY_MAX_DB = 25.0

# RSRP -> category thresholds (dBm). Display only; every value is labelled 'estimated'.
CATEGORY_THRESHOLDS = {
    "Good": -85.0,       # >= -85
    "Moderate": -100.0,  # -85 .. -100
    "Weak": -110.0,      # -100 .. -110
    # < -110 => Blackspot
}

# Route sampling: distance between analysis points along the route (metres).
ROUTE_SAMPLE_SPACING_M = 500.0

# Demo route (Hyderabad -> Srisailam). lon,lat order for OSRM.
DEMO_ROUTE = {
    "name": "Hyderabad → Srisailam",
    "start": {"name": "Hyderabad", "lat": 17.3850, "lon": 78.4867},
    "end": {"name": "Srisailam", "lat": 16.0733, "lon": 78.8687},
}

ATTRIBUTION = {
    "cell": "Cell data © OpenCelliD contributors (CC BY-SA 4.0)",
    "map": "Map data © OpenStreetMap contributors (ODbL)",
    "elevation": "Elevation © Open-Meteo (CC BY 4.0)",
    "disclaimer": (
        "Signal values are ESTIMATES from a physics-based propagation model over real tower and "
        "terrain data, not measured values. Areas lacking data are marked Unknown."
    ),
}
