import React, { useEffect, useRef, useState } from 'react';
import { PermissionsAndroid, Platform, StyleSheet, Text, View } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import NetInfo from '@react-native-community/netinfo';
import { MONITOR_INTERVAL_MS } from '../config';
import { loadOfflineRoute } from '../storage';
import { readDeviceSignal, LiveSignal } from '../signal';
import { categoryColor, categoryLabel, colors, spacing } from '../theme';
import { Category, RoutePrediction } from '../types';
import { ConnectivityMap } from '../components/ConnectivityMap';
import { EstimateBanner } from '../components/EstimateBanner';

function haversine(aLat: number, aLon: number, bLat: number, bLon: number) {
  const R = 6371000;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLon = ((bLon - aLon) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

function dbmToCategory(dbm: number): Category {
  if (dbm >= -85) return 'Good';
  if (dbm >= -100) return 'Moderate';
  if (dbm >= -110) return 'Weak';
  return 'Blackspot';
}

export function TravelScreen() {
  const [offline, setOffline] = useState<RoutePrediction | null>(null);
  const [loc, setLoc] = useState<{ lat: number; lon: number } | null>(null);
  const [live, setLive] = useState<LiveSignal | null>(null);
  const [online, setOnline] = useState<boolean>(true);
  const [nearestEstimate, setNearestEstimate] = useState<{
    category: Category;
    dbm: number | null;
  } | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadOfflineRoute().then((r) => setOffline(r?.prediction ?? null));
    const unsub = NetInfo.addEventListener((s) => setOnline(!!s.isConnected));
    requestAndStart();
    return () => {
      if (timer.current) clearInterval(timer.current);
      unsub();
    };
  }, []);

  async function requestAndStart() {
    if (Platform.OS === 'android') {
      await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
      ]);
    }
    tick();
    timer.current = setInterval(tick, MONITOR_INTERVAL_MS);
  }

  function tick() {
    Geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setLoc({ lat, lon });
        updateNearestEstimate(lat, lon);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 3000 },
    );
    readDeviceSignal().then(setLive);
  }

  function updateNearestEstimate(lat: number, lon: number) {
    if (!offline?.points?.length) {
      setNearestEstimate(null);
      return;
    }
    let best = offline.points[0];
    let bestD = Infinity;
    for (const p of offline.points) {
      const d = haversine(lat, lon, p.lat, p.lon);
      if (d < bestD) {
        bestD = d;
        best = p;
      }
    }
    setNearestEstimate({ category: best.category, dbm: best.rsrp_dbm_estimated });
  }

  // What to show as "current signal": real device dBm if available, else labelled estimate.
  const showingDevice = live?.source === 'device' && live.dbm !== null;
  const currentDbm = showingDevice ? live!.dbm! : nearestEstimate?.dbm ?? null;
  const currentCategory: Category = showingDevice
    ? dbmToCategory(live!.dbm!)
    : nearestEstimate?.category ?? 'Unknown';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Live travel</Text>

      <View style={styles.statusRow}>
        <View style={[styles.pill, { backgroundColor: online ? colors.success : colors.danger }]}>
          <Text style={styles.pillText}>{online ? 'Online' : 'Offline'}</Text>
        </View>
        <View style={[styles.pill, { backgroundColor: colors.surfaceAlt }]}>
          <Text style={styles.pillText}>
            {offline ? 'Offline route loaded' : 'No offline route'}
          </Text>
        </View>
      </View>

      <View style={styles.signalCard}>
        <Text style={styles.signalLabel}>Current signal</Text>
        <View style={styles.signalRow}>
          <View style={[styles.catDot, { backgroundColor: categoryColor[currentCategory] }]} />
          <Text style={styles.signalValue}>
            {currentDbm !== null ? `${currentDbm} dBm` : '—'}
          </Text>
          <Text style={styles.signalCat}>{categoryLabel[currentCategory]}</Text>
        </View>
        <Text style={styles.signalSource}>
          {showingDevice
            ? `Measured on device${live?.radio ? ` (${live.radio})` : ''}`
            : 'Estimated (device reading unavailable — modelled value)'}
        </Text>
      </View>

      {!showingDevice && <EstimateBanner />}

      <View style={styles.mapWrap}>
        <ConnectivityMap
          points={offline?.points ?? []}
          recovery={offline?.recovery_markers ?? []}
          liveLocation={loc}
        />
      </View>

      <Text style={styles.hint}>
        Live dBm reads the real value on supported Android devices. On emulators or where the OS
        restricts it, SignalSafe shows the nearest estimated value from your downloaded route.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing(2), backgroundColor: colors.bg },
  title: { color: colors.text, fontSize: 22, fontWeight: '800', marginBottom: spacing(1) },
  statusRow: { flexDirection: 'row', gap: spacing(1), marginBottom: spacing(1) },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, marginRight: spacing(1) },
  pillText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  signalCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing(1.5),
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing(1),
  },
  signalLabel: { color: colors.textMuted, fontSize: 12 },
  signalRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  catDot: { width: 14, height: 14, borderRadius: 7, marginRight: 8 },
  signalValue: { color: colors.text, fontSize: 26, fontWeight: '800', marginRight: 10 },
  signalCat: { color: colors.textMuted, fontSize: 16 },
  signalSource: { color: colors.textMuted, fontSize: 11, marginTop: 4 },
  mapWrap: { flex: 1, marginVertical: spacing(1) },
  hint: { color: colors.textMuted, fontSize: 11, lineHeight: 15 },
});
