/**
 * App configuration.
 *
 * IMPORTANT: a physical phone cannot reach your PC via "localhost". Set API_BASE_URL to your
 * computer's LAN IP (find it with `ipconfig` on Windows / `ifconfig` on macOS/Linux), e.g.
 *   export const API_BASE_URL = 'http://192.168.1.5:8000';
 *
 * For the Android emulator, the host machine is reachable at 10.0.2.2:
 *   export const API_BASE_URL = 'http://10.0.2.2:8000';
 */
export const API_BASE_URL = 'http://10.0.2.2:8000';

// Default demo route (Hyderabad -> Srisailam).
export const DEMO_ROUTE = {
  name: 'Hyderabad → Srisailam',
  start: { name: 'Hyderabad', lat: 17.385, lon: 78.4867 },
  end: { name: 'Srisailam', lat: 16.0733, lon: 78.8687 },
};

// How often to poll signal/GPS during live monitoring (ms).
export const MONITOR_INTERVAL_MS = 4000;
