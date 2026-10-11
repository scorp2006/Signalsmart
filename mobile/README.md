# SignalSafe Mobile (React Native — Android)

Bare React Native (0.76) Android app. Shows estimated route connectivity, live GPS + real device
signal (dBm) where supported, offline route download, offline emergency-message queue with
auto-sync, and a community coverage map.

> Signal values are **estimates** from the backend's physics model unless the device reports a real
> dBm. Estimates are always labelled; data-poor areas show as **Unknown**. See
> [`../docs/METHODOLOGY.md`](../docs/METHODOLOGY.md).

## Prerequisites
- Node.js 18+
- JDK 17+ (JDK 17 recommended for RN 0.76; newer JDKs usually work)
- Android Studio + Android SDK (Platform 35, Build-Tools 35) and an emulator or a real device
- `ANDROID_HOME` set and `platform-tools` on PATH

## Install

```bash
cd mobile
npm install
```

The repo already includes:
- `android/gradle/wrapper/gradle-wrapper.jar` (Gradle 8.10.2 wrapper)
- `android/app/debug.keystore` (standard RN debug keystore)

If your tooling regenerates native folders, you can also run `npx react-native@0.76.5 init` in a
temp dir and copy its `android/` scaffolding — but it is not required; this repo is complete.

## Point the app at your backend

Edit [`src/config.ts`](src/config.ts) → `API_BASE_URL`:
- **Android emulator:** `http://10.0.2.2:8000` (default — the emulator's alias for your PC)
- **Real device:** `http://<your-PC-LAN-IP>:8000` (find via `ipconfig`); phone and PC on same Wi-Fi

Make sure the backend is running (see [`../backend/README.md`](../backend/README.md)).

## Run

```bash
# terminal 1
npm start
# terminal 2
npm run android
```

## Permissions
On first launch the app requests Location and Phone State. **Location + Phone State are required for
the device to report real signal strength.** If denied or unavailable (e.g. emulator), the live
screen falls back to the labelled estimate — it never fabricates a reading.

## The native signal module
`android/app/src/main/java/com/signalsafe/SignalStrengthModule.kt` reads real RSRP via Android's
`TelephonyManager`. It is registered in `MainApplication.kt` and exposed to JS as
`NativeModules.SignalStrength` (wrapped in [`src/signal.ts`](src/signal.ts)).

## Screens
- **Plan** — search start/destination (OSM Nominatim), analyze connectivity, compare alternative
  routes, pick the recommended one, download for offline use.
- **Travel** — live GPS on map, current signal (real dBm or labelled estimate), online/offline state.
- **Emergency** — write messages offline; they queue and auto-sync when connectivity returns.
- **Community** — view + contribute real signal readings.
- **About** — methodology, data sources, licensing.

## Type-check
```bash
npm run lint   # tsc --noEmit
```

## Notes / limitations
- Uses the public OSRM and Nominatim demo servers — fine for a demo; self-host for heavier use.
- OSM tiles via `UrlTile`; respect the OSM tile usage policy.
- Real dBm availability varies by device/OS; this is an Android limitation, handled by the estimate
  fallback.
