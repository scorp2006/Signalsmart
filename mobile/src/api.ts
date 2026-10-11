import { API_BASE_URL } from './config';
import {
  Coord,
  RoutePrediction,
  RouteRecommendation,
  CommunityReport,
  EmergencyMessage,
} from './types';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }
  return (await res.json()) as T;
}

export const api = {
  health: () => request<{ status: string; db: boolean; tower_count: number }>('/health'),

  attribution: () => request<Record<string, string>>('/meta/attribution'),

  predictRoute: (start: Coord, end: Coord, operator_net?: number, radio?: string) =>
    request<RoutePrediction>('/predict/route', {
      method: 'POST',
      body: JSON.stringify({ start, end, operator_net, radio }),
    }),

  recommendRoute: (start: Coord, end: Coord, operator_net?: number, radio?: string) =>
    request<RouteRecommendation>('/recommend/route', {
      method: 'POST',
      body: JSON.stringify({ start, end, operator_net, radio }),
    }),

  submitCommunityReport: (r: CommunityReport) =>
    request<CommunityReport>('/community/report', {
      method: 'POST',
      body: JSON.stringify(r),
    }),

  communityReports: () => request<CommunityReport[]>('/community/reports'),

  syncEmergency: (messages: EmergencyMessage[]) =>
    request<{ synced_ids: string[]; count: number }>('/emergency/sync', {
      method: 'POST',
      body: JSON.stringify({
        messages: messages.map((m) => ({
          client_id: m.client_id,
          message: m.message,
          lat: m.lat,
          lon: m.lon,
          created_at_device: m.created_at_device,
        })),
      }),
    }),
};
