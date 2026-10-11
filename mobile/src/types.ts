export type Category = 'Good' | 'Moderate' | 'Weak' | 'Blackspot' | 'Unknown';

export interface Coord {
  lat: number;
  lon: number;
}

export interface PredictedPoint {
  lat: number;
  lon: number;
  distance_m: number;
  elevation_m: number | null;
  rsrp_dbm_estimated: number | null;
  category: Category;
  nearest_tower_distance_m: number | null;
  is_estimate: boolean;
}

export interface RecoveryMarker {
  lat: number;
  lon: number;
  distance_m: number;
  category: Category;
}

export interface RouteSummary {
  total_points: number;
  counts: Record<Category, number>;
  blackspot_fraction: number;
  connectivity_score: number;
}

export interface RoutePrediction {
  route_name: string | null;
  distance_m: number;
  duration_s: number | null;
  polyline: number[][]; // [[lat, lon], ...]
  points: PredictedPoint[];
  recovery_markers: RecoveryMarker[];
  summary: RouteSummary;
  attribution: Record<string, string>;
  disclaimer: string;
}

export interface AlternativeRoute {
  label: string;
  distance_m: number;
  duration_s: number | null;
  connectivity_score: number;
  blackspot_fraction: number;
  prediction: RoutePrediction;
}

export interface RouteRecommendation {
  recommended_index: number;
  reason: string;
  routes: AlternativeRoute[];
}

export interface EmergencyMessage {
  client_id: string;
  message: string;
  lat: number | null;
  lon: number | null;
  created_at_device: string | null;
  synced: boolean;
}

export interface CommunityReport {
  id?: number;
  lat: number;
  lon: number;
  rsrp_dbm: number | null;
  radio: string | null;
  operator: string | null;
  source?: string;
}
