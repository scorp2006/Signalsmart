import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { categoryColor, colors, spacing } from '../theme';
import { Category, RouteSummary } from '../types';

const ORDER: Category[] = ['Good', 'Moderate', 'Weak', 'Blackspot', 'Unknown'];

export function SummaryBar({ summary }: { summary: RouteSummary }) {
  const total = summary.total_points || 1;
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.score}>{summary.connectivity_score}</Text>
        <Text style={styles.scoreLabel}>/100 connectivity</Text>
      </View>
      <View style={styles.bar}>
        {ORDER.map((c) => {
          const frac = (summary.counts[c] || 0) / total;
          if (frac <= 0) return null;
          return (
            <View
              key={c}
              style={{ flex: frac, backgroundColor: categoryColor[c], height: 10 }}
            />
          );
        })}
      </View>
      <Text style={styles.note}>
        {summary.counts.Blackspot} blackspot · {summary.counts.Weak} weak ·{' '}
        {summary.counts.Unknown} unknown of {total} points (estimated)
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing(1.5),
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: spacing(1) },
  score: { color: colors.text, fontSize: 28, fontWeight: '800' },
  scoreLabel: { color: colors.textMuted, marginLeft: 6, marginBottom: 4 },
  bar: {
    flexDirection: 'row',
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
  },
  note: { color: colors.textMuted, fontSize: 12, marginTop: spacing(1) },
});
