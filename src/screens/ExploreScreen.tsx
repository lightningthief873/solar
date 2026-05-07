import React, { useCallback, useRef, useState } from 'react';
import {
  Animated,
  Clipboard,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import HapticFeedback from 'react-native-haptic-feedback';
import { ARScene } from '../ar/ARScene';
import { RadarRing } from '../components/RadarRing';
import { MiniMap } from '../components/MiniMap';
import { ClaimSheet } from './ClaimSheet';
import { useGPS } from '../hooks/useGPS';
import { useCompass } from '../hooks/useCompass';
import { useWallet } from '../contexts/WalletContext';
import { haversineDistance } from '../utils/haversine';
import { SEED_DROPS } from '../utils/seedDrops';
import { addOwnedNFT } from '../solana/rpc';
import type { Drop } from '../types';

const DEFAULT_LAT = 18.5204;
const DEFAULT_LNG = 73.8567;

function truncate(addr: string) {
  return addr.length > 12 ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : addr;
}

export default function ExploreScreen() {
  const gps = useGPS();
  const compass = useCompass();
  const { wallet, claimDrop } = useWallet();
  const [drops, setDrops] = useState<Drop[]>(SEED_DROPS);
  const [selected, setSelected] = useState<Drop | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [toast, setToast] = useState('');
  const sheetRef = useRef<BottomSheet>(null);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const userLat = gps.lat ?? DEFAULT_LAT;
  const userLng = gps.lng ?? DEFAULT_LNG;

  const distanceTo = useCallback(
    (drop: Drop) => haversineDistance(userLat, userLng, drop.lat, drop.lng),
    [userLat, userLng],
  );

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const shakeButton = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,  duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleDropTap = useCallback((drop: Drop) => {
    setSelected(drop);
    setClaimed(false);
    sheetRef.current?.expand();
  }, []);

  const handleEnterRange = useCallback((drop: Drop) => {
    HapticFeedback.trigger('impactHeavy');
    showToast(`◎ ${drop.name} — tap to claim!`);
  }, []);

  const handleClaim = async () => {
    if (!selected || !wallet.publicKey) return;
    HapticFeedback.trigger('impactMedium');
    setClaiming(true);
    try {
      await claimDrop({
        dropId: BigInt(selected.id.replace('drop-', '')),
        creator: wallet.publicKey,
        userLat,
        userLng,
        rarity: selected.rarity,
      });
      addOwnedNFT({
        id: `nft-${Date.now()}`,
        dropId: selected.id,
        name: selected.name,
        rarity: selected.rarity,
        claimedAt: Date.now(),
      });
      setDrops(prev => prev.filter(d => d.id !== selected.id));
      setClaimed(true);
      HapticFeedback.trigger('notificationSuccess');
      showToast('Minted! 🎉');
    } catch (e: unknown) {
      shakeButton();
      HapticFeedback.trigger('notificationError');
      showToast(e instanceof Error ? e.message : 'Claim failed');
    } finally {
      setClaiming(false);
    }
  };

  const nearbyCount = drops.filter(d => distanceTo(d) <= 200).length;
  const dist = selected ? Math.round(distanceTo(selected)) : 0;
  const inRange = selected ? dist <= selected.claimRadius : false;

  return (
    <View style={styles.root}>
      <ARScene
        drops={drops}
        userLat={userLat}
        userLng={userLng}
        compassHeading={compass.heading}
        onDropTap={handleDropTap}
        onEnterRange={handleEnterRange}
      />

      {wallet.publicKey && (
        <TouchableOpacity
          style={styles.walletPill}
          onPress={() => { Clipboard.setString(wallet.publicKey!.toBase58()); showToast('Copied!'); }}
        >
          <Text style={styles.walletText}>{truncate(wallet.publicKey.toBase58())}</Text>
        </TouchableOpacity>
      )}

      <View style={styles.radarWrap} pointerEvents="none">
        <RadarRing drops={drops} userLat={userLat} userLng={userLng} compassHeading={compass.heading} />
      </View>

      <View style={styles.nearbyBadge} pointerEvents="none">
        <Text style={styles.nearbyText}>{nearbyCount} drops nearby</Text>
      </View>

      <TouchableOpacity style={styles.mapToggle} onPress={() => setShowMap(v => !v)}>
        <Text style={styles.mapToggleText}>{showMap ? '✕ Map' : '🗺 Map'}</Text>
      </TouchableOpacity>

      {showMap && (
        <View style={styles.mapContainer}>
          <MiniMap drops={drops} userLat={userLat} userLng={userLng} onDropSelect={handleDropTap} />
        </View>
      )}

      {toast !== '' && (
        <View style={styles.toast} pointerEvents="none">
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}

      <BottomSheet
        ref={sheetRef}
        index={-1}
        snapPoints={['60%']}
        enablePanDownToClose
        backgroundStyle={styles.sheetBg}
        handleIndicatorStyle={styles.handle}
        animationConfigs={{ damping: 20, stiffness: 200 }}
      >
        {selected && (
          <ClaimSheet
            drop={selected}
            distanceM={dist}
            inRange={inRange}
            claiming={claiming}
            claimed={claimed}
            shakeAnim={shakeAnim}
            walletConnected={!!wallet.publicKey}
            onClaim={handleClaim}
          />
        )}
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  walletPill: { position: 'absolute', top: 48, left: 16, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(0,191,255,0.4)' },
  walletText: { color: '#00BFFF', fontSize: 12, fontWeight: '600' },
  radarWrap: { position: 'absolute', top: 40, right: 16 },
  nearbyBadge: { position: 'absolute', bottom: 80, right: 16, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  nearbyText: { color: '#CCC', fontSize: 12 },
  mapToggle: { position: 'absolute', bottom: 80, left: 16, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: 'rgba(0,191,255,0.5)' },
  mapToggleText: { color: '#00BFFF', fontSize: 14, fontWeight: '700' },
  mapContainer: { position: 'absolute', bottom: 120, left: 16, width: 200, height: 200, borderRadius: 12, overflow: 'hidden' },
  toast: { position: 'absolute', top: '45%', alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.85)', borderRadius: 20, paddingHorizontal: 20, paddingVertical: 10 },
  toastText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  sheetBg: { backgroundColor: '#111118' },
  handle: { backgroundColor: '#444' },
});
