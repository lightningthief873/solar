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
import { walletAvatar, getUsername } from '../utils/avatar';
import { C, R } from '../utils/design';
import type { LeaderboardEntry } from '../types';

const PROGRAM_PUBKEY = new PublicKey(PROGRAM_ID);

const MEDAL = ['🥇', '🥈', '🥉'];
const PODIUM_BG: Record<number, string[]> = {
  1: ['#FFD60A', '#FF9500'],
  2: ['#8E8E93', '#636366'],
  3: ['#CD7F32', '#7D4A0A'],
};

function truncate(addr: string) { return `${addr.slice(0, 6)}…${addr.slice(-4)}`; }

function Avatar({ addr, size = 40 }: { addr: string; size?: number }) {
  const av = walletAvatar(addr);
  return (
    <View style={[av_.ring, { width: size, height: size, borderRadius: size / 2, borderColor: av.color, backgroundColor: av.color + '22' }]}>
      <Text style={{ fontSize: size * 0.48 }}>{av.emoji}</Text>
    </View>
  );
}

const av_ = StyleSheet.create({
  ring: { borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
});

function PodiumCard({ entry, myAddr }: { entry: LeaderboardEntry; myAddr?: string }) {
  const isMe = entry.wallet === myAddr;
  const colors = PODIUM_BG[entry.rank] ?? [C.s2, C.s1];
  const name = entry.username || (entry.wallet === myAddr ? (getUsername() || truncate(entry.wallet)) : truncate(entry.wallet));
  return (
    <LinearGradient colors={colors} style={[po_.card, isMe && po_.cardMe]} start={{ x: 0, y: 0 }} end={{ x: 0.7, y: 1 }}>
      <Text style={po_.medal}>{MEDAL[entry.rank - 1]}</Text>
      <Avatar addr={entry.wallet} size={44} />
      <Text style={po_.name} numberOfLines={1}>{name}</Text>
      <Text style={po_.claims}>{entry.totalClaims}</Text>
      <Text style={po_.claimsLabel}>claims</Text>
      {entry.streak > 0 && <Text style={po_.streak}>🔥 {entry.streak}d</Text>}
    </LinearGradient>
  );
}

const po_ = StyleSheet.create({
  card: { flex: 1, borderRadius: R.lg, padding: 14, alignItems: 'center', gap: 4 },
  cardMe: { borderWidth: 2, borderColor: '#fff' },
  medal: { fontSize: 22, marginBottom: 4 },
  name: { color: '#fff', fontSize: 11, fontWeight: '700', marginTop: 6, textAlign: 'center' },
  claims: { color: '#fff', fontSize: 22, fontWeight: '900', marginTop: 4, letterSpacing: -0.5 },
  claimsLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 10 },
  streak: { fontSize: 11, color: '#fff', marginTop: 2 },
});

function ListRow({ entry, isMe, slideAnim }: { entry: LeaderboardEntry; isMe: boolean; slideAnim: Animated.Value }) {
  const name = entry.username || (isMe ? (getUsername() || truncate(entry.wallet)) : truncate(entry.wallet));
  return (
    <Animated.View style={{ transform: [{ translateX: slideAnim }], opacity: slideAnim.interpolate({ inputRange: [0, 60], outputRange: [1, 0] }) }}>
      <View style={[ro_.row, isMe && ro_.rowMe]}>
        <Text style={ro_.rank}>#{entry.rank}</Text>
        <Avatar addr={entry.wallet} size={36} />
        <Text style={[ro_.name, isMe && ro_.nameMe]} numberOfLines={1}>{name}</Text>
        <View style={ro_.right}>
          {entry.streak > 0 && <Text style={ro_.streak}>🔥{entry.streak}</Text>}
          <Text style={ro_.claims}>{entry.totalClaims}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const ro_ = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.s1, borderRadius: R.md, padding: 12, marginBottom: 8 },
  rowMe: { borderWidth: 1, borderColor: C.accent },
  rank: { color: C.t3, fontSize: 13, fontWeight: '700', width: 30 },
  name: { color: C.t1, fontSize: 14, fontWeight: '600', flex: 1 },
  nameMe: { color: C.accent },
  right: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  streak: { color: C.orange, fontSize: 12 },
  claims: { color: C.t1, fontSize: 16, fontWeight: '800', minWidth: 32, textAlign: 'right' },
});

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
      Animated.stagger(50, slideAnims.current.map(a =>
        Animated.spring(a, { toValue: 0, friction: 8, tension: 100, useNativeDriver: true }),
      )).start();
    } catch { setError(true); }
    finally { setLoading(false); }
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
    return <View style={s.center}><ActivityIndicator color={C.accent} size="large" /></View>;
  }

  if (error) {
    return (
      <View style={s.center}>
        <Text style={s.errorText}>Couldn't load leaderboard</Text>
        <TouchableOpacity style={s.retryBtn} onPress={load}>
          <Text style={s.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      style={s.root}
      contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />}
      ListHeaderComponent={
        <View>
          <Text style={s.pageTitle}>Leaderboard</Text>
          <Text style={s.pageSub}>Top collectors worldwide</Text>
          {entries.length === 0 ? (
            <View style={s.empty}>
              <Text style={s.emptyEmoji}>◎</Text>
              <Text style={s.emptyText}>Be the first to claim a drop</Text>
            </View>
          ) : (
            <>
              <View style={s.podiumRow}>
                {podium.map(e => <PodiumCard key={e.wallet} entry={e} myAddr={myAddr} />)}
              </View>
              {rest.length > 0 && <Text style={s.section}>Ranks 4–10</Text>}
            </>
          )}
        </View>
      }
      data={rest}
      keyExtractor={item => item.wallet}
      renderItem={({ item, index }) => (
        <ListRow
          entry={item}
          isMe={item.wallet === myAddr}
          slideAnim={slideAnims.current[index] ?? new Animated.Value(0)}
        />
      )}
      ListFooterComponent={
        myEntry && myEntry.rank > 10 ? (
          <View style={s.myRankBar}>
            <Avatar addr={myAddr!} size={32} />
            <Text style={s.myRankText}>You · #{myEntry.rank} · {myEntry.totalClaims} claims</Text>
          </View>
        ) : myAddr && !myEntry ? (
          <View style={s.myRankBar}>
            <Text style={s.myRankText}>Claim drops to appear on the board</Text>
          </View>
        ) : null
      }
    />
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  content: { paddingTop: 60, paddingHorizontal: 16, paddingBottom: 40 },
  pageTitle: { color: C.t1, fontSize: 34, fontWeight: '800', letterSpacing: -0.5, marginBottom: 4 },
  pageSub: { color: C.t3, fontSize: 14, marginBottom: 24 },
  podiumRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  section: { color: C.t3, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 },
  empty: { alignItems: 'center', paddingVertical: 80 },
  emptyEmoji: { fontSize: 48, marginBottom: 16, color: C.t3 },
  emptyText: { color: C.t2, fontSize: 16, fontWeight: '600' },
  myRankBar: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16, backgroundColor: C.s1, borderRadius: R.md, padding: 14, borderWidth: 1, borderColor: C.accent },
  myRankText: { color: C.accent, fontSize: 14, fontWeight: '700', flex: 1 },
  errorText: { color: C.red, fontSize: 16, fontWeight: '600', marginBottom: 16 },
  retryBtn: { backgroundColor: C.s1, borderRadius: R.md, paddingHorizontal: 28, paddingVertical: 12 },
  retryText: { color: C.t1, fontSize: 15, fontWeight: '700' },
});
