import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline, UrlTile, Region } from 'react-native-maps';
import { categoryColor, colors } from '../theme';
import { PredictedPoint, RecoveryMarker } from '../types';

interface Props {
  points: PredictedPoint[];
  recovery?: RecoveryMarker[];
  liveLocation?: { lat: number; lon: number } | null;
}

function regionFor(points: PredictedPoint[]): Region | undefined {
  if (!points.length) return undefined;
  const lats = points.map((p) => p.lat);
  const lons = points.map((p) => p.lon);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLon + maxLon) / 2,
    latitudeDelta: Math.max(0.05, (maxLat - minLat) * 1.3),
    longitudeDelta: Math.max(0.05, (maxLon - minLon) * 1.3),
  };
}

export function ConnectivityMap({ points, recovery = [], liveLocation }: Props) {
  if (!points.length) {
    return (
      <View style={[styles.map, styles.placeholder]}>
        <Text style={styles.placeholderText}>No route yet</Text>
      </View>
    );
  }

  // Build coloured segments: consecutive points sharing a category.
  const segments: { coords: { latitude: number; longitude: number }[]; color: string }[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    segments.push({
      color: categoryColor[a.category],
      coords: [
        { latitude: a.lat, longitude: a.lon },
        { latitude: b.lat, longitude: b.lon },
      ],
    });
  }

  const start = points[0];
  const end = points[points.length - 1];

  return (
    <View style={styles.map}>
      <MapView style={StyleSheet.absoluteFill} initialRegion={regionFor(points)}>
        {/* Real OpenStreetMap tiles */}
        <UrlTile
          urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maximumZ={19}
          zIndex={-1}
        />
        {segments.map((s, i) => (
          <Polyline key={i} coordinates={s.coords} strokeColor={s.color} strokeWidth={5} />
        ))}

        <Marker coordinate={{ latitude: start.lat, longitude: start.lon }} title="Start" pinColor="#3B82F6" />
        <Marker coordinate={{ latitude: end.lat, longitude: end.lon }} title="Destination" pinColor="#8B5CF6" />

        {recovery.map((m, i) => (
          <Marker
            key={`rec-${i}`}
            coordinate={{ latitude: m.lat, longitude: m.lon }}
            title="Signal recovery"
            description={`Signal likely returns here (${m.category}, estimated)`}
            pinColor="#22C55E"
          />
        ))}

        {liveLocation && (
          <Marker
            coordinate={{ latitude: liveLocation.lat, longitude: liveLocation.lon }}
            title="You"
            pinColor="#F59E0B"
          />
        )}
      </MapView>
      <View style={styles.attribution}>
        <Text style={styles.attrText}>© OpenStreetMap contributors</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1, borderRadius: 12, overflow: 'hidden', backgroundColor: colors.surfaceAlt },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  placeholderText: { color: colors.textMuted },
  attribution: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  attrText: { color: '#fff', fontSize: 10 },
});
