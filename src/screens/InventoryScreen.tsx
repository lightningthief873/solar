import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useWallet } from '../contexts/WalletContext';
import { getOwnedNFTs } from '../solana/rpc';
import { COLLECTION_SETS, RARITY_CONFIG } from '../utils/constants';
import type { OwnedNFT, Rarity } from '../types';

const RARITY_ICON: Record<Rarity, string> = {
  common: '🌿', rare: '💎', legendary: '🔥', mythic: '🌟',
};
const RARITY_TAGLINE: Record<Rarity, string> = {
  common: 'Common Claim', rare: 'Rare Find', legendary: 'Legendary Drop', mythic: 'Mythic Artifact',
};

function rarityCount(nfts: OwnedNFT[], rarity: Rarity) {
  return nfts.filter(n => n.rarity === rarity).length;
}

function setProgress(nfts: OwnedNFT[], required: Partial<Record<Rarity, number>>) {
  const entries = Object.entries(required) as [Rarity, number][];
  const ratio = entries.reduce((min, [r, need]) => Math.min(min, rarityCount(nfts, r) / need), 1);
  return Math.min(1, ratio);
}

function NFTCard({ nft, anim }: { nft: OwnedNFT; anim: Animated.Value }) {
  const cfg = RARITY_CONFIG[nft.rarity];
  const date = new Date(nft.claimedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
  const coord = nft.lat != null ? `${nft.lat.toFixed(4)}°N ${nft.lng?.toFixed(4)}°E` : 'Unknown location';

  return (
    <Animated.View style={[
      styles.cardWrap,
      { opacity: anim, transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1] }) }] },
    ]}>
      <LinearGradient
        colors={[cfg.color + '22', '#0D0D18', '#0D0D18']}
        style={[styles.nftCard, { borderColor: cfg.color + '55' }]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      >
        {/* Art area */}
        <LinearGradient
          colors={[cfg.color + '44', cfg.color + '11']}
          style={styles.artPanel}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        >
          <Text style={styles.artIcon}>{RARITY_ICON[nft.rarity]}</Text>
          <View style={[styles.rarityChip, { backgroundColor: cfg.color + '33', borderColor: cfg.color }]}>
            <Text style={[styles.rarityChipText, { color: cfg.color }]}>{nft.rarity.toUpperCase()}</Text>
          </View>
        </LinearGradient>

        {/* Info */}
        <View style={styles.cardInfo}>
          <Text style={styles.nftName} numberOfLines={1}>{nft.name}</Text>
          <Text style={[styles.tagline, { color: cfg.color }]}>{RARITY_TAGLINE[nft.rarity]}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaIcon}>📍</Text>
            <Text style={styles.metaText} numberOfLines={1}>{coord}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaIcon}>📅</Text>
            <Text style={styles.metaText}>{date}</Text>
          </View>
          <View style={styles.solanaTag}>
            <Text style={styles.solanaTagText}>◎ Solana cNFT</Text>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

function CollectionCard({ set, nfts }: { set: typeof COLLECTION_SETS[0]; nfts: OwnedNFT[] }) {
  const progress = setProgress(nfts, set.required);
  const complete = progress >= 1;
  return (
    <View style={[styles.setCard, complete && styles.setCardComplete]}>
      {complete && (
        <View style={styles.completeOverlay}>
          <Text style={styles.completeText}>✓ COMPLETE</Text>
        </View>
      )}
      <Text style={styles.setName}>{set.name}</Text>
      <Text style={styles.setDesc}>{set.description}</Text>
      <View style={styles.progressBar}>
        <Animated.View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
      </View>
      <Text style={styles.setReward}>{set.reward}</Text>
    </View>
  );
}

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
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00BFFF" />}
      ListHeaderComponent={
        <View>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>My NFTs</Text>
              <Text style={styles.subtitle}>{nfts.length} collected on Solana</Text>
            </View>
            {streak > 0 && (
              <View style={styles.streakBadge}>
                <Text style={styles.streakText}>🔥 {streak}d streak</Text>
              </View>
            )}
          </View>

          {COLLECTION_SETS.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Collection Sets</Text>
              {COLLECTION_SETS.map(set => <CollectionCard key={set.id} set={set} nfts={nfts} />)}
            </>
          )}

          <Text style={styles.sectionTitle}>Collected NFTs</Text>
          {nfts.length === 0 && (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>◎</Text>
              <Text style={styles.emptyText}>No NFTs yet</Text>
              <Text style={styles.emptyHint}>Walk near a glowing drop and tap to claim your first NFT.</Text>
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
      columnWrapperStyle={styles.row}
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0A0F' },
  content: { padding: 16, paddingTop: 56, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 },
  title: { color: '#FFF', fontSize: 28, fontWeight: '900' },
  subtitle: { color: '#555', fontSize: 13, marginTop: 2 },
  streakBadge: { backgroundColor: '#F39C1233', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1, borderColor: '#F39C12' },
  streakText: { color: '#F39C12', fontSize: 14, fontWeight: '700' },
  sectionTitle: { color: '#555', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12, marginTop: 8 },
  setCard: { backgroundColor: '#111118', borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#1E1E2E', overflow: 'hidden' },
  setCardComplete: { borderColor: '#00FF88' },
  completeOverlay: { position: 'absolute', top: 8, right: 12 },
  completeText: { color: '#00FF88', fontSize: 12, fontWeight: '800' },
  setName: { color: '#FFF', fontSize: 15, fontWeight: '700', marginBottom: 4 },
  setDesc: { color: '#666', fontSize: 12, marginBottom: 10 },
  progressBar: { height: 4, backgroundColor: '#1E1E2E', borderRadius: 2, marginBottom: 8 },
  progressFill: { height: 4, backgroundColor: '#00BFFF', borderRadius: 2 },
  setReward: { color: '#444', fontSize: 11 },
  row: { gap: 10, marginBottom: 10 },
  cardWrap: { flex: 1 },
  nftCard: { flex: 1, borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  artPanel: { height: 110, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  artIcon: { fontSize: 42 },
  rarityChip: { position: 'absolute', bottom: 8, right: 8, borderRadius: 8, borderWidth: 1, paddingHorizontal: 7, paddingVertical: 2 },
  rarityChipText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  cardInfo: { padding: 12 },
  nftName: { color: '#FFF', fontSize: 14, fontWeight: '800', marginBottom: 2 },
  tagline: { fontSize: 11, fontWeight: '600', marginBottom: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 3 },
  metaIcon: { fontSize: 10 },
  metaText: { color: '#555', fontSize: 10, flex: 1 },
  solanaTag: { marginTop: 8, backgroundColor: '#9B59B622', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start' },
  solanaTagText: { color: '#9B59B6', fontSize: 10, fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { color: '#AAA', fontSize: 20, fontWeight: '800' },
  emptyHint: { color: '#555', fontSize: 13, marginTop: 8, textAlign: 'center', paddingHorizontal: 32 },
});
