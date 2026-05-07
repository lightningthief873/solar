import React, { useState, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { ARScene } from './src/ar/ARScene';
import { RadarRing } from './src/components/RadarRing';
import { MiniMap } from './src/components/MiniMap';
import { useGPS } from './src/hooks/useGPS';
import { useCompass } from './src/hooks/useCompass';
import { SEED_DROPS } from './src/utils/seedDrops';
import { RARITY_CONFIG } from './src/utils/constants';
import type { Drop } from './src/types';

// Fallback coordinates (Pune, India) used before GPS fix
const DEFAULT_LAT = 18.5204;
const DEFAULT_LNG = 73.8567;

export default function App(): React.JSX.Element {
  const gps = useGPS();
  const compass = useCompass();
  const [showMap, setShowMap] = useState(false);
  const [selectedDrop, setSelectedDrop] = useState<Drop | null>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);

  const userLat = gps.lat ?? DEFAULT_LAT;
  const userLng = gps.lng ?? DEFAULT_LNG;
  const heading = compass.heading;

  const handleDropTap = useCallback((drop: Drop) => {
    setSelectedDrop(drop);
    bottomSheetRef.current?.expand();
  }, []);

  const toggleMap = useCallback(() => setShowMap(v => !v), []);

  return (
    <GestureHandlerRootView style={styles.root}>
      {/* AR camera layer */}
      <ARScene
        drops={SEED_DROPS}
        userLat={userLat}
        userLng={userLng}
        compassHeading={heading}
        onDropTap={handleDropTap}
      />

      {/* Radar HUD — top-right */}
      <View style={styles.radarWrapper} pointerEvents="none">
        <RadarRing
          drops={SEED_DROPS}
          userLat={userLat}
          userLng={userLng}
          compassHeading={heading}
        />
      </View>

      {/* Map toggle — bottom-left */}
      <TouchableOpacity style={styles.mapToggle} onPress={toggleMap} activeOpacity={0.8}>
        <Text style={styles.mapToggleText}>{showMap ? '✕ Map' : '🗺 Map'}</Text>
      </TouchableOpacity>

      {/* Mini-map overlay */}
      {showMap && (
        <View style={styles.miniMapContainer}>
          <MiniMap
            drops={SEED_DROPS}
            userLat={userLat}
            userLng={userLng}
            onDropSelect={handleDropTap}
          />
        </View>
      )}

      {/* Drop detail bottom sheet */}
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={['28%']}
        enablePanDownToClose
        backgroundStyle={styles.sheetBg}
        handleIndicatorStyle={styles.sheetHandle}
      >
        <BottomSheetView style={styles.sheetContent}>
          {selectedDrop && (
            <>
              <Text style={styles.sheetName}>{selectedDrop.name}</Text>
              <Text style={[styles.sheetRarity, { color: RARITY_CONFIG[selectedDrop.rarity].color }]}>
                {selectedDrop.rarity.toUpperCase()} · {selectedDrop.mode}
              </Text>
              {selectedDrop.priceSOL > 0 && (
                <Text style={styles.sheetPrice}>{selectedDrop.priceSOL} SOL to claim</Text>
              )}
              <Text style={styles.sheetRadius}>Claim radius: {selectedDrop.claimRadius}m</Text>
            </>
          )}
        </BottomSheetView>
      </BottomSheet>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  radarWrapper: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  mapToggle: {
    position: 'absolute',
    bottom: 32,
    left: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,191,255,0.5)',
  },
  mapToggleText: {
    color: '#00BFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  miniMapContainer: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    right: 16,
    height: 240,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,191,255,0.4)',
  },
  sheetBg: {
    backgroundColor: '#0A0A1A',
  },
  sheetHandle: {
    backgroundColor: '#00BFFF',
  },
  sheetContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  sheetName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  sheetRarity: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  sheetPrice: {
    fontSize: 14,
    color: '#FFD700',
    marginBottom: 4,
  },
  sheetRadius: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
  },
});
