"""Geo helpers: distances and route resampling."""
from __future__ import annotations

import math

EARTH_RADIUS_M = 6_371_000.0


def haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance in metres between two WGS84 points."""
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlam / 2) ** 2
    return 2 * EARTH_RADIUS_M * math.asin(math.sqrt(a))


def resample_polyline(polyline: list[list[float]], spacing_m: float) -> list[dict]:
    """Resample a [[lat,lon],...] polyline into evenly spaced points.

    Returns list of {lat, lon, distance_m} where distance_m is cumulative distance from start.
    """
    if not polyline:
        return []
    out: list[dict] = [{"lat": polyline[0][0], "lon": polyline[0][1], "distance_m": 0.0}]
    carried = 0.0
    total = 0.0
    for (lat1, lon1), (lat2, lon2) in zip(polyline, polyline[1:]):
        seg = haversine_m(lat1, lon1, lat2, lon2)
        if seg == 0:
            continue
        dist_from_seg_start = spacing_m - carried
        while dist_from_seg_start <= seg:
            t = dist_from_seg_start / seg
            lat = lat1 + (lat2 - lat1) * t
            lon = lon1 + (lon2 - lon1) * t
            total_here = total + dist_from_seg_start
            out.append({"lat": lat, "lon": lon, "distance_m": round(total_here, 1)})
            dist_from_seg_start += spacing_m
        carried = seg - (dist_from_seg_start - spacing_m)
        total += seg
    # ensure the final point is included
    last = polyline[-1]
    if out[-1]["lat"] != last[0] or out[-1]["lon"] != last[1]:
        out.append({"lat": last[0], "lon": last[1], "distance_m": round(total, 1)})
    return out
