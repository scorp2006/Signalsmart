import AsyncStorage from '@react-native-async-storage/async-storage';
import { EmergencyMessage, RoutePrediction } from './types';

const KEYS = {
  offlineRoute: 'ss:offlineRoute',
  emergencyQueue: 'ss:emergencyQueue',
};

/** Save a predicted route for offline use (pre-travel download). */
export async function saveOfflineRoute(pred: RoutePrediction): Promise<void> {
  await AsyncStorage.setItem(
    KEYS.offlineRoute,
    JSON.stringify({ savedAt: new Date().toISOString(), prediction: pred }),
  );
}

export async function loadOfflineRoute(): Promise<{
  savedAt: string;
  prediction: RoutePrediction;
} | null> {
  const raw = await AsyncStorage.getItem(KEYS.offlineRoute);
  return raw ? JSON.parse(raw) : null;
}

export async function clearOfflineRoute(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.offlineRoute);
}

/** Emergency messages queued while offline. */
export async function getEmergencyQueue(): Promise<EmergencyMessage[]> {
  const raw = await AsyncStorage.getItem(KEYS.emergencyQueue);
  return raw ? JSON.parse(raw) : [];
}

export async function enqueueEmergency(msg: EmergencyMessage): Promise<EmergencyMessage[]> {
  const q = await getEmergencyQueue();
  q.unshift(msg);
  await AsyncStorage.setItem(KEYS.emergencyQueue, JSON.stringify(q));
  return q;
}

export async function setEmergencyQueue(q: EmergencyMessage[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.emergencyQueue, JSON.stringify(q));
}
