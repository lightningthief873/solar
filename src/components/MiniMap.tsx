import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import MapView, { Marker, UrlTile } from 'react-native-maps';
import { RARITY_CONFIG } from '../utils/constants';
import type { Drop } from '../types';

interface Props {
  drops: Drop[];
  userLat: number;
  userLng: number;
  onDropSelect: (drop: Drop) => void;
}

const DELTA = 0.003;
const OSM_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

// Rarity → emoji for map labels (no custom image assets needed)
const RARITY_EMOJI: Record<Drop['rarity'], string> = {
  common: '🔵',
  rare: '🟣',
  legendary: '🟡',
  mythic: '🩷',
};

export function MiniMap({ drops, userLat, userLng, onDropSelect }: Props): React.JSX.Element {
  return (
    <MapView
      style={styles.map}
      mapType="none"
      region={{
        latitude: userLat,
        longitude: userLng,
        latitudeDelta: DELTA,
        longitudeDelta: DELTA,
      }}
    >
      <UrlTile
        urlTemplate={OSM_URL}
        maximumZ={19}
        flipY={false}
        shouldReplaceMapContent
        zIndex={-1}
      />

      {/* User position */}
      <Marker
        coordinate={{ latitude: userLat, longitude: userLng }}
        title="You"
        anchor={{ x: 0.5, y: 0.5 }}
      >
        <View style={styles.youDot} />
      </Marker>

      {/* Drop markers */}
      {drops
        .filter(d => !d.isClaimed)
        .map(drop => (
          <Marker
            key={drop.id}
            coordinate={{ latitude: drop.lat, longitude: drop.lng }}
            title={drop.name}
            description={`${drop.rarity.toUpperCase()} · tap to select`}
            onPress={() => onDropSelect(drop)}
            anchor={{ x: 0.5, y: 1.0 }}
          >
            <View style={[styles.pin, { borderColor: RARITY_CONFIG[drop.rarity].color }]}>
              <Text style={styles.pinEmoji}>{RARITY_EMOJI[drop.rarity]}</Text>
            </View>
          </Marker>
        ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    width: '100%',
    height: '100%',
  },
  youDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#00BFFF',
    borderWidth: 2,
    borderColor: '#FFF',
    shadowColor: '#00BFFF',
    shadowRadius: 4,
    shadowOpacity: 0.8,
    elevation: 4,
  },
  pin: {
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 14,
    borderWidth: 2,
    paddingHorizontal: 4,
    paddingVertical: 2,
    alignItems: 'center',
  },
  pinEmoji: {
    fontSize: 16,
  },
});
