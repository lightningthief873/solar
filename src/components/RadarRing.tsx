import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RARITY_CONFIG, MAX_RADAR_DISTANCE } from '../utils/constants';
import { haversineDistance, bearing } from '../utils/haversine';
import type { Drop } from '../types';

const RING_SIZE = 180;
const RING_RADIUS = RING_SIZE / 2 - 6; // inset from border
const USER_DOT = 8;
const MIN_DOT = 4;
const MAX_DOT = 12;

interface Props {
  drops: Drop[];
  userLat: number;
  userLng: number;
  compassHeading: number;
}

interface DropDot {
  drop: Drop;
  x: number;
  y: number;
  size: number;
}

function computeDots(drops: Drop[], userLat: number, userLng: number, compassHeading: number): DropDot[] {
  return drops
    .filter(d => !d.isClaimed)
    .map(d => {
      const dist = haversineDistance(userLat, userLng, d.lat, d.lng);
      if (dist > MAX_RADAR_DISTANCE) return null;

      const bear = bearing(userLat, userLng, d.lat, d.lng);
      const screenAngle = (bear - compassHeading + 360) % 360;
      const rad = (screenAngle * Math.PI) / 180;

      const scaledR = RING_RADIUS * Math.min(dist / MAX_RADAR_DISTANCE, 1);
      const dotSize = MIN_DOT + (MAX_DOT - MIN_DOT) * (1 - dist / MAX_RADAR_DISTANCE);
      const cx = RING_SIZE / 2 + scaledR * Math.sin(rad) - dotSize / 2;
      const cy = RING_SIZE / 2 - scaledR * Math.cos(rad) - dotSize / 2;

      return { drop: d, x: cx, y: cy, size: dotSize } as DropDot;
    })
    .filter((d): d is DropDot => d !== null);
}

export function RadarRing({ drops, userLat, userLng, compassHeading }: Props): React.JSX.Element {
  const dots = computeDots(drops, userLat, userLng, compassHeading);
  const nearbyCount = dots.length;

  return (
    <View style={styles.container}>
      <Text style={styles.countLabel}>{nearbyCount} drops nearby</Text>
      <View style={styles.ring}>
        {/* Distance reference rings */}
        {[0.25, 0.5, 1.0].map(fraction => {
          const r = RING_RADIUS * fraction;
          const size = r * 2;
          return (
            <View
              key={fraction}
              style={[styles.distRing, { width: size, height: size, borderRadius: r, marginLeft: RING_SIZE / 2 - r, marginTop: RING_SIZE / 2 - r }]}
            />
          );
        })}

        {/* User dot */}
        <View style={[styles.userDot, { left: RING_SIZE / 2 - USER_DOT / 2, top: RING_SIZE / 2 - USER_DOT / 2 }]} />

        {/* Drop dots */}
        {dots.map(({ drop, x, y, size }) => (
          <View
            key={drop.id}
            style={[
              styles.dropDot,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                left: x,
                top: y,
                backgroundColor: RARITY_CONFIG[drop.rarity].color,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  countLabel: {
    color: '#00BFFF',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  ring: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 2,
    borderColor: 'rgba(0,191,255,0.5)',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  distRing: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  userDot: {
    position: 'absolute',
    width: USER_DOT,
    height: USER_DOT,
    borderRadius: USER_DOT / 2,
    backgroundColor: '#00BFFF',
  },
  dropDot: {
    position: 'absolute',
  },
});
