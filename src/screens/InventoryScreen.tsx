import React, { useCallback, useEffect, useState } from 'react';
import {
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

function rarityCount(nfts: OwnedNFT[], rarity: Rarity) {
  return nfts.filter(n => n.rarity === rarity).length;
}

function setProgress(nfts: OwnedNFT[], required: Partial<Record<Rarity, number>>) {
  const entries = Object.entries(required) as [Rarity, number][];
  const ratio = entries.reduce((min, [r, need]) => {
    const have = rarityCount(nfts, r);
    return Math.min(min, have / need);
  }, 1);
  return Math.min(1, ratio);
}

function NFTCard({ nft }: { nft: OwnedNFT }) {
  const cfg = RARITY_CONFIG[nft.rarity];
  const date = new Date(nft.claimedAt).toLocaleDateString();
  return (
    <LinearGradient
      colors={[cfg.color + '33', '#0A0A0F']}
      style={styles.nftCard}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={[styles.rarityDot, { backgroundColor: cfg.color }]} />
      <Text style={styles.nftName} numberOfLines={1}>{nft.name}</Text>
      <View style={[styles.rarityPill, { borderColor: cfg.color }]}>
        <Text style={[styles.rarityPillText, { color: cfg.color }]}>{nft.rarity.toUpperCase()}</Text>
      </View>
      <Text style={styles.claimedDate}>Claimed {date}</Text>
    </LinearGradient>
  );
}

function CollectionCard({ set, nfts }: { set: typeof COLLECTION_SETS[0]; nfts: OwnedNFT[] }) {
  const progress = setProgress(nfts, set.required);
  const complete = progress >= 1;
  return (
    <View style={[styles.setCard, complete && styles.setCardComplete]}>
      {complete && <View style={styles.completeOverlay}><Text style={styles.completeText}>COMPLETE ✓</Text></View>}
      <Text style={styles.setName}>{set.name}</Text>
      <Text style={styles.setDesc}>{set.description}</Text>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
      </View>
      <Text style={styles.setReward}>{set.reward}</Text>
    </View>
  );
}

export default function InventoryScreen() {
  const { wallet, stats, refreshStats } = useWallet();
  const [nfts, setNfts] = useState<OwnedNFT[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    setNfts(getOwnedNFTs());
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
            <Text style={styles.title}>{nfts.length} NFTs Collected</Text>
            {streak > 0 && (
              <View style={styles.streakBadge}>
                <Text style={styles.streakText}>🔥 {streak}d streak</Text>
              </View>
            )}
          </View>

          <Text style={styles.sectionTitle}>Collection Sets</Text>
          {COLLECTION_SETS.map(set => (
            <CollectionCard key={set.id} set={set} nfts={nfts} />
          ))}

          <Text style={styles.sectionTitle}>Your NFTs</Text>
          {nfts.length === 0 && (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No NFTs yet — go explore! ◎</Text>
            </View>
          )}
        </View>
      }
      data={nfts}
      numColumns={2}
      keyExtractor={item => item.id}
      renderItem={({ item }) => <NFTCard nft={item} />}
      columnWrapperStyle={styles.row}
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0A0F' },
  content: { padding: 16, paddingTop: 56, paddingBottom: 32 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  title: { color: '#FFF', fontSize: 22, fontWeight: '800' },
  streakBadge: { backgroundColor: '#F39C1233', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1, borderColor: '#F39C12' },
  streakText: { color: '#F39C12', fontSize: 13, fontWeight: '700' },
  sectionTitle: { color: '#777', fontSize: 13, fontWeight: '700', textTransform: 'uppercase', marginBottom: 12, marginTop: 8 },
  setCard: { backgroundColor: '#111118', borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#222', overflow: 'hidden' },
  setCardComplete: { borderColor: '#00FF88' },
  completeOverlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(0,255,136,0.08)', alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  completeText: { color: '#00FF88', fontSize: 16, fontWeight: '800' },
  setName: { color: '#FFF', fontSize: 16, fontWeight: '700', marginBottom: 4 },
  setDesc: { color: '#888', fontSize: 13, marginBottom: 10 },
  progressBar: { height: 6, backgroundColor: '#222', borderRadius: 3, marginBottom: 8 },
  progressFill: { height: 6, backgroundColor: '#00BFFF', borderRadius: 3 },
  setReward: { color: '#555', fontSize: 12 },
  row: { gap: 10, marginBottom: 10 },
  nftCard: { flex: 1, borderRadius: 14, padding: 14, minHeight: 120, justifyContent: 'space-between' },
  rarityDot: { width: 10, height: 10, borderRadius: 5 },
  nftName: { color: '#FFF', fontSize: 14, fontWeight: '700', marginTop: 8 },
  rarityPill: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start' },
  rarityPillText: { fontSize: 10, fontWeight: '700' },
  claimedDate: { color: '#555', fontSize: 10, marginTop: 4 },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { color: '#444', fontSize: 15 },
});
