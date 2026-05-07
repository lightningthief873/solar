const R = 6371000; // Earth radius in meters
const MAX_AR_DISTANCE = 50;

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Returns 0–360 degrees clockwise from north
export function bearing(
  userLat: number,
  userLng: number,
  dropLat: number,
  dropLng: number,
): number {
  const lat1 = toRad(userLat);
  const lat2 = toRad(dropLat);
  const dLng = toRad(dropLng - userLng);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (Math.atan2(y, x) * (180 / Math.PI) + 360) % 360;
}

export function gpsToARPosition(
  userLat: number,
  userLng: number,
  dropLat: number,
  dropLng: number,
  compassHeading: number,
): [number, number, number] {
  const latMid = toRad((userLat + dropLat) / 2);
  const dNorth = R * toRad(dropLat - userLat);
  const dEast = R * toRad(dropLng - userLng) * Math.cos(latMid);

  const dist = Math.sqrt(dNorth ** 2 + dEast ** 2);
  const scale = dist > MAX_AR_DISTANCE ? MAX_AR_DISTANCE / dist : 1;
  const sN = dNorth * scale;
  const sE = dEast * scale;

  const h = toRad(compassHeading);
  const x = sE * Math.cos(h) - sN * Math.sin(h);
  const z = -(sE * Math.sin(h) + sN * Math.cos(h));

  return [x, 0, z];
}
