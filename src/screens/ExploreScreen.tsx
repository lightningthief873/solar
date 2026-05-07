import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Clipboard,
  Modal,
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
import { addOwnedNFT, getPlantedDrops } from '../solana/rpc';
import type { Drop } from '../types';

const DEFAULT_LAT = 18.5204;
const DEFAULT_LNG = 73.8567;

function truncate(addr: string) {
  return addr.length > 12 ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : addr;
}

export default function ExploreScreen() {
  const gps = useGPS();
  const compass = useCompass();
  const { wallet, connect, claimDrop } = useWallet();
  const [drops, setDrops] = useState<Drop[]>([...SEED_DROPS]);
  const [selected, setSelected] = useState<Drop | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [toast, setToast] = useState('');
  const sheetRef = useRef<BottomSheet>(null);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const toastAnim = useRef(new Animated.Value(0)).current;

  const userLat = gps.lat ?? DEFAULT_LAT;
  const userLng = gps.lng ?? DEFAULT_LNG;

  // Merge planted drops on focus
  useEffect(() => {
    const planted = getPlantedDrops();
    if (planted.length > 0) {
      setDrops(prev => {
        const ids = new Set(prev.map(d => d.id));
        const newDrops = planted.filter(d => !ids.has(d.id));
        return newDrops.length > 0 ? [...prev, ...newDrops] : prev;
      });
    }
  }, []);

  const distanceTo = useCallback(
    (drop: Drop) => haversineDistance(userLat, userLng, drop.lat, drop.lng),
    [userLat, userLng],
  );

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1800),
      Animated.timing(toastAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setToast(''));
  }, [toastAnim]);

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
    showToast(`◎ ${drop.name} in range!`);
  }, [showToast]);

  const handleClaim = async () => {
    if (!selected || !wallet.publicKey) return;
    HapticFeedback.trigger('impactMedium');
    setClaiming(true);
    try {
      await claimDrop({
        dropId: BigInt(selected.id.replace(/\D/g, '') || Date.now()),
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
        lat: selected.lat,
        lng: selected.lng,
      });
      setDrops(prev => prev.filter(d => d.id !== selected.id));
      setClaimed(true);
      HapticFeedback.trigger('notificationSuccess');
      showToast('NFT minted! Check Inventory 🎉');
    } catch (e: unknown) {
      shakeButton();
      HapticFeedback.trigger('notificationError');
      showToast(e instanceof Error ? e.message : 'Claim failed');
    } finally {
      setClaiming(false);
    }
  };

  const activeDrops = useMemo(() => drops.filter(d => !d.isClaimed), [drops]);
  const nearbyCount = useMemo(() => activeDrops.filter(d => distanceTo(d) <= 200).length, [activeDrops, distanceTo]);
  const dist = selected ? Math.round(distanceTo(selected)) : 0;
  const inRange = selected ? dist <= selected.claimRadius : false;

  return (
    <View style={styles.root}>
      <ARScene
        drops={activeDrops}
        userLat={userLat}
        userLng={userLng}
        compassHeading={compass.heading}
        onDropTap={handleDropTap}
        onEnterRange={handleEnterRange}
      />

      {/* Top HUD bar */}
      <View style={styles.topBar} pointerEvents="box-none">
        {wallet.publicKey ? (
          <TouchableOpacity
            style={[styles.walletPill, wallet.isDemoMode && styles.walletPillDemo]}
            onPress={() => { Clipboard.setString(wallet.publicKey!.toBase58()); showToast('Address copied!'); }}
          >
            <Text style={styles.walletText}>
              {wallet.isDemoMode ? '⚡ ' : '◎ '}{truncate(wallet.publicKey.toBase58())}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.connectBtn} onPress={connect} disabled={wallet.isConnecting}>
            {wallet.isConnecting
              ? <ActivityIndicator color="#FFF" size="small" />
              : <Text style={styles.connectBtnText}>🔗 Connect Wallet</Text>}
          </TouchableOpacity>
        )}

        <View style={styles.nearbyBadge} pointerEvents="none">
          <Text style={styles.nearbyDot}>●</Text>
          <Text style={styles.nearbyText}>{nearbyCount} drops</Text>
        </View>
      </View>

      {/* Radar top-right */}
      <View style={styles.radarWrap} pointerEvents="none">
        <RadarRing drops={activeDrops} userLat={userLat} userLng={userLng} compassHeading={compass.heading} />
      </View>

      {/* Bottom controls */}
      <View style={styles.bottomBar} pointerEvents="box-none">
        <TouchableOpacity style={styles.mapBtn} onPress={() => setShowMap(true)}>
          <Text style={styles.mapBtnText}>🗺  Map</Text>
        </TouchableOpacity>
      </View>

      {/* Full-screen map modal */}
      <Modal visible={showMap} animationType="slide" presentationStyle="formSheet">
        <View style={styles.mapModal}>
          <View style={styles.mapHeader}>
            <Text style={styles.mapTitle}>Nearby Drops</Text>
            <TouchableOpacity onPress={() => setShowMap(false)} style={styles.mapClose}>
              <Text style={styles.mapCloseText}>✕ Close</Text>
            </TouchableOpacity>
          </View>
          <MiniMap
            drops={activeDrops}
            userLat={userLat}
            userLng={userLng}
            onDropSelect={drop => { setShowMap(false); handleDropTap(drop); }}
            fullscreen
          />
        </View>
      </Modal>

      {/* Toast */}
      {toast !== '' && (
        <Animated.View style={[styles.toast, { opacity: toastAnim }]} pointerEvents="none">
          <Text style={styles.toastText}>{toast}</Text>
        </Animated.View>
      )}

      <BottomSheet
        ref={sheetRef}
        index={-1}
        snapPoints={['62%']}
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
  topBar: {
    position: 'absolute', top: 44, left: 16, right: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  walletPill: {
    backgroundColor: 'rgba(0,0,0,0.75)', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: 'rgba(0,191,255,0.5)',
  },
  walletPillDemo: { borderColor: 'rgba(255,152,0,0.7)' },
  walletText: { color: '#00BFFF', fontSize: 13, fontWeight: '700' },
  connectBtn: {
    backgroundColor: '#4A90E2', borderRadius: 20,
    paddingHorizontal: 18, paddingVertical: 9,
  },
  connectBtnText: { color: '#FFF', fontSize: 13, fontWeight: '800' },
  nearbyBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(0,0,0,0.75)', borderRadius: 16,
    paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  nearbyDot: { color: '#00FF88', fontSize: 8 },
  nearbyText: { color: '#DDD', fontSize: 13, fontWeight: '600' },
  radarWrap: { position: 'absolute', top: 110, right: 16 },
  bottomBar: {
    position: 'absolute', bottom: 90, left: 0, right: 0,
    alignItems: 'center',
  },
  mapBtn: {
    backgroundColor: 'rgba(0,0,0,0.82)', borderRadius: 24,
    paddingHorizontal: 28, paddingVertical: 12,
    borderWidth: 1.5, borderColor: 'rgba(0,191,255,0.6)',
  },
  mapBtnText: { color: '#00BFFF', fontSize: 15, fontWeight: '800' },
  mapModal: { flex: 1, backgroundColor: '#0A0A0F' },
  mapHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 14,
    backgroundColor: '#0A0A0F',
  },
  mapTitle: { color: '#FFF', fontSize: 20, fontWeight: '800' },
  mapClose: {
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16,
    paddingHorizontal: 14, paddingVertical: 7,
  },
  mapCloseText: { color: '#CCC', fontSize: 14, fontWeight: '700' },
  toast: {
    position: 'absolute', top: '42%', alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.9)', borderRadius: 24,
    paddingHorizontal: 24, paddingVertical: 12,
    borderWidth: 1, borderColor: 'rgba(0,191,255,0.3)',
  },
  toastText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  sheetBg: { backgroundColor: '#111118' },
  handle: { backgroundColor: '#444' },
});
