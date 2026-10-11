"""SQLAlchemy / PostGIS ORM models."""
from __future__ import annotations

from datetime import datetime

from geoalchemy2 import Geometry
from sqlalchemy import Float, Integer, String, DateTime, Index, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class CellTower(Base):
    """A cell tower from OpenCelliD (real data). Geometry is a POINT in WGS84 (SRID 4326)."""

    __tablename__ = "cell_towers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    radio: Mapped[str] = mapped_column(String(8), index=True)   # GSM/UMTS/LTE/NR/CDMA
    mcc: Mapped[int] = mapped_column(Integer, index=True)
    net: Mapped[int] = mapped_column(Integer, index=True)       # MNC / operator
    area: Mapped[int] = mapped_column(Integer)                  # LAC/TAC
    cell: Mapped[int] = mapped_column(Integer)
    lon: Mapped[float] = mapped_column(Float)
    lat: Mapped[float] = mapped_column(Float)
    range_m: Mapped[int] = mapped_column(Integer, default=0)    # OpenCelliD 'range'
    samples: Mapped[int] = mapped_column(Integer, default=0)
    geom = mapped_column(Geometry(geometry_type="POINT", srid=4326), nullable=False)

    __table_args__ = (
        Index("ix_cell_towers_geom", "geom", postgresql_using="gist"),
    )


class CommunityReport(Base):
    """A crowdsourced signal reading contributed by an app user.

    These are REAL measurements from real devices (where the device reports dBm). They are kept
    separate from estimates and can later feed the optional calibration layer.
    """

    __tablename__ = "community_reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    lat: Mapped[float] = mapped_column(Float)
    lon: Mapped[float] = mapped_column(Float)
    rsrp_dbm: Mapped[float | None] = mapped_column(Float, nullable=True)
    radio: Mapped[str | None] = mapped_column(String(8), nullable=True)
    operator: Mapped[str | None] = mapped_column(String(32), nullable=True)
    source: Mapped[str] = mapped_column(String(16), default="device")  # 'device' = real measurement
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    geom = mapped_column(Geometry(geometry_type="POINT", srid=4326), nullable=False)

    __table_args__ = (
        Index("ix_community_reports_geom", "geom", postgresql_using="gist"),
    )


class EmergencyMessage(Base):
    """An emergency message queued offline on a device and synced when connectivity returns.

    Honest implementation: the backend LOGS/stores the message (acts as the sync target). It does
    not send SMS. This mirrors the abstract: 'stores emergency messages for synchronization after
    connectivity returns'.
    """

    __tablename__ = "emergency_messages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    client_id: Mapped[str] = mapped_column(String(64), index=True)   # device-generated uuid
    message: Mapped[str] = mapped_column(String(2000))
    lat: Mapped[float | None] = mapped_column(Float, nullable=True)
    lon: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at_device: Mapped[str | None] = mapped_column(String(40), nullable=True)
    synced_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
