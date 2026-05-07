import React from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { BottomSheetView, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { RARITY_CONFIG } from '../utils/constants';
import { ART_STYLES } from '../utils/artStyles';
import { C, R } from '../utils/design';
import type { Drop } from '../types';

function Countdown({ expiresAt }: { expiresAt: number }) {
  const [left, setLeft] = React.useState(Math.max(0, expiresAt - Date.now()));
  React.useEffect(() => {
    const id = setInterval(() => setLeft(Math.max(0, expiresAt - Date.now())), 1000);
    return () => clearInterval(id);
  }, [expiresAt]);
  const h = Math.floor(left / 3600000);
  const m = Math.floor((left % 3600000) / 60000);
  const s = Math.floor((left % 60000) / 1000);
  return <Text style={st.countdown}>{`${h}h ${m}m ${s}s`}</Text>;
}

interface Props {
  drop: Drop;
  distanceM: number;
  inRange: boolean;
  claiming: boolean;
  claimed: boolean;
  shakeAnim: Animated.Value;
  walletConnected: boolean;
  isDemoMode?: boolean;
  onClaim: () => void;
}

export function ClaimSheet({ drop, distanceM, inRange, claiming, claimed, shakeAnim, walletConnected, isDemoMode, onClaim }: Props) {
  const canClaim = inRange || isDemoMode;
  const cfg = RARITY_CONFIG[drop.rarity];
  const art = ART_STYLES[drop.artStyle ?? 'default'];

  const handleShare = () => {
    Share.share({
      message: `I found a ${drop.rarity.toUpperCase()} NFT at [${drop.lat.toFixed(4)}, ${drop.lng.toFixed(4)}] on SolAR. Come find yours!\nsolar://drop?id=${drop.id}`,
      title: `SolAR — ${drop.name}`,
    }).catch(() => {});
  };

  return (
    <BottomSheetScrollView contentContainerStyle={st.sheet}>
      {/* NFT art preview */}
      {drop.imageUri ? (
        <View style={st.artBanner}>
          <Image source={{ uri: drop.imageUri }} style={st.artImage} resizeMode="cover" />
          <View style={[st.rarityPill, { backgroundColor: cfg.color + '33', borderColor: cfg.color }]}>
            <Text style={[st.rarityPillText, { color: cfg.color }]}>{drop.rarity.toUpperCase()}</Text>
          </View>
          <View style={st.modePill}>
            <Text style={st.modePillText}>{drop.mode === 'event' ? '⚡ Event' : '🏛 Tourism'}</Text>
          </View>
        </View>
      ) : (
        <LinearGradient
          colors={art.colors.length >= 2 ? art.colors : [cfg.color + '44', '#000']}
          style={st.artBanner}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        >
          <Text style={st.artEmoji}>{art.emoji}</Text>
          <View style={[st.rarityPill, { backgroundColor: cfg.color + '33', borderColor: cfg.color }]}>
            <Text style={[st.rarityPillText, { color: cfg.color }]}>{drop.rarity.toUpperCase()}</Text>
          </View>
          <View style={st.modePill}>
            <Text style={st.modePillText}>{drop.mode === 'event' ? '⚡ Event' : '🏛 Tourism'}</Text>
          </View>
        </LinearGradient>
      )}

      <View style={st.body}>
        <Text style={st.dropName}>{drop.name}</Text>
        {drop.description ? (
          <Text style={st.description}>{drop.description}</Text>
        ) : null}

        {drop.mode === 'event' && drop.expiresAt && (
          <View style={st.infoRow}>
            <Text style={st.infoLabel}>Expires in</Text>
            <Countdown expiresAt={drop.expiresAt} />
          </View>
        )}

        <View style={st.infoRow}>
          <Text style={st.infoLabel}>Distance</Text>
          <Text style={[st.infoValue, { color: canClaim ? C.green : C.red }]}>
            {distanceM}m {canClaim ? '✓ in range' : `(need ${drop.claimRadius}m)`}
            {isDemoMode && !inRange ? ' · demo' : ''}
          </Text>
        </View>

        {drop.priceSOL > 0 && (
          <View style={st.infoRow}>
            <Text style={st.infoLabel}>Price</Text>
            <Text style={[st.infoValue, { color: C.orange }]}>{drop.priceSOL} SOL ◎</Text>
          </View>
        )}

        {!walletConnected && (
          <View style={st.warnBox}>
            <Text style={st.warnText}>Connect wallet to claim</Text>
          </View>
        )}

        {claimed ? (
          <TouchableOpacity style={st.shareBtn} onPress={handleShare} activeOpacity={0.85}>
            <Text style={st.shareBtnText}>Share this Drop ↗</Text>
          </TouchableOpacity>
        ) : (
          <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
            <TouchableOpacity
              style={[st.claimBtn, { backgroundColor: canClaim ? cfg.color : C.s2 }]}
              onPress={onClaim}
              disabled={!canClaim || claiming}
              activeOpacity={0.85}
            >
              {claiming ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={[st.claimBtnText, { color: canClaim ? '#000' : C.t3 }]}>
                  {canClaim ? 'Claim Drop' : 'Too Far Away'}
                </Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </BottomSheetScrollView>
  );
}

const st = StyleSheet.create({
  sheet: { paddingBottom: 40 },
  artBanner: { height: 200, alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' },
  artImage: { ...StyleSheet.absoluteFill, width: '100%', height: '100%' },
  artEmoji: { fontSize: 64 },
  rarityPill: { position: 'absolute', top: 12, right: 12, borderRadius: R.pill, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  rarityPillText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  modePill: { position: 'absolute', top: 12, left: 12, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: R.pill, paddingHorizontal: 10, paddingVertical: 4 },
  modePillText: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '600' },
  body: { padding: 20 },
  dropName: { color: C.t1, fontSize: 26, fontWeight: '800', letterSpacing: -0.5, marginBottom: 6 },
  description: { color: C.t2, fontSize: 14, lineHeight: 20, marginBottom: 14 },
  infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.sep },
  infoLabel: { color: C.t3, fontSize: 14 },
  infoValue: { fontSize: 14, fontWeight: '700' },
  countdown: { color: C.orange, fontSize: 16, fontWeight: '700' },
  warnBox: { backgroundColor: 'rgba(255,69,58,0.1)', borderRadius: R.md, padding: 12, marginTop: 16, alignItems: 'center' },
  warnText: { color: C.red, fontSize: 13, fontWeight: '600' },
  claimBtn: { borderRadius: R.lg, paddingVertical: 18, alignItems: 'center', marginTop: 20 },
  claimBtnText: { fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
  shareBtn: { marginTop: 20, backgroundColor: C.s1, borderRadius: R.lg, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: C.sep },
  shareBtnText: { color: C.accent, fontSize: 16, fontWeight: '700' },
});
