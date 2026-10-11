"""REST API endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core import config
from app.core.db import get_db
from app.models import schemas
from app.models.db_models import CommunityReport, EmergencyMessage
from app.services import prediction, towers
from app.services.routing import RoutingError

router = APIRouter()


@router.get("/health")
def health(db: Session = Depends(get_db)):
    try:
        n = towers.tower_count(db)
        db_ok = True
    except Exception:  # noqa: BLE001
        n, db_ok = 0, False
    return {"status": "ok", "db": db_ok, "tower_count": n}


@router.get("/meta/attribution")
def attribution():
    return config.ATTRIBUTION


@router.get("/meta/demo-route")
def demo_route():
    return config.DEMO_ROUTE


@router.post("/predict/route", response_model=schemas.RoutePrediction)
async def predict_route(req: schemas.RoutePredictRequest, db: Session = Depends(get_db)):
    try:
        from app.services.routing import get_routes

        routes = await get_routes(req.start.lat, req.start.lon, req.end.lat, req.end.lon, alternatives=False)
    except RoutingError as e:
        raise HTTPException(status_code=502, detail=str(e))
    r = routes[0]
    return await prediction.predict_route(
        db, r["polyline"], r["distance_m"], r["duration_s"], req.operator_net, req.radio
    )


@router.post("/recommend/route", response_model=schemas.RouteRecommendation)
async def recommend_route(req: schemas.RoutePredictRequest, db: Session = Depends(get_db)):
    try:
        return await prediction.recommend_routes(
            db, req.start.lat, req.start.lon, req.end.lat, req.end.lon, req.operator_net, req.radio
        )
    except RoutingError as e:
        raise HTTPException(status_code=502, detail=str(e))


# ---------------------------------------------------------------------------
# Community coverage (crowdsourced REAL measurements)
# ---------------------------------------------------------------------------
@router.post("/community/report", response_model=schemas.CommunityReportOut)
def community_report(body: schemas.CommunityReportIn, db: Session = Depends(get_db)):
    from geoalchemy2.elements import WKTElement

    rec = CommunityReport(
        lat=body.lat, lon=body.lon, rsrp_dbm=body.rsrp_dbm, radio=body.radio,
        operator=body.operator, source="device",
        geom=WKTElement(f"POINT({body.lon} {body.lat})", srid=4326),
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return schemas.CommunityReportOut(
        id=rec.id, lat=rec.lat, lon=rec.lon, rsrp_dbm=rec.rsrp_dbm,
        radio=rec.radio, operator=rec.operator, source=rec.source,
    )


@router.get("/community/reports")
def community_reports(db: Session = Depends(get_db), limit: int = 500):
    rows = db.execute(
        text("SELECT id, lat, lon, rsrp_dbm, radio, operator, source FROM community_reports "
             "ORDER BY id DESC LIMIT :limit"),
        {"limit": limit},
    ).fetchall()
    return [
        {
            "id": r.id, "lat": r.lat, "lon": r.lon, "rsrp_dbm": r.rsrp_dbm,
            "radio": r.radio, "operator": r.operator, "source": r.source,
        }
        for r in rows
    ]


# ---------------------------------------------------------------------------
# Emergency message sync (offline queue -> backend when connectivity returns)
# ---------------------------------------------------------------------------
@router.post("/emergency/sync", response_model=schemas.EmergencySyncResponse)
def emergency_sync(body: schemas.EmergencySyncRequest, db: Session = Depends(get_db)):
    synced = []
    for m in body.messages:
        exists = db.execute(
            text("SELECT 1 FROM emergency_messages WHERE client_id = :cid"),
            {"cid": m.client_id},
        ).first()
        if exists:
            synced.append(m.client_id)
            continue
        db.add(
            EmergencyMessage(
                client_id=m.client_id, message=m.message, lat=m.lat, lon=m.lon,
                created_at_device=m.created_at_device,
            )
        )
        synced.append(m.client_id)
    db.commit()
    return schemas.EmergencySyncResponse(synced_ids=synced, count=len(synced))


@router.get("/emergency/messages")
def emergency_messages(db: Session = Depends(get_db), limit: int = 200):
    rows = db.execute(
        text("SELECT client_id, message, lat, lon, created_at_device FROM emergency_messages "
             "ORDER BY id DESC LIMIT :limit"),
        {"limit": limit},
    ).fetchall()
    return [
        {"client_id": r.client_id, "message": r.message, "lat": r.lat, "lon": r.lon,
         "created_at_device": r.created_at_device}
        for r in rows
    ]
