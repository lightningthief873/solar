import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Clipboard,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import HapticFeedback from 'react-native-haptic-feedback';
import { ARScene } from '../ar/ARScene';
import { RadarRing } from '../components/RadarRing';
import { MiniMap } from '../components/MiniMap';
import { useGPS } from '../hooks/useGPS';
import { useCompass } from '../hooks/useCompass';
import { useWallet } from '../contexts/WalletContext';
import { RARITY_CONFIG, PROGRAM_ID } from '../utils/constants';
import { haversineDistance } from '../utils/haversine';
import { SEED_DROPS } from '../utils/seedDrops';
import { addOwnedNFT } from '../solana/rpc';
import type { Drop } from '../types';

const DEFAULT_LAT = 18.5204;
const DEFAULT_LNG = 73.8567;

function truncate(addr: string) {
  return addr.length > 12 ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : addr;
}

function Countdown({ expiresAt }: { expiresAt: number }) {
  const [left, setLeft] = useState(Math.max(0, expiresAt - Date.now()));
  useEffect(() => {
    const id = setInterval(() => setLeft(Math.max(0, expiresAt - Date.now())), 1000);
    return () => clearInterval(id);
  }, [expiresAt]);
  const h = Math.floor(left / 3600000);
  const m = Math.floor((left % 3600000) / 60000);
  const s = Math.floor((left % 60000) / 1000);
  return <Text style={styles.countdown}>{`${h}h ${m}m ${s}s`}</Text>;
}

