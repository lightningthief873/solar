import React, { useCallback, useMemo, useRef, useState } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import BottomSheet from '@gorhom/bottom-sheet';
import HapticFeedback from 'react-native-haptic-feedback';
import { LeafletMap } from '../components/LeafletMap';
import { ARScene } from '../ar/ARScene';
import { RadarRing } from '../components/RadarRing';
import { ClaimSheet } from './ClaimSheet';
import { useGPS } from '../hooks/useGPS';
import { useCompass } from '../hooks/useCompass';
import { useWallet } from '../contexts/WalletContext';
import { haversineDistance } from '../utils/haversine';
import { RARITY_CONFIG } from '../utils/constants';
import { C } from '../utils/design';
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
  const [nearbyDrop, setNearbyDrop] = useState<Drop | null>(null); // for proximity button
  const sheetRef = useRef<BottomSheet>(null);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const toastAnim = useRef(new Animated.Value(0)).current;
  const nearbyAnim = useRef(new Animated.Value(0)).current;

  const userLat = gps.lat ?? DEFAULT_LAT;
  const userLng = gps.lng ?? DEFAULT_LNG;

  // Refresh planted drops every time the screen is focused
  useFocusEffect(
    useCallback(() => {
      const planted = getPlantedDrops();
      if (planted.length > 0) {
        setDrops(prev => {
          const ids = new Set(prev.map(d => d.id));
          const fresh = planted.filter(d => !ids.has(d.id));
          return fresh.length > 0 ? [...prev, ...fresh] : prev;
        });
      }
    }, []),
  );

  const distanceTo = useCallback(
    (drop: Drop) => haversineDistance(userLat, userLng, drop.lat, drop.lng),
    [userLat, userLng],
  );

  const showToast = useCallback(
    (msg: string) => {
      setToast(msg);
      Animated.sequence([
        Animated.timing(toastAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.delay(1800),
        Animated.timing(toastAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => setToast(''));
    },
    [toastAnim],
  );

  const shakeButton = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleDropTap = useCallback((drop: Drop) => {
    setSelected(drop);
    setClaimed(false);
    sheetRef.current?.expand();
  }, []);

  const handleEnterRange = useCallback(
    (drop: Drop) => {
      HapticFeedback.trigger('impactHeavy');
      showToast(`◎ ${drop.name} — in range!`);
      setNearbyDrop(drop);
      Animated.spring(nearbyAnim, { toValue: 1, friction: 6, tension: 120, useNativeDriver: true }).start();
    },
    [showToast, nearbyAnim],
  );

  const doClaim = useCallback(
    async (drop: Drop) => {
      if (!wallet.publicKey) { showToast('Connect wallet first'); return; }
      HapticFeedback.trigger('impactMedium');
      setClaiming(true);
      setSelected(drop);
      setClaimed(false);
      sheetRef.current?.expand();
      try {
        await claimDrop({
          dropId: BigInt(drop.id.replace(/\D/g, '') || String(Date.now())),
          creator: wallet.publicKey,
          userLat,
          userLng,
          rarity: drop.rarity,
        });
        addOwnedNFT({
          id: `nft-${Date.now()}`,
          dropId: drop.id,
          name: drop.name,
          rarity: drop.rarity,
          claimedAt: Date.now(),
          lat: drop.lat,
          lng: drop.lng,
          artStyle: drop.artStyle,
          imageUri: drop.imageUri,
        });
        setDrops(prev => prev.filter(d => d.id !== drop.id));
        setNearbyDrop(null);
        Animated.timing(nearbyAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start();
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
    },
    [wallet.publicKey, claimDrop, userLat, userLng, showToast, nearbyAnim],
  );

  const handleClaim = useCallback(async () => {
    if (!selected) return;
    await doClaim(selected);
  }, [selected, doClaim]);

  const activeDrops = useMemo(() => drops.filter(d => !d.isClaimed), [drops]);
  const nearbyCount = useMemo(
    () => activeDrops.filter(d => distanceTo(d) <= 200).length,
    [activeDrops, distanceTo],
  );

  const dist = selected ? Math.round(distanceTo(selected)) : 0;
  // Demo mode: always in range so the demo can be shown without walking to seed coords
  const inRange = wallet.isDemoMode || (selected ? dist <= selected.claimRadius : false);

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

      {/* Top HUD */}
      <View style={styles.topBar} pointerEvents="box-none">
        {wallet.publicKey ? (
          <TouchableOpacity
            style={[styles.walletPill, wallet.isDemoMode && styles.walletPillDemo]}
            onPress={() => {
              Clipboard.setString(wallet.publicKey!.toBase58());
              showToast('Address copied!');
            }}
          >
            <Text style={styles.walletText}>
              {wallet.isDemoMode ? '⚡ Demo · ' : '◎ '}
              {truncate(wallet.publicKey.toBase58())}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.connectBtn}
            onPress={connect}
            disabled={wallet.isConnecting}
          >
            {wallet.isConnecting ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.connectBtnText}>🔗 Connect Wallet</Text>
            )}
          </TouchableOpacity>
        )}

        <View style={styles.nearbyBadge} pointerEvents="none">
          <View style={styles.nearbyDot} />
          <Text style={styles.nearbyText}>{nearbyCount} drops</Text>
        </View>
      </View>

      {/* Radar */}
      <View style={styles.radarWrap} pointerEvents="none">
        <RadarRing
          drops={activeDrops}
          userLat={userLat}
          userLng={userLng}
          compassHeading={compass.heading}
        />
      </View>

      {/* Proximity claim button — appears when drop enters range (or demo mode shows all) */}
      {nearbyDrop && !claiming && (
        <Animated.View
          style={[styles.proximityWrap, { transform: [{ scale: nearbyAnim }], opacity: nearbyAnim }]}
        >
          <TouchableOpacity
            style={[styles.proximityBtn, { borderColor: RARITY_CONFIG[nearbyDrop.rarity].color }]}
            onPress={() => doClaim(nearbyDrop)}
            activeOpacity={0.85}
          >
            <Text style={styles.proximityIcon}>◎</Text>
            <View>
              <Text style={styles.proximityName} numberOfLines={1}>{nearbyDrop.name}</Text>
              <Text style={[styles.proximityRarity, { color: RARITY_CONFIG[nearbyDrop.rarity].color }]}>
                {nearbyDrop.rarity.toUpperCase()} — TAP TO CLAIM
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Demo claim helper — shows first drop so user can always demo */}
      {wallet.isDemoMode && !nearbyDrop && activeDrops.length > 0 && (
        <View style={styles.demoHintWrap}>
          <TouchableOpacity
            style={styles.demoHintBtn}
            onPress={() => handleDropTap(activeDrops[0])}
          >
            <Text style={styles.demoHintText}>
              ◎ Tap a glowing drop — or tap here to claim nearest
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Bottom map button */}
      <View style={styles.bottomBar} pointerEvents="box-none">
        <TouchableOpacity style={styles.mapBtn} onPress={() => setShowMap(true)}>
          <Text style={styles.mapBtnText}>🗺  View Map</Text>
        </TouchableOpacity>
      </View>

      {/* Full-screen Leaflet map modal */}
      <Modal visible={showMap} animationType="slide" presentationStyle="fullScreen">
        <View style={styles.mapModal}>
          <View style={styles.mapHeader}>
            <Text style={styles.mapTitle}>Nearby Drops</Text>
            <TouchableOpacity onPress={() => setShowMap(false)} style={styles.mapClose}>
              <Text style={styles.mapCloseText}>Done</Text>
            </TouchableOpacity>
          </View>
          <LeafletMap
            drops={activeDrops}
            userLat={userLat}
            userLng={userLng}
            style={styles.mapFull}
            onDropSelect={drop => { setShowMap(false); handleDropTap(drop); }}
          />
          <View style={styles.mapLegend}>
            <Text style={styles.legendTitle}>Tap a marker → "Select Drop" to claim</Text>
          </View>
        </View>
      </Modal>

      {/* Toast */}
      {toast !== '' && (
        <Animated.View
          style={[styles.toast, { opacity: toastAnim }]}
          pointerEvents="none"
        >
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
            isDemoMode={wallet.isDemoMode}
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
    position: 'absolute', top: 48, left: 16, right: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  walletPill: {
    backgroundColor: 'rgba(0,0,0,0.75)', borderRadius: 100,
    paddingHorizontal: 14, paddingVertical: 9,
    borderWidth: 1, borderColor: 'rgba(10,132,255,0.5)',
  },
  walletPillDemo: { borderColor: 'rgba(255,159,10,0.6)' },
  walletText: { color: C.accent, fontSize: 13, fontWeight: '700' },
  connectBtn: {
    backgroundColor: C.accent, borderRadius: 100,
    paddingHorizontal: 18, paddingVertical: 9,
  },
  connectBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  nearbyBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(0,0,0,0.75)', borderRadius: 100,
    paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: C.sep,
  },
  nearbyDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: C.green },
  nearbyText: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600' },
  radarWrap: { position: 'absolute', top: 108, right: 16 },
  proximityWrap: { position: 'absolute', bottom: 148, left: 16, right: 16 },
  proximityBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: 'rgba(0,0,0,0.92)', borderRadius: 20,
    paddingHorizontal: 20, paddingVertical: 16,
    borderWidth: 2,
  },
  proximityIcon: { color: C.green, fontSize: 28 },
  proximityName: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  proximityRarity: { fontSize: 12, fontWeight: '700', marginTop: 2 },
  demoHintWrap: { position: 'absolute', bottom: 148, left: 16, right: 16 },
  demoHintBtn: {
    backgroundColor: 'rgba(0,0,0,0.85)', borderRadius: 16,
    paddingHorizontal: 20, paddingVertical: 12,
    borderWidth: 1, borderColor: 'rgba(255,159,10,0.4)',
    alignItems: 'center',
  },
  demoHintText: { color: C.orange, fontSize: 13, fontWeight: '600', textAlign: 'center' },
  bottomBar: { position: 'absolute', bottom: 90, left: 0, right: 0, alignItems: 'center' },
  mapBtn: {
    backgroundColor: 'rgba(0,0,0,0.85)', borderRadius: 100,
    paddingHorizontal: 28, paddingVertical: 13,
    borderWidth: 1.5, borderColor: 'rgba(10,132,255,0.5)',
  },
  mapBtnText: { color: C.accent, fontSize: 15, fontWeight: '700' },
  mapModal: { flex: 1, backgroundColor: C.bg },
  mapHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 14, backgroundColor: C.bg,
  },
  mapTitle: { color: C.t1, fontSize: 20, fontWeight: '800' },
  mapClose: { paddingHorizontal: 4, paddingVertical: 4 },
  mapCloseText: { color: C.accent, fontSize: 17, fontWeight: '600' },
  mapFull: { flex: 1, minHeight: 400 },
  mapLegend: { padding: 16, backgroundColor: C.bg, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.sep },
  legendTitle: { color: C.t3, fontSize: 12, marginBottom: 10, textAlign: 'center' },
  legendRow: { flexDirection: 'row', justifyContent: 'space-around' },
  legendItem: { alignItems: 'center', gap: 4 },
  legendEmoji: { fontSize: 18 },
  legendLabel: { fontSize: 10, fontWeight: '700' },
  toast: {
    position: 'absolute', top: '42%', alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.9)', borderRadius: 100,
    paddingHorizontal: 24, paddingVertical: 12,
  },
  toastText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  sheetBg: { backgroundColor: C.s1 },
  handle: { backgroundColor: C.s3 },
});
