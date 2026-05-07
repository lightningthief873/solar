import React from 'react';
import {
  ActivityIndicator,
  Animated,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BottomSheetView } from '@gorhom/bottom-sheet';
import { RARITY_CONFIG } from '../utils/constants';
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
  return <Text style={s_.countdown}>{`${h}h ${m}m ${s}s`}</Text>;
}

interface Props {
  drop: Drop;
  distanceM: number;
  inRange: boolean;
  claiming: boolean;
  claimed: boolean;
  shakeAnim: Animated.Value;
  walletConnected: boolean;
  onClaim: () => void;
}

export function ClaimSheet({ drop, distanceM, inRange, claiming, claimed, shakeAnim, walletConnected, onClaim }: Props) {
  const rarityColor = RARITY_CONFIG[drop.rarity].color;

  const handleShare = () => {
    const url = `solar://drop?id=${drop.id}&lat=${drop.lat}&lng=${drop.lng}`;
    Share.share({
      message: `I just claimed a ${drop.rarity.toUpperCase()} NFT at [${drop.lat.toFixed(5)}, ${drop.lng.toFixed(5)}] on SolAR. Come find yours 🌐\n${url}`,
      title: `SolAR — ${drop.name}`,
    }).catch(() => {});
  };

  return (
    <BottomSheetView style={s_.sheet}>
      <Text style={s_.dropName}>{drop.name}</Text>

      <View style={s_.badges}>
        <View style={[s_.rarityBadge, { backgroundColor: rarityColor + '33', borderColor: rarityColor }]}>
          <Text style={[s_.rarityText, { color: rarityColor }]}>{drop.rarity.toUpperCase()}</Text>
        </View>
        <View style={s_.modeBadge}>
          <Text style={s_.modeText}>{drop.mode === 'event' ? '⚡ Event' : '🏛 Tourism'}</Text>
        </View>
      </View>

      {drop.mode === 'event' && drop.expiresAt && (
        <View style={s_.row}>
          <Text style={s_.label}>Expires in:</Text>
          <Countdown expiresAt={drop.expiresAt} />
        </View>
      )}
      {drop.mode === 'tourism' && (
        <Text style={s_.heritage}>
          {drop.description ?? 'A permanent landmark drop — part of the SolAR heritage trail.'}
        </Text>
      )}

      <View style={s_.row}>
        <Text style={s_.label}>Distance:</Text>
        <Text style={[s_.distVal, { color: inRange ? '#00FF88' : '#FF6B6B' }]}>
          {distanceM}m {inRange ? '✓ in range' : `(need ${drop.claimRadius}m)`}
        </Text>
      </View>

      {drop.priceSOL > 0 && (
        <View style={s_.row}>
          <Text style={s_.label}>Price:</Text>
          <Text style={s_.price}>{drop.priceSOL} SOL</Text>
        </View>
      )}

      {claimed ? (
        <TouchableOpacity style={s_.shareBtn} onPress={handleShare}>
          <Text style={s_.shareBtnText}>Share Drop ↗</Text>
        </TouchableOpacity>
      ) : (
        <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
          <TouchableOpacity
            style={[s_.claimBtn, !inRange && s_.claimBtnDisabled, { borderColor: inRange ? rarityColor : '#333' }]}
            onPress={onClaim}
            disabled={!inRange || claiming}
            activeOpacity={0.8}
          >
            {claiming ? (
              <ActivityIndicator color={rarityColor} />
            ) : (
              <Text style={[s_.claimBtnText, { color: inRange ? rarityColor : '#555' }]}>
                {inRange ? 'Claim Drop' : 'Too Far Away'}
              </Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      )}

      {!walletConnected && <Text style={s_.connectHint}>Connect wallet to claim</Text>}
    </BottomSheetView>
  );
}

const s_ = StyleSheet.create({
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
  claimBtn: { borderWidth: 2, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8, backgroundColor: 'rgba(255,255,255,0.05)' },
  claimBtnDisabled: { backgroundColor: 'transparent' },
  claimBtnText: { fontSize: 18, fontWeight: '800' },
  shareBtn: { marginTop: 12, backgroundColor: '#00BFFF22', borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: '#00BFFF' },
  shareBtnText: { color: '#00BFFF', fontSize: 16, fontWeight: '700' },
  connectHint: { color: '#555', textAlign: 'center', marginTop: 8, fontSize: 13 },
});
