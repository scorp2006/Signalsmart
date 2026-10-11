import React from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../theme';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.h}>{title}</Text>
      {children}
    </View>
  );
}

export function AboutScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing(2) }}>
      <Text style={styles.title}>SignalSafe</Text>
      <Text style={styles.tagline}>AI-Powered Travel Safety & Connectivity Platform</Text>

      <Section title="What it does">
        <Text style={styles.p}>
          SignalSafe helps travellers prepare for low-connectivity areas before travel and supports
          them during travel: it estimates cellular connectivity along a route, flags weak zones and
          blackspots, recommends better-connected routes, marks likely signal-recovery points,
          supports offline download, monitors live GPS and network strength, queues emergency
          messages offline for later sync, and builds a community coverage map.
        </Text>
      </Section>

      <Section title="How signal is estimated (important)">
        <Text style={styles.p}>
          Freely available measured signal data does not exist for the demo region, so SignalSafe
          computes ESTIMATES using a physics-based log-distance path-loss propagation model over
          REAL data: cell-tower positions (OpenCelliD), road geometry (OpenStreetMap), and terrain
          elevation (Open-Meteo). Every value shown is labelled as an estimate. Areas without usable
          data are marked Unknown. No fake training data is generated and no accuracy figures are
          fabricated.
        </Text>
      </Section>

      <Section title="Data sources & licensing">
        <Text style={styles.p}>• Cell data © OpenCelliD contributors (CC BY-SA 4.0)</Text>
        <Text style={styles.p}>• Map data © OpenStreetMap contributors (ODbL)</Text>
        <Text style={styles.p}>• Elevation © Open-Meteo (CC BY 4.0)</Text>
        <Text
          style={styles.link}
          onPress={() => Linking.openURL('https://www.opencellid.org')}
        >
          opencellid.org
        </Text>
      </Section>

      <Section title="Live signal (device)">
        <Text style={styles.p}>
          On supported Android devices the live screen reads real RSRP (dBm). Where the OS restricts
          it or on emulators, it shows the nearest estimated value, clearly labelled.
        </Text>
      </Section>

      <Text style={styles.footer}>VNRVJIET · CSE-AIML / IoT / R&AI</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  title: { color: colors.text, fontSize: 26, fontWeight: '800' },
  tagline: { color: colors.textMuted, marginBottom: spacing(2) },
  section: { marginBottom: spacing(2) },
  h: { color: colors.primary, fontSize: 15, fontWeight: '700', marginBottom: 6 },
  p: { color: colors.text, fontSize: 13, lineHeight: 19, marginBottom: 4 },
  link: { color: colors.primary, marginTop: 4 },
  footer: { color: colors.textMuted, fontSize: 12, textAlign: 'center', marginTop: spacing(2) },
});
