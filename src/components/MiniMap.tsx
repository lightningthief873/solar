import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import MapView, { Marker, UrlTile, PROVIDER_GOOGLE } from 'react-native-maps';
import { RARITY_CONFIG } from '../utils/constants';
import type { Drop } from '../types';

interface Props {
  drops: Drop[];
  userLat: number;
  userLng: number;
  onDropSelect: (drop: Drop) => void;
  fullscreen?: boolean;
}

const DELTA = 0.003;
const OSM_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

const RARITY_EMOJI: Record<Drop['rarity'], string> = {
  common: '🔵', rare: '🟣', legendary: '🟡', mythic: '🩷',
};

export function MiniMap({ drops, userLat, userLng, onDropSelect, fullscreen }: Props): React.JSX.Element {
  return (
    <MapView
      provider={PROVIDER_GOOGLE}
      style={styles.map}
      initialRegion={{
        latitude: userLat,
        longitude: userLng,
        latitudeDelta: DELTA,
        longitudeDelta: DELTA,
      }}
      scrollEnabled
      zoomEnabled
      rotateEnabled={false}
      showsUserLocation
      showsMyLocationButton={false}
      showsCompass={false}
      toolbarEnabled={false}
    >
      <UrlTile
        urlTemplate={OSM_URL}
        maximumZ={19}
        flipY={false}
        zIndex={1}
      />

      {/* User position */}
      <Marker coordinate={{ latitude: userLat, longitude: userLng }} anchor={{ x: 0.5, y: 0.5 }}>
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
            zIndex={2}
          >
            <View style={[styles.pin, { borderColor: RARITY_CONFIG[drop.rarity].color }]}>
              <Text style={styles.pinEmoji}>{RARITY_EMOJI[drop.rarity]}</Text>
              {fullscreen && (
                <Text style={[styles.pinLabel, { color: RARITY_CONFIG[drop.rarity].color }]} numberOfLines={1}>
                  {drop.name}
                </Text>
              )}
            </View>
          </Marker>
        ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: { width: '100%', height: '100%' },
  youDot: {
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: '#00BFFF', borderWidth: 3, borderColor: '#FFF',
    shadowColor: '#00BFFF', shadowRadius: 6, shadowOpacity: 1, elevation: 6,
  },
  pin: {
    backgroundColor: 'rgba(0,0,0,0.85)', borderRadius: 16, borderWidth: 2,
    paddingHorizontal: 6, paddingVertical: 4, alignItems: 'center',
  },
  pinEmoji: { fontSize: 18 },
  pinLabel: { fontSize: 10, fontWeight: '700', marginTop: 2, maxWidth: 80 },
});