export default function ExploreScreen() {
  const gps = useGPS();
  const compass = useCompass();
  const { wallet, claimDrop, stats } = useWallet();
  const [drops, setDrops] = useState<Drop[]>(SEED_DROPS);
  const [selected, setSelected] = useState<Drop | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [claiming, setClaiming] = useState(false);
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
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleDropTap = useCallback((drop: Drop) => {
    setSelected(drop);
    sheetRef.current?.expand();
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
      sheetRef.current?.close();
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
  const rarityColor = selected ? RARITY_CONFIG[selected.rarity].color : '#FFF';

  return (
    <View style={styles.root}>
      <ARScene
        drops={drops}
        userLat={userLat}
        userLng={userLng}
        compassHeading={compass.heading}
        onDropTap={handleDropTap}
      />

      {/* Wallet pill — top left */}
      {wallet.publicKey && (
        <TouchableOpacity
          style={styles.walletPill}
          onPress={() => {
            Clipboard.setString(wallet.publicKey!.toBase58());
            showToast('Copied!');
          }}
        >
          <Text style={styles.walletText}>{truncate(wallet.publicKey.toBase58())}</Text>
        </TouchableOpacity>
      )}

      {/* Radar — top right */}
      <View style={styles.radarWrap} pointerEvents="none">
        <RadarRing drops={drops} userLat={userLat} userLng={userLng} compassHeading={compass.heading} />
      </View>

      {/* Nearby badge — bottom right */}
      <View style={styles.nearbyBadge} pointerEvents="none">
        <Text style={styles.nearbyText}>{nearbyCount} drops nearby</Text>
      </View>

      {/* Map toggle — bottom left */}
      <TouchableOpacity style={styles.mapToggle} onPress={() => setShowMap(v => !v)}>
        <Text style={styles.mapToggleText}>{showMap ? '✕ Map' : '🗺 Map'}</Text>
      </TouchableOpacity>

      {showMap && (
        <View style={styles.mapContainer}>
          <MiniMap drops={drops} userLat={userLat} userLng={userLng} onDropSelect={handleDropTap} />
        </View>
      )}

      {/* Toast */}
      {toast !== '' && (
        <View style={styles.toast} pointerEvents="none">
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}

      {/* Claim bottom sheet */}
      <BottomSheet
        ref={sheetRef}
        index={-1}
        snapPoints={['60%']}
        enablePanDownToClose
        backgroundStyle={styles.sheetBg}
        handleIndicatorStyle={styles.handle}
      >
        <BottomSheetView style={styles.sheet}>
          {selected && (
            <>
              <Text style={styles.dropName}>{selected.name}</Text>
              <View style={styles.badges}>
                <View style={[styles.rarityBadge, { backgroundColor: rarityColor + '33', borderColor: rarityColor }]}>
                  <Text style={[styles.rarityText, { color: rarityColor }]}>{selected.rarity.toUpperCase()}</Text>
                </View>
                <View style={styles.modeBadge}>
                  <Text style={styles.modeText}>{selected.mode === 'event' ? '⚡ Event' : '🏛 Tourism'}</Text>
                </View>
              </View>

              {selected.mode === 'event' && selected.expiresAt && (
                <View style={styles.row}>
                  <Text style={styles.label}>Expires in:</Text>
                  <Countdown expiresAt={selected.expiresAt} />
                </View>
              )}
              {selected.mode === 'tourism' && (
                <Text style={styles.heritage}>
                  {selected.description ?? 'A permanent landmark drop — part of the SolAR heritage trail.'}
                </Text>
              )}

              <View style={styles.row}>
                <Text style={styles.label}>Distance:</Text>
                <Text style={[styles.distVal, { color: inRange ? '#00FF88' : '#FF6B6B' }]}>
                  {dist}m {inRange ? '✓ in range' : `(need ${selected.claimRadius}m)`}
                </Text>
              </View>

              {selected.priceSOL > 0 && (
                <View style={styles.row}>
                  <Text style={styles.label}>Price:</Text>
                  <Text style={styles.price}>{selected.priceSOL} SOL</Text>
                </View>
              )}

              <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
                <TouchableOpacity
                  style={[styles.claimBtn, !inRange && styles.claimBtnDisabled, { borderColor: rarityColor }]}
                  onPress={handleClaim}
                  disabled={!inRange || claiming}
                  activeOpacity={0.8}
                >
                  {claiming ? (
                    <ActivityIndicator color={rarityColor} />
                  ) : (
                    <Text style={[styles.claimBtnText, { color: inRange ? rarityColor : '#555' }]}>
                      {inRange ? 'Claim Drop' : 'Too Far Away'}
                    </Text>
                  )}
                </TouchableOpacity>
              </Animated.View>

              {!wallet.publicKey && (
                <Text style={styles.connectHint}>Connect wallet to claim</Text>
              )}
            </>
          )}
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  walletPill: {
    position: 'absolute', top: 48, left: 16,
    backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: 'rgba(0,191,255,0.4)',
  },
  walletText: { color: '#00BFFF', fontSize: 12, fontWeight: '600' },
  radarWrap: { position: 'absolute', top: 40, right: 16 },
  nearbyBadge: {
    position: 'absolute', bottom: 80, right: 16,
    backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  nearbyText: { color: '#CCC', fontSize: 12 },
  mapToggle: {
    position: 'absolute', bottom: 80, left: 16,
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: 'rgba(0,191,255,0.5)',
  },
  mapToggleText: { color: '#00BFFF', fontSize: 14, fontWeight: '700' },
  mapContainer: { position: 'absolute', bottom: 120, left: 16, width: 200, height: 200, borderRadius: 12, overflow: 'hidden' },
  toast: {
    position: 'absolute', top: '45%', alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.85)', borderRadius: 20,
    paddingHorizontal: 20, paddingVertical: 10,
  },
  toastText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  sheetBg: { backgroundColor: '#111118' },
  handle: { backgroundColor: '#444' },
  sheet: { padding: 20, flex: 1 },
  dropName: { color: '#FFF', fontSize: 24, fontWeight: '800', marginBottom: 12 },
  badges: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  rarityBadge: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 4 },
  rarityText: { fontSize: 12, fontWeight: '700' },
  modeBadge: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4 },
  modeText: { color: '#CCC', fontSize: 12 },
  countdown: { color: '#F39C12', fontSize: 16, fontWeight: '700' },
  heritage: { color: '#888', fontSize: 14, lineHeight: 20, marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  label: { color: '#777', fontSize: 14 },
  distVal: { fontSize: 14, fontWeight: '600' },
  price: { color: '#F39C12', fontSize: 14, fontWeight: '700' },
  claimBtn: {
    borderWidth: 2, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  claimBtnDisabled: { borderColor: '#333', backgroundColor: 'transparent' },
  claimBtnText: { fontSize: 18, fontWeight: '800' },
  connectHint: { color: '#555', textAlign: 'center', marginTop: 8, fontSize: 13 },
});
