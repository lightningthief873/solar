import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useWallet } from '../contexts/WalletContext';
import { getOwnedNFTs } from '../solana/rpc';
import { COLLECTION_SETS, RARITY_CONFIG } from '../utils/constants';
import { C, R } from '../utils/design';
import { ART_STYLES } from '../utils/artStyles';
import type { OwnedNFT, Rarity } from '../types';

const RARITY_ICON: Record<Rarity, string> = {
  common: '🌿', rare: '💎', legendary: '🔥', mythic: '🌟',
};

function rarityCount(nfts: OwnedNFT[], rarity: Rarity) {
  return nfts.filter(n => n.rarity === rarity).length;
}

function setProgress(nfts: OwnedNFT[], required: Partial<Record<Rarity, number>>) {
  const entries = Object.entries(required) as [Rarity, number][];
  const ratio = entries.reduce((min, [r, need]) => Math.min(min, rarityCount(nfts, r) / need), 1);
  return Math.min(1, ratio);
}

function NFTArt({ nft }: { nft: OwnedNFT }) {
  const cfg = RARITY_CONFIG[nft.rarity];
  const art = ART_STYLES[nft.artStyle ?? 'default'];
  return (
    <View style={nftS.artPanel}>
      {nft.imageUri ? (
        <Image source={{ uri: nft.imageUri }} style={nftS.artImage} resizeMode="cover" />
      ) : (
        <LinearGradient
          colors={art ? art.colors : [cfg.color + '55', cfg.color + '11']}
          style={nftS.artFill}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        >
          <Text style={nftS.artEmoji}>{art?.emoji ?? RARITY_ICON[nft.rarity]}</Text>
        </LinearGradient>
      )}
      <View style={[nftS.rarityPill, { backgroundColor: cfg.color + '33', borderColor: cfg.color }]}>
        <Text style={[nftS.rarityPillText, { color: cfg.color }]}>{nft.rarity.toUpperCase()}</Text>
      </View>
    </View>
  );
}

const nftS = StyleSheet.create({
  artPanel: { height: 120, overflow: 'hidden', position: 'relative' },
  artFill: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  artImage: { ...StyleSheet.absoluteFill, width: '100%', height: '100%' },
  artEmoji: { fontSize: 46 },
  rarityPill: { position: 'absolute', bottom: 8, right: 8, borderRadius: R.pill, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2 },
  rarityPillText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
});

