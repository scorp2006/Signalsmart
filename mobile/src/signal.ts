/**
 * Live cellular signal strength.
 *
 * On a real Android device this reads the ACTUAL RSRP (dBm) via a small native module
 * (android/.../SignalStrengthModule.kt, exposed as NativeModules.SignalStrength).
 *
 * Where the native value is unavailable (emulator, OS restriction, permission denied, or the
 * module not built), callers should fall back to the ESTIMATED value from the prediction model and
 * clearly label it as an estimate. This module never fabricates a reading — it returns null.
 */
import { NativeModules, Platform } from 'react-native';

type SignalStrengthNative = {
  getSignalStrength(): Promise<{
    dbm: number | null;
    level: number | null; // 0..4 bars, if dbm unavailable
    radio: string | null; // LTE/NR/UMTS/GSM
  }>;
};

const Native: SignalStrengthNative | undefined = (NativeModules as any).SignalStrength;

export interface LiveSignal {
  dbm: number | null;
  level: number | null;
  radio: string | null;
  source: 'device' | 'unavailable';
}

export async function readDeviceSignal(): Promise<LiveSignal> {
  if (Platform.OS !== 'android' || !Native?.getSignalStrength) {
    return { dbm: null, level: null, radio: null, source: 'unavailable' };
  }
  try {
    const r = await Native.getSignalStrength();
    const hasValue = r.dbm !== null && r.dbm !== undefined;
    return {
      dbm: hasValue ? r.dbm : null,
      level: r.level ?? null,
      radio: r.radio ?? null,
      source: hasValue ? 'device' : 'unavailable',
    };
  } catch {
    return { dbm: null, level: null, radio: null, source: 'unavailable' };
  }
}
