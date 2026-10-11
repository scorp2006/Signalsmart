import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import Geolocation from 'react-native-geolocation-service';
import { api } from '../api';
import {
  enqueueEmergency,
  getEmergencyQueue,
  setEmergencyQueue,
} from '../storage';
import { colors, spacing } from '../theme';
import { EmergencyMessage } from '../types';

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function EmergencyScreen() {
  const [text, setText] = useState('');
  const [queue, setQueue] = useState<EmergencyMessage[]>([]);
  const [online, setOnline] = useState(true);

  const refresh = useCallback(async () => setQueue(await getEmergencyQueue()), []);

  useEffect(() => {
    refresh();
    const unsub = NetInfo.addEventListener((s) => {
      const isOnline = !!s.isConnected;
      setOnline(isOnline);
      if (isOnline) trySync();
    });
    return unsub;
  }, []);

  function getLocation(): Promise<{ lat: number | null; lon: number | null }> {
    return new Promise((resolve) => {
      Geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => resolve({ lat: null, lon: null }),
        { enableHighAccuracy: true, timeout: 6000, maximumAge: 5000 },
      );
    });
  }

  async function queueMessage() {
    if (!text.trim()) return;
    const { lat, lon } = await getLocation();
    const msg: EmergencyMessage = {
      client_id: uuid(),
      message: text.trim(),
      lat,
      lon,
      created_at_device: new Date().toISOString(),
      synced: false,
    };
    await enqueueEmergency(msg);
    setText('');
    await refresh();
    if (online) trySync();
    else
      Alert.alert(
        'Queued offline',
        'Saved on your device. It will auto-send when connectivity returns.',
      );
  }

  async function trySync() {
    const q = await getEmergencyQueue();
    const pending = q.filter((m) => !m.synced);
    if (!pending.length) return;
    try {
      const res = await api.syncEmergency(pending);
      const synced = new Set(res.synced_ids);
      const updated = q.map((m) => (synced.has(m.client_id) ? { ...m, synced: true } : m));
      await setEmergencyQueue(updated);
      await refresh();
    } catch {
      // stay queued; will retry on next connectivity event
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Emergency messages</Text>
      <Text style={styles.subtitle}>
        Written offline, stored on your device, and auto-synced when connectivity returns.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Type an emergency message…"
        placeholderTextColor={colors.textMuted}
        value={text}
        onChangeText={setText}
        multiline
      />
      <Pressable style={styles.btn} onPress={queueMessage}>
        <Text style={styles.btnText}>{online ? 'Send' : 'Queue (offline)'}</Text>
      </Pressable>
      {!online && <Text style={styles.offlineNote}>You are offline — messages will sync later.</Text>}

      <Pressable style={styles.syncBtn} onPress={trySync} disabled={!online}>
        <Text style={styles.syncText}>Sync now</Text>
      </Pressable>

      <FlatList
        style={{ marginTop: spacing(1) }}
        data={queue}
        keyExtractor={(m) => m.client_id}
        ListEmptyComponent={<Text style={styles.empty}>No messages yet.</Text>}
        renderItem={({ item }) => (
          <View style={styles.msg}>
            <Text style={styles.msgText}>{item.message}</Text>
            <View style={styles.msgMeta}>
              <Text
                style={[
                  styles.badge,
                  { color: item.synced ? colors.success : colors.warning },
                ]}
              >
                {item.synced ? '✓ synced' : '… pending'}
              </Text>
              {item.lat != null && (
                <Text style={styles.coords}>
                  {item.lat.toFixed(4)}, {item.lon?.toFixed(4)}
                </Text>
              )}
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing(2), backgroundColor: colors.bg },
  title: { color: colors.text, fontSize: 22, fontWeight: '800' },
  subtitle: { color: colors.textMuted, marginTop: 2, marginBottom: spacing(1.5), fontSize: 12 },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    padding: spacing(1.5),
    color: colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  btn: {
    backgroundColor: colors.danger,
    borderRadius: 10,
    paddingVertical: spacing(1.5),
    alignItems: 'center',
    marginTop: spacing(1),
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  offlineNote: { color: colors.warning, fontSize: 12, marginTop: 6 },
  syncBtn: { alignSelf: 'flex-start', marginTop: spacing(1), paddingVertical: 6 },
  syncText: { color: colors.primary, fontWeight: '600' },
  empty: { color: colors.textMuted, marginTop: spacing(2) },
  msg: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: spacing(1.25),
    marginBottom: spacing(1),
    borderWidth: 1,
    borderColor: colors.border,
  },
  msgText: { color: colors.text },
  msgMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  badge: { fontSize: 12, fontWeight: '600' },
  coords: { color: colors.textMuted, fontSize: 11 },
});
