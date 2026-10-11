import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../theme';

/**
 * Persistent, unmissable banner stating that signal values are estimates.
 * Required by the project's data-honesty policy.
 */
export function EstimateBanner() {
  return (
    <View style={styles.wrap}>
      <Text style={styles.text}>
        ⚠ Estimated signal — modelled from real tower & terrain data, not measured. Areas without
        data are shown as Unknown.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#3A2A12',
    borderColor: colors.warning,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: spacing(1),
    paddingHorizontal: spacing(1.5),
    marginBottom: spacing(1),
  },
  text: { color: '#F6D79A', fontSize: 12, lineHeight: 17 },
});
