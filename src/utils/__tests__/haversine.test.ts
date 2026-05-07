import { haversineDistance, gpsToARPosition } from '../haversine';

describe('haversineDistance', () => {
  it('returns 0 for same point', () => {
    expect(haversineDistance(0, 0, 0, 0)).toBe(0);
  });

  it('returns ~10m for 0.00009° north', () => {
    const dist = haversineDistance(0, 0, 0.00009, 0);
    expect(dist).toBeGreaterThan(9);
    expect(dist).toBeLessThan(11);
  });

  it('returns ~10m for 0.00009° east at equator', () => {
    const dist = haversineDistance(0, 0, 0, 0.00009);
    expect(dist).toBeGreaterThan(9);
    expect(dist).toBeLessThan(11);
  });
});

describe('gpsToARPosition', () => {
  it('returns [0, 0, 0] for same point', () => {
    const pos = gpsToARPosition(0, 0, 0, 0, 0);
    expect(pos[0]).toBeCloseTo(0, 10);
    expect(pos[1]).toBe(0);
    expect(pos[2]).toBeCloseTo(0, 10);
  });

  it('10m due north with compass=0 → [~0, 0, ~-10]', () => {
    const pos = gpsToARPosition(0, 0, 0.00009, 0, 0);
    expect(pos[0]).toBeCloseTo(0, 0);
    expect(pos[1]).toBe(0);
    expect(pos[2]).toBeLessThan(-8);
    expect(pos[2]).toBeGreaterThan(-12);
  });

  it('10m due east with compass=0 → [~10, 0, ~0]', () => {
    const pos = gpsToARPosition(0, 0, 0, 0.00009, 0);
    expect(pos[0]).toBeGreaterThan(8);
    expect(pos[0]).toBeLessThan(12);
    expect(pos[1]).toBe(0);
    expect(pos[2]).toBeCloseTo(0, 0);
  });

  it('beyond 50m clamps to 50m', () => {
    // ~1110m north
    const pos = gpsToARPosition(0, 0, 0.01, 0, 0);
    const d = Math.sqrt(pos[0] ** 2 + pos[2] ** 2);
    expect(d).toBeCloseTo(50, 0);
  });

  it('rotates correctly when compass facing east (90°)', () => {
    // Drop is 10m north but user faces east → drop should appear to the left
    const pos = gpsToARPosition(0, 0, 0.00009, 0, 90);
    // When facing east, north is to the left (negative x in AR)
    expect(pos[0]).toBeLessThan(0);
  });
});
