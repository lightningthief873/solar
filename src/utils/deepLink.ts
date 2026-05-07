// Simple pub-sub for incoming solar://drop?id=X&lat=Y&lng=Z deep links.
// ExploreScreen subscribes; App.tsx publishes.

type Listener = (lat: number, lng: number, id: string) => void;

let _listener: Listener | null = null;
let _pending: { lat: number; lng: number; id: string } | null = null;

export function setDeepLinkListener(fn: Listener | null): void {
  _listener = fn;
  if (fn && _pending) {
    fn(_pending.lat, _pending.lng, _pending.id);
    _pending = null;
  }
}

export function dispatchDeepLink(url: string): void {
  try {
    const raw = url.replace('solar://drop?', '');
    const params = Object.fromEntries(raw.split('&').map(p => p.split('=')));
    const lat = parseFloat(params.lat ?? '');
    const lng = parseFloat(params.lng ?? '');
    const id = params.id ?? '';
    if (isNaN(lat) || isNaN(lng)) return;
    if (_listener) {
      _listener(lat, lng, id);
    } else {
      _pending = { lat, lng, id };
    }
  } catch { /* malformed URL — ignore */ }
}
