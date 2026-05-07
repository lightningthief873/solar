import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { PublicKey } from '@solana/web3.js';
import { useWallet } from '../contexts/WalletContext';
import { getLeaderboard } from '../solana/rpc';
import { PROGRAM_ID } from '../utils/constants';
import type { LeaderboardEntry } from '../types';

const PROGRAM_PUBKEY = new PublicKey(PROGRAM_ID);
const PODIUM_GRADIENT: Record<number, string[]> = {
  1: ['#F39C12', '#7D5A0A'],
  2: ['#BDC3C7', '#555'],
  3: ['#CD7F32', '#5A3710'],
};

function truncate(addr: string) { return `${addr.slice(0, 6)}…${addr.slice(-4)}`; }

function PodiumCard({ entry }: { entry: LeaderboardEntry }) {
  const colors = PODIUM_GRADIENT[entry.rank] ?? ['#333', '#111'];
  return (
    <LinearGradient colors={colors} style={styles.podiumCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <Text style={styles.podiumRank}>#{entry.rank}</Text>
      <Text style={styles.podiumAddr}>{truncate(entry.wallet)}</Text>
      <Text style={styles.podiumClaims}>{entry.totalClaims} claims</Text>
      {entry.streak > 0 && (
        <View style={styles.streakBadge}><Text style={styles.streakText}>🔥 {entry.streak}</Text></View>
      )}
    </LinearGradient>
  );
}

function ListRow({ entry, isMe, slideAnim }: { entry: LeaderboardEntry; isMe: boolean; slideAnim: Animated.Value }) {
  return (
    <Animated.View style={{ transform: [{ translateX: slideAnim }], opacity: slideAnim.interpolate({ inputRange: [0, 60], outputRange: [1, 0] }) }}>
      <View style={[styles.listRow, isMe && styles.listRowMe]}>
        <Text style={styles.listRank}>#{entry.rank}</Text>
        <Text style={[styles.listAddr, isMe && styles.listAddrMe]}>{truncate(entry.wallet)}</Text>
        <View style={styles.listRight}>
          <Text style={styles.listClaims}>{entry.totalClaims}</Text>
          {entry.streak > 0 && <Text style={styles.listStreak}>🔥{entry.streak}</Text>}
        </View>
      </View>
    </Animated.View>
  );
}

export default function LeaderboardScreen() {
  const { wallet } = useWallet();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const slideAnims = useRef<Animated.Value[]>([]);

  const load = useCallback(async () => {
    try {
      setError(false);
      const data = await getLeaderboard(PROGRAM_PUBKEY);
      setEntries(data);
      slideAnims.current = data.slice(3).map(() => new Animated.Value(60));
      Animated.stagger(40, slideAnims.current.map(a =>
        Animated.spring(a, { toValue: 0, friction: 8, tension: 100, useNativeDriver: true }),
      )).start();
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  useEffect(() => {
    load();
    timerRef.current = setInterval(load, 30000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [load]);

  const myAddr = wallet.publicKey?.toBase58();
  const myEntry = entries.find(e => e.wallet === myAddr);
  const podium = entries.slice(0, 3);
  const rest = entries.slice(3);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color="#F39C12" size="large" /></View>;
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Failed to load leaderboard</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={load}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F39C12" />}
      ListHeaderComponent={
        <View>
          <Text style={styles.title}>Leaderboard</Text>
          <Text style={styles.sub}>Top collectors worldwide</Text>
          {entries.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No claims yet — be the first! ◎</Text>
            </View>
          ) : (
            <>
              <View style={styles.podiumRow}>{podium.map(e => <PodiumCard key={e.wallet} entry={e} />)}</View>
              {rest.length > 0 && <Text style={styles.sectionTitle}>Ranks 4–10</Text>}
            </>
          )}
        </View>
      }
      data={rest}
      keyExtractor={item => item.wallet}
      renderItem={({ item, index }) => (
        <ListRow entry={item} isMe={item.wallet === myAddr} slideAnim={slideAnims.current[index] ?? new Animated.Value(0)} />
      )}
      ListFooterComponent={
        myEntry && myEntry.rank > 10 ? (
          <View style={styles.myRankBar}>
            <Text style={styles.myRankText}>Your rank: #{myEntry.rank} · {myEntry.totalClaims} claims</Text>
          </View>
        ) : myAddr && !myEntry ? (
          <View style={styles.myRankBar}>
            <Text style={styles.myRankText}>You are not on the leaderboard yet</Text>
          </View>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0A0F' },
  center: { flex: 1, backgroundColor: '#0A0A0F', alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, paddingTop: 56, paddingBottom: 32 },
  title: { color: '#FFF', fontSize: 26, fontWeight: '900', marginBottom: 2 },
  sub: { color: '#555', fontSize: 14, marginBottom: 20 },
  sectionTitle: { color: '#555', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginTop: 16, marginBottom: 8 },
  podiumRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  podiumCard: { flex: 1, borderRadius: 14, padding: 14, alignItems: 'center' },
  podiumRank: { color: '#000', fontSize: 20, fontWeight: '900' },
  podiumAddr: { color: '#000', fontSize: 11, marginTop: 4, fontWeight: '600' },
  podiumClaims: { color: '#000', fontSize: 13, fontWeight: '700', marginTop: 6 },
  streakBadge: { backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, marginTop: 6 },
  streakText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  listRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111118', borderRadius: 10, padding: 14, marginBottom: 6, borderWidth: 1, borderColor: '#222' },
  listRowMe: { borderColor: '#F39C12', backgroundColor: 'rgba(243,156,18,0.07)' },
  listRank: { color: '#555', fontSize: 14, fontWeight: '700', width: 36 },
  listAddr: { color: '#CCC', fontSize: 14, flex: 1, fontWeight: '500' },
  listAddrMe: { color: '#F39C12' },
  listRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  listClaims: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  listStreak: { color: '#F39C12', fontSize: 12 },
  myRankBar: { marginTop: 16, backgroundColor: 'rgba(243,156,18,0.1)', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#F39C12' },
  myRankText: { color: '#F39C12', fontSize: 14, fontWeight: '700', textAlign: 'center' },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { color: '#444', fontSize: 15 },
  errorText: { color: '#FF6B6B', fontSize: 16, fontWeight: '600', marginBottom: 16 },
  retryBtn: { backgroundColor: '#F39C1222', borderRadius: 10, paddingHorizontal: 24, paddingVertical: 10, borderWidth: 1, borderColor: '#F39C12' },
  retryText: { color: '#F39C12', fontSize: 14, fontWeight: '700' },
});