function NFTCard({ nft, anim }: { nft: OwnedNFT; anim: Animated.Value }) {
  const cfg = RARITY_CONFIG[nft.rarity];
  const date = new Date(nft.claimedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  const coord = nft.lat != null ? `${nft.lat.toFixed(3)}°, ${nft.lng?.toFixed(3)}°` : '—';

  return (
    <Animated.View style={[
      s.cardWrap,
      { opacity: anim, transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }] },
    ]}>
      <View style={[s.card, { borderColor: cfg.color + '40' }]}>
        <NFTArt nft={nft} />
        <View style={s.cardBody}>
          <Text style={s.nftName} numberOfLines={1}>{nft.name}</Text>
          <Text style={[s.nftRarity, { color: cfg.color }]}>{nft.rarity}</Text>
          <View style={s.metaRow}>
            <Text style={s.metaText}>📍 {coord}</Text>
            <Text style={s.metaText}>📅 {date}</Text>
          </View>
          <View style={s.solanaBadge}>
            <Text style={s.solanaBadgeText}>◎ cNFT</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

function CollectionBar({ set, nfts }: { set: typeof COLLECTION_SETS[0]; nfts: OwnedNFT[] }) {
  const progress = setProgress(nfts, set.required);
  const done = progress >= 1;
  return (
    <View style={[cs.card, done && cs.cardDone]}>
      <View style={cs.header}>
        <Text style={cs.name}>{set.name}</Text>
        {done && <Text style={cs.check}>✓ Complete</Text>}
      </View>
      <Text style={cs.desc}>{set.description}</Text>
      <View style={cs.barBg}>
        <View style={[cs.barFill, { width: `${Math.round(progress * 100)}%` as `${number}%`, backgroundColor: done ? C.green : C.accent }]} />
      </View>
      <Text style={cs.reward}>{set.reward}</Text>
    </View>
  );
}

const cs = StyleSheet.create({
  card: { backgroundColor: C.s1, borderRadius: R.lg, padding: 16, marginBottom: 10 },
  cardDone: { borderWidth: 1, borderColor: C.green },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  name: { color: C.t1, fontSize: 15, fontWeight: '700' },
  check: { color: C.green, fontSize: 12, fontWeight: '700' },
  desc: { color: C.t3, fontSize: 12, marginBottom: 10 },
  barBg: { height: 4, backgroundColor: C.s3, borderRadius: 2, marginBottom: 8 },
  barFill: { height: 4, borderRadius: 2 },
  reward: { color: C.t3, fontSize: 11 },
});

export default function InventoryScreen() {
  const { stats, refreshStats } = useWallet();
  const [nfts, setNfts] = useState<OwnedNFT[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const animsRef = useRef<Animated.Value[]>([]);

  const load = useCallback(() => {
    const loaded = getOwnedNFTs();
    setNfts(loaded);
    animsRef.current = loaded.map(() => new Animated.Value(0));
    Animated.stagger(60, animsRef.current.map(a =>
      Animated.spring(a, { toValue: 1, friction: 7, tension: 80, useNativeDriver: true }),
    )).start();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshStats();
    load();
    setRefreshing(false);
  }, [refreshStats, load]);

  useEffect(() => { load(); }, [load]);

  const streak = stats?.streakCount ?? 0;

  return (
    <FlatList
      style={s.root}
      contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />}
      ListHeaderComponent={
        <View>
          <View style={s.header}>
            <View>
              <Text style={s.pageTitle}>My NFTs</Text>
              <Text style={s.pageSub}>{nfts.length} collected · Solana</Text>
            </View>
            {streak > 0 && (
              <View style={s.streakBadge}>
                <Text style={s.streakText}>🔥 {streak}d</Text>
              </View>
            )}
          </View>

          {COLLECTION_SETS.length > 0 && (
            <>
              <Text style={s.section}>Collections</Text>
              {COLLECTION_SETS.map(set => <CollectionBar key={set.id} set={set} nfts={nfts} />)}
            </>
          )}

          <Text style={s.section}>{nfts.length > 0 ? 'Collected' : 'Start collecting'}</Text>
          {nfts.length === 0 && (
            <View style={s.empty}>
              <Text style={s.emptyEmoji}>◎</Text>
              <Text style={s.emptyTitle}>No NFTs yet</Text>
              <Text style={s.emptyHint}>Walk near a glowing drop in AR and tap to claim.</Text>
            </View>
          )}
        </View>
      }
      data={nfts}
      numColumns={2}
      keyExtractor={item => item.id}
      renderItem={({ item, index }) => (
        <NFTCard nft={item} anim={animsRef.current[index] ?? new Animated.Value(1)} />
      )}
      columnWrapperStyle={s.row}
    />
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  content: { paddingTop: 60, paddingHorizontal: 16, paddingBottom: 48 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 },
  pageTitle: { color: C.t1, fontSize: 34, fontWeight: '800', letterSpacing: -0.5 },
  pageSub: { color: C.t3, fontSize: 13, marginTop: 2 },
  streakBadge: { backgroundColor: 'rgba(255,159,10,0.15)', borderRadius: R.pill, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1, borderColor: C.orange },
  streakText: { color: C.orange, fontSize: 14, fontWeight: '700' },
  section: { color: C.t3, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12, marginTop: 8 },
  row: { gap: 10, marginBottom: 10 },
  cardWrap: { flex: 1 },
  card: { backgroundColor: C.s1, borderRadius: R.lg, overflow: 'hidden', borderWidth: 1 },
  cardBody: { padding: 12 },
  nftName: { color: C.t1, fontSize: 14, fontWeight: '700', marginBottom: 2 },
  nftRarity: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize', marginBottom: 8 },
  metaRow: { gap: 3 },
  metaText: { color: C.t3, fontSize: 10 },
  solanaBadge: { marginTop: 8, backgroundColor: 'rgba(153,102,255,0.15)', borderRadius: R.sm, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  solanaBadgeText: { color: '#9966FF', fontSize: 9, fontWeight: '800' },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 48, color: C.t3, marginBottom: 16 },
  emptyTitle: { color: C.t1, fontSize: 20, fontWeight: '700', marginBottom: 8 },
  emptyHint: { color: C.t3, fontSize: 13, textAlign: 'center', paddingHorizontal: 32, lineHeight: 20 },
});
