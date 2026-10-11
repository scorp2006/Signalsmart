"""Pydantic API schemas (request/response)."""
from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field

Category = Literal["Good", "Moderate", "Weak", "Blackspot", "Unknown"]


class Coord(BaseModel):
    lat: float
    lon: float


class RoutePredictRequest(BaseModel):
    start: Coord
    end: Coord
    operator_net: Optional[int] = Field(
        default=None, description="OpenCelliD MNC to filter towers by operator; None = any."
    )
    radio: Optional[str] = Field(default=None, description="GSM/UMTS/LTE/NR; None = any.")


class PredictedPoint(BaseModel):
    lat: float
    lon: float
    distance_m: float = Field(description="Distance along the route from start, metres.")
    elevation_m: Optional[float] = None
    rsrp_dbm_estimated: Optional[float] = Field(
        default=None, description="Estimated RSRP (dBm). None when Unknown."
    )
    category: Category
    nearest_tower_distance_m: Optional[float] = None
    is_estimate: bool = True


class RecoveryMarker(BaseModel):
    """A point where connectivity is estimated to RECOVER after a weak/blackspot stretch."""

    lat: float
    lon: float
    distance_m: float
    category: Category


class RoutePrediction(BaseModel):
    route_name: Optional[str] = None
    distance_m: float
    duration_s: Optional[float] = None
    polyline: list[list[float]] = Field(description="[[lat,lon], ...] drivable route geometry.")
    points: list[PredictedPoint]
    recovery_markers: list[RecoveryMarker]
    summary: dict
    attribution: dict
    disclaimer: str


class AlternativeRoute(BaseModel):
    label: str
    distance_m: float
    duration_s: Optional[float]
    connectivity_score: float = Field(description="0..100, higher = better estimated connectivity.")
    blackspot_fraction: float
    prediction: RoutePrediction


class RouteRecommendation(BaseModel):
    recommended_index: int
    reason: str
    routes: list[AlternativeRoute]


class CommunityReportIn(BaseModel):
    lat: float
    lon: float
    rsrp_dbm: Optional[float] = None
    radio: Optional[str] = None
    operator: Optional[str] = None


class CommunityReportOut(CommunityReportIn):
    id: int
    source: str


class EmergencyMessageIn(BaseModel):
    client_id: str
    message: str
    lat: Optional[float] = None
    lon: Optional[float] = None
    created_at_device: Optional[str] = None


class EmergencySyncRequest(BaseModel):
    messages: list[EmergencyMessageIn]


class EmergencySyncResponse(BaseModel):
    synced_ids: list[str]
    count: int
