import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import MapView, { Circle, UrlTile } from 'react-native-maps';
import { api } from '../api';
import { readDeviceSignal } from '../signal';
import { categoryColor, colors, spacing } from '../theme';
import { Category, CommunityReport } from '../types';

function dbmToCategory(dbm: number | null): Category {
  if (dbm === null) return 'Blackspot';
  if (dbm >= -85) return 'Good';
  if (dbm >= -100) return 'Moderate';
  if (dbm >= -110) return 'Weak';
  return 'Blackspot';
}

export function CommunityScreen() {
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    try {
      setReports(await api.communityReports());
    } catch (e: any) {
      Alert.alert('Could not load community data', String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function getLocation(): Promise<{ lat: number; lon: number } | null> {
    return new Promise((resolve) => {
      Geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 6000, maximumAge: 5000 },
      );
    });
  }

  async function contribute() {
    setSubmitting(true);
    try {
      const where = await getLocation();
      if (!where) {
        Alert.alert('Location needed', 'Enable location to contribute a reading.');
        return;
      }
      const sig = await readDeviceSignal();
      // Only submit a REAL device reading; never fabricate.
      await api.submitCommunityReport({
        lat: where.lat,
        lon: where.lon,
        rsrp_dbm: sig.dbm,
        radio: sig.radio,
        operator: null,
      });
      Alert.alert(
        'Thanks!',
        sig.dbm !== null
          ? `Shared your measured signal (${sig.dbm} dBm).`
          : 'Shared your location with no-signal report.',
      );
      await load();
    } catch (e: any) {
      Alert.alert('Could not submit', String(e?.message || e));
    } finally {
      setSubmitting(false);
    }
  }

  const center =
    reports.length > 0
      ? { latitude: reports[0].lat, longitude: reports[0].lon }
      : { latitude: 16.8, longitude: 78.7 };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Community coverage</Text>
      <Text style={styles.subtitle}>
        Real readings contributed by users. These improve future estimates.
      </Text>

      <View style={styles.mapWrap}>
        <MapView
          style={StyleSheet.absoluteFill}
          initialRegion={{ ...center, latitudeDelta: 1.5, longitudeDelta: 1.5 }}
        >
          <UrlTile urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maximumZ={19} zIndex={-1} />
          {reports.map((r) => (
            <Circle
              key={r.id}
              center={{ latitude: r.lat, longitude: r.lon }}
              radius={900}
              strokeColor={categoryColor[dbmToCategory(r.rsrp_dbm)]}
              fillColor={`${categoryColor[dbmToCategory(r.rsrp_dbm)]}66`}
            />
          ))}
        </MapView>
      </View>

      <Pressable style={styles.btn} onPress={contribute} disabled={submitting}>
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>Contribute my current signal</Text>
        )}
      </Pressable>

      <ScrollView style={{ marginTop: spacing(1) }}>
        {loading && <ActivityIndicator color={colors.primary} />}
        {reports.map((r) => (
          <View key={r.id} style={styles.row}>
            <View style={[styles.dot, { backgroundColor: categoryColor[dbmToCategory(r.rsrp_dbm)] }]} />
            <Text style={styles.rowText}>
              {r.lat.toFixed(3)}, {r.lon.toFixed(3)} ·{' '}
              {r.rsrp_dbm !== null ? `${r.rsrp_dbm} dBm` : 'no signal'}
              {r.operator ? ` · ${r.operator}` : ''}
              {r.source === 'demo' ? '  (demo)' : ''}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing(2), backgroundColor: colors.bg },
  title: { color: colors.text, fontSize: 22, fontWeight: '800' },
  subtitle: { color: colors.textMuted, marginTop: 2, marginBottom: spacing(1), fontSize: 12 },
  mapWrap: { height: 260, borderRadius: 12, overflow: 'hidden' },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: spacing(1.5),
    alignItems: 'center',
    marginTop: spacing(1),
  },
  btnText: { color: '#fff', fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  rowText: { color: colors.textMuted, fontSize: 12 },
});
