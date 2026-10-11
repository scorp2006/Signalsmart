import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { categoryColor, categoryLabel, colors, spacing } from '../theme';
import { Category } from '../types';

const ORDER: Category[] = ['Good', 'Moderate', 'Weak', 'Blackspot', 'Unknown'];

export function Legend() {
  return (
    <View style={styles.wrap}>
      {ORDER.map((c) => (
        <View key={c} style={styles.item}>
          <View style={[styles.dot, { backgroundColor: categoryColor[c] }]} />
          <Text style={styles.label}>{categoryLabel[c]}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing(1),
    paddingVertical: spacing(1),
  },
  item: { flexDirection: 'row', alignItems: 'center', marginRight: spacing(1.5) },
  dot: { width: 12, height: 12, borderRadius: 6, marginRight: 6 },
  label: { color: colors.textMuted, fontSize: 12 },
});
