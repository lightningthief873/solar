/**
 * Pure React Native OSM tile map — no Google Maps SDK, no API key.
 * Renders a grid of 256x256 tiles from OpenStreetMap centered on the user.
 */
import React, { useMemo, useState } from 'react';
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { RARITY_CONFIG } from '../utils/constants';
import type { Drop } from '../types';

const TILE = 256;
const SCREEN_W = Dimensions.get('window').width;

const RARITY_EMOJI: Record<Drop['rarity'], string> = {
  common: '🌿', rare: '💎', legendary: '🔥', mythic: '🌟',
};

function latLngToTileFloat(lat: number, lng: number, z: number) {
  const n = Math.pow(2, z);
  const x = ((lng + 180) / 360) * n;
  const sinLat = Math.sin((lat * Math.PI) / 180);
  const y = ((1 - Math.log((1 + sinLat) / (1 - sinLat)) / (2 * Math.PI)) / 2) * n;
  return { x, y };
}

interface Props {
  drops: Drop[];
  userLat: number;
  userLng: number;
  height?: number;
  onDropSelect: (drop: Drop) => void;
}

export function TileMap({ drops, userLat, userLng, height = 420, onDropSelect }: Props): React.JSX.Element {
  const [zoom, setZoom] = useState(17);
  const width = SCREEN_W;

  const center = useMemo(
    () => latLngToTileFloat(userLat, userLng, zoom),
    [userLat, userLng, zoom],
  );

  const centerTileX = Math.floor(center.x);
  const centerTileY = Math.floor(center.y);
  const offsetX = (center.x - centerTileX) * TILE;
  const offsetY = (center.y - centerTileY) * TILE;

  const tilesX = Math.ceil(width / TILE) + 2;
  const tilesY = Math.ceil(height / TILE) + 2;
  const halfX = Math.floor(tilesX / 2);
  const halfY = Math.floor(tilesY / 2);
  const maxTile = Math.pow(2, zoom) - 1;

  const tiles = useMemo(() => {
    const result: { tx: number; ty: number; left: number; top: number }[] = [];
    for (let dy = -halfY; dy <= halfY; dy++) {
      for (let dx = -halfX; dx <= halfX; dx++) {
        const tx = centerTileX + dx;
        const ty = centerTileY + dy;
        if (tx < 0 || ty < 0 || tx > maxTile || ty > maxTile) continue;
        const left = width / 2 - offsetX + dx * TILE;
        const top = height / 2 - offsetY + dy * TILE;
        result.push({ tx, ty, left, top });
      }
    }
    return result;
  }, [centerTileX, centerTileY, offsetX, offsetY, halfX, halfY, maxTile, width, height]);

  function dropToPixel(lat: number, lng: number) {
    const tf = latLngToTileFloat(lat, lng, zoom);
    return {
      px: width / 2 + (tf.x - center.x) * TILE,
      py: height / 2 + (tf.y - center.y) * TILE,
    };
  }

  return (
    <View style={[styles.container, { height }]}>
      {/* OSM tile layer */}
      {tiles.map(({ tx, ty, left, top }) => (
        <Image
          key={`${zoom}-${tx}-${ty}`}
          source={{ uri: `https://tile.openstreetmap.org/${zoom}/${tx}/${ty}.png` }}
          style={[styles.tile, { left, top }]}
          fadeDuration={150}
        />
      ))}

      {/* Drop markers */}
      {drops
        .filter(d => !d.isClaimed)
        .map(drop => {
          const { px, py } = dropToPixel(drop.lat, drop.lng);
          if (px < -40 || px > width + 40 || py < -40 || py > height + 40) return null;
          const col = RARITY_CONFIG[drop.rarity].color;
          return (
            <TouchableOpacity
              key={drop.id}
              style={[styles.pin, { left: px - 18, top: py - 40, borderColor: col }]}
              onPress={() => onDropSelect(drop)}
              activeOpacity={0.8}
            >
              <Text style={styles.pinEmoji}>{RARITY_EMOJI[drop.rarity]}</Text>
              <Text style={[styles.pinLabel, { color: col }]} numberOfLines={1}>
                {drop.name}
              </Text>
            </TouchableOpacity>
          );
        })}

      {/* User dot */}
      <View style={[styles.userDot, { left: width / 2 - 9, top: height / 2 - 9 }]}>
        <View style={styles.userDotInner} />
      </View>

      {/* Zoom controls */}
      <View style={styles.zoomBox}>
        <TouchableOpacity
          style={styles.zoomBtn}
          onPress={() => setZoom(z => Math.min(19, z + 1))}
        >
          <Text style={styles.zoomTxt}>+</Text>
        </TouchableOpacity>
        <View style={styles.zoomDivider} />
        <TouchableOpacity
          style={styles.zoomBtn}
          onPress={() => setZoom(z => Math.max(14, z - 1))}
        >
          <Text style={styles.zoomTxt}>−</Text>
        </TouchableOpacity>
      </View>

      {/* Scale indicator */}
      <View style={styles.scaleBar} pointerEvents="none">
        <Text style={styles.scaleText}>z{zoom}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: '#1a1a2e',
  },
  tile: {
    position: 'absolute',
    width: TILE,
    height: TILE,
  },
  pin: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.88)',
    borderRadius: 14,
    borderWidth: 2,
    paddingHorizontal: 7,
    paddingVertical: 5,
    alignItems: 'center',
    zIndex: 10,
    elevation: 5,
  },
  pinEmoji: { fontSize: 20 },
  pinLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
    maxWidth: 70,
  },
  userDot: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(0,191,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#00BFFF',
  },
  userDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00BFFF',
  },
  zoomBox: {
    position: 'absolute',
    right: 12,
    bottom: 16,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
    zIndex: 30,
    elevation: 8,
  },
  zoomBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomTxt: { color: '#FFF', fontSize: 22, fontWeight: '700' },
  zoomDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.15)' },
  scaleBar: {
    position: 'absolute',
    left: 12,
    bottom: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  scaleText: { color: '#999', fontSize: 11 },
});
