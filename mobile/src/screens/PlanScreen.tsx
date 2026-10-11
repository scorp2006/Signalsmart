import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { api } from '../api';
import { DEMO_ROUTE } from '../config';
import { searchPlaces, Place, toCoord } from '../geocode';
import { saveOfflineRoute } from '../storage';
import { colors, spacing } from '../theme';
import { Coord, RouteRecommendation, RoutePrediction } from '../types';
import { ConnectivityMap } from '../components/ConnectivityMap';
import { SummaryBar } from '../components/SummaryBar';
import { Legend } from '../components/Legend';
import { EstimateBanner } from '../components/EstimateBanner';

type Field = 'start' | 'end' | null;

export function PlanScreen() {
  const [start, setStart] = useState<Coord | null>(DEMO_ROUTE.start);
  const [end, setEnd] = useState<Coord | null>(DEMO_ROUTE.end);
  const [startText, setStartText] = useState(DEMO_ROUTE.start.name);
  const [endText, setEndText] = useState(DEMO_ROUTE.end.name);
  const [editing, setEditing] = useState<Field>(null);
  const [results, setResults] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [rec, setRec] = useState<RouteRecommendation | null>(null);
  const [selected, setSelected] = useState(0);

  const active: RoutePrediction | null = rec ? rec.routes[selected].prediction : null;

  async function onSearch(text: string, field: Field) {
    if (field === 'start') setStartText(text);
    else setEndText(text);
    setEditing(field);
    if (text.trim().length < 3) {
      setResults([]);
      return;
    }
    try {
      setResults(await searchPlaces(text));
    } catch {
      setResults([]);
    }
  }

  function pickPlace(p: Place) {
    if (editing === 'start') {
      setStart(toCoord(p));
      setStartText(p.name.split(',')[0]);
    } else if (editing === 'end') {
      setEnd(toCoord(p));
      setEndText(p.name.split(',')[0]);
    }
    setResults([]);
    setEditing(null);
  }

  async function analyze() {
    if (!start || !end) {
      Alert.alert('Pick both start and destination');
      return;
    }
    setLoading(true);
    setRec(null);
    try {
      const r = await api.recommendRoute(start, end);
      setRec(r);
      setSelected(r.recommended_index);
    } catch (e: any) {
      Alert.alert('Could not analyze route', String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  async function download() {
    if (!active) return;
    await saveOfflineRoute(active);
    Alert.alert('Saved offline', 'This route and its estimated connectivity are now available offline.');
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Plan a trip</Text>
        <Text style={styles.subtitle}>Estimate connectivity before you travel</Text>
      </View>

      <EstimateBanner />

      <View style={styles.inputs}>
        <TextInput
          style={styles.input}
          placeholder="Start (e.g. Hyderabad)"
          placeholderTextColor={colors.textMuted}
          value={startText}
          onFocus={() => setEditing('start')}
          onChangeText={(t) => onSearch(t, 'start')}
        />
        <TextInput
          style={styles.input}
          placeholder="Destination (e.g. Srisailam)"
          placeholderTextColor={colors.textMuted}
          value={endText}
          onFocus={() => setEditing('end')}
          onChangeText={(t) => onSearch(t, 'end')}
        />
      </View>

      {editing && results.length > 0 && (
        <View style={styles.suggestions}>
          <FlatList
            data={results}
            keyExtractor={(_, i) => String(i)}
            renderItem={({ item }) => (
              <Pressable style={styles.suggestion} onPress={() => pickPlace(item)}>
                <Text style={styles.suggestionText} numberOfLines={1}>
                  {item.name}
                </Text>
              </Pressable>
            )}
          />
        </View>
      )}

      <Pressable style={styles.analyzeBtn} onPress={analyze} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.analyzeText}>Analyze connectivity</Text>
        )}
      </Pressable>

      {rec && (
        <View style={styles.routeTabs}>
          {rec.routes.map((r, i) => (
            <Pressable
              key={i}
              onPress={() => setSelected(i)}
              style={[styles.routeTab, selected === i && styles.routeTabActive]}
            >
              <Text style={[styles.routeTabText, selected === i && styles.routeTabTextActive]}>
                {r.label} · {r.connectivity_score}/100
                {i === rec.recommended_index ? '  ★' : ''}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {active && (
        <>
          <SummaryBar summary={active.summary} />
          {rec && selected === rec.recommended_index && (
            <Text style={styles.recReason}>★ Recommended: {rec.reason}</Text>
          )}
          <View style={styles.mapWrap}>
            <ConnectivityMap points={active.points} recovery={active.recovery_markers} />
          </View>
          <Legend />
          <Pressable style={styles.downloadBtn} onPress={download}>
            <Text style={styles.downloadText}>⬇ Download for offline use</Text>
          </Pressable>
          <Text style={styles.disclaimer}>{active.disclaimer}</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing(2), backgroundColor: colors.bg },
  header: { marginBottom: spacing(1) },
  title: { color: colors.text, fontSize: 22, fontWeight: '800' },
  subtitle: { color: colors.textMuted, marginTop: 2 },
  inputs: { gap: spacing(1) },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: spacing(1.5),
    paddingVertical: spacing(1.25),
    color: colors.text,
    marginBottom: spacing(1),
  },
  suggestions: {
    maxHeight: 160,
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing(1),
  },
  suggestion: { padding: spacing(1.25), borderBottomColor: colors.border, borderBottomWidth: 1 },
  suggestionText: { color: colors.text },
  analyzeBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: spacing(1.5),
    alignItems: 'center',
    marginBottom: spacing(1),
  },
  analyzeText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  routeTabs: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing(1), marginBottom: spacing(1) },
  routeTab: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing(1),
    marginBottom: spacing(0.5),
  },
  routeTabActive: { backgroundColor: colors.primaryDark, borderColor: colors.primary },
  routeTabText: { color: colors.textMuted, fontSize: 12 },
  routeTabTextActive: { color: '#fff' },
  recReason: { color: colors.success, fontSize: 12, marginVertical: spacing(0.5) },
  mapWrap: { height: 300, marginTop: spacing(1) },
  downloadBtn: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 10,
    paddingVertical: spacing(1.25),
    alignItems: 'center',
    marginTop: spacing(1),
    borderWidth: 1,
    borderColor: colors.border,
  },
  downloadText: { color: colors.text, fontWeight: '600' },
  disclaimer: { color: colors.textMuted, fontSize: 11, marginTop: spacing(1), lineHeight: 15 },
});
