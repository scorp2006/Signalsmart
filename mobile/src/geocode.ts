/**
 * Simple place -> coordinate lookup using OpenStreetMap Nominatim (real, free).
 * Respect the usage policy: low volume + a descriptive User-Agent.
 */
import { Coord } from './types';

const NOMINATIM = 'https://nominatim.openstreetmap.org/search';

export interface Place {
  name: string;
  lat: number;
  lon: number;
}

export async function searchPlaces(query: string): Promise<Place[]> {
  if (!query.trim()) return [];
  const url = `${NOMINATIM}?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=in`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'SignalSafe/1.0 (student project; connectivity planning)',
      Accept: 'application/json',
    },
  });
  if (!res.ok) throw new Error(`Geocoding failed: ${res.status}`);
  const data = (await res.json()) as any[];
  return data.map((d) => ({
    name: d.display_name as string,
    lat: parseFloat(d.lat),
    lon: parseFloat(d.lon),
  }));
}

export function toCoord(p: Place): Coord {
  return { lat: p.lat, lon: p.lon };
}
