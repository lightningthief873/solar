import React from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { RARITY_CONFIG } from '../utils/constants';
import type { Drop } from '../types';

interface Props {
  drops: Drop[];
  userLat: number;
  userLng: number;
  onDropSelect: (drop: Drop) => void;
}

const DELTA = 0.005;

export function MiniMap({ drops, userLat, userLng, onDropSelect }: Props): React.JSX.Element {
  return (
    <MapView
      provider={PROVIDER_GOOGLE}
      liteMode
      style={styles.map}
      region={{
        latitude: userLat,
        longitude: userLng,
        latitudeDelta: DELTA,
        longitudeDelta: DELTA,
      }}
    >
      {/* User marker */}
      <Marker
        coordinate={{ latitude: userLat, longitude: userLng }}
        title="You"
        pinColor="#00BFFF"
      />
      {/* Drop markers */}
      {drops
        .filter(d => !d.isClaimed)
        .map(drop => (
          <Marker
            key={drop.id}
            coordinate={{ latitude: drop.lat, longitude: drop.lng }}
            title={drop.name}
            description={drop.rarity.toUpperCase()}
            pinColor={RARITY_CONFIG[drop.rarity].color}
            onPress={() => onDropSelect(drop)}
          />
        ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    width: '100%',
    height: '100%',
  },
});
