import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Clipboard,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useWallet } from '../contexts/WalletContext';
import { getSOLBalance, getOwnedNFTs } from '../solana/rpc';
import { DEVNET_RPC } from '../utils/constants';
import { walletAvatar, getUsername, setUsername } from '../utils/avatar';
import { C, R } from '../utils/design';

const IS_TESTNET = DEVNET_RPC.includes('testnet');

function truncate(addr: string) {
  return `${addr.slice(0, 8)}…${addr.slice(-6)}`;
}

export default function ProfileScreen() {
  const { wallet, connect, disconnect, stats, refreshStats } = useWallet();
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    const n = getUsername();
    setDisplayName(n);
    setNameInput(n);
  }, []);

  const fetchBalance = useCallback(async () => {
    if (!wallet.publicKey) return;
    try { setSolBalance(await getSOLBalance(wallet.publicKey)); }
    catch { setSolBalance(null); }
  }, [wallet.publicKey]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshStats(), fetchBalance()]);
    setRefreshing(false);
  }, [refreshStats, fetchBalance]);

  useEffect(() => { fetchBalance(); }, [fetchBalance]);

  const saveName = () => {
    setUsername(nameInput);
    setDisplayName(nameInput);
    setEditingName(false);
  };

  const openFaucet = () => {
    if (!wallet.publicKey) return;
    Linking.openURL(`https://faucet.solana.com/?address=${wallet.publicKey.toBase58()}`).catch(
      () => Linking.openURL('https://faucet.solana.com'),
    );
  };

  const nfts = getOwnedNFTs();
  const addr = wallet.publicKey?.toBase58() ?? '';
  const avatar = addr ? walletAvatar(addr) : null;

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />}
    >
      <Text style={s.pageTitle}>Profile</Text>

      {wallet.publicKey && avatar ? (
        <>
          {/* Avatar hero card */}
          <LinearGradient
            colors={[avatar.color + '33', C.s1]}
            style={s.heroCard}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          >
            <View style={[s.avatarRing, { borderColor: avatar.color }]}>
              <Text style={s.avatarEmoji}>{avatar.emoji}</Text>
            </View>

            {editingName ? (
              <View style={s.nameRow}>
                <TextInput
                  style={s.nameInput}
                  value={nameInput}
                  onChangeText={setNameInput}
                  placeholder="Your name…"
                  placeholderTextColor={C.t3}
                  maxLength={20}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={saveName}
                />
                <TouchableOpacity onPress={saveName} style={s.saveBtn}>
                  <Text style={s.saveBtnText}>Save</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={() => setEditingName(true)} style={s.nameRow}>
                <Text style={s.displayName}>{displayName || 'Set your name'}</Text>
                <Text style={s.editIcon}> ✎</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={() => { Clipboard.setString(addr); Alert.alert('Copied', 'Address copied to clipboard'); }}
              style={s.addrRow}
            >
              <Text style={[s.addrText, { color: avatar.color }]}>{truncate(addr)}</Text>
              <Text style={[s.addrCopy, { color: avatar.color }]}> ⎘</Text>
            </TouchableOpacity>

            {wallet.isDemoMode && (
              <View style={s.demoBadge}>
                <Text style={s.demoText}>Demo Mode</Text>
              </View>
            )}
          </LinearGradient>

          {/* Balance */}
          <View style={s.balanceCard}>
            <Text style={s.balanceLabel}>SOL Balance</Text>
            <Text style={s.balanceValue}>
              {wallet.isDemoMode ? '— Demo' : solBalance !== null ? `${solBalance.toFixed(4)} ◎` : '—'}
            </Text>
          </View>

          {/* Stats grid */}
          <View style={s.card}>
            <Text style={s.cardLabel}>Activity</Text>
            <View style={s.statsGrid}>
              {[
                { label: 'Claims', value: stats?.totalClaims ?? 0, color: C.green },
                { label: 'Streak', value: stats ? `${stats.streakCount}d 🔥` : '—', color: C.orange },
                { label: 'NFTs', value: nfts.length, color: C.accent },
                { label: 'SOL Spent', value: '0.00 ◎', color: C.t2 },
              ].map(({ label, value, color }) => (
                <View key={label} style={s.statCell}>
                  <Text style={[s.statValue, { color }]}>{value}</Text>
                  <Text style={s.statLabel}>{label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Disconnect */}
          <TouchableOpacity style={s.disconnectBtn} onPress={disconnect}>
            <Text style={s.disconnectText}>Disconnect Wallet</Text>
          </TouchableOpacity>

          {/* Dev tools */}
          {IS_TESTNET && (
            <View style={s.card}>
              <Text style={s.cardLabel}>Developer</Text>
              <Text style={s.devNetwork}>Solana Testnet</Text>
              <TouchableOpacity style={s.faucetBtn} onPress={openFaucet}>
                <Text style={s.faucetBtnText}>Get Test SOL from Faucet ↗</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      ) : (
        <View style={s.connectCard}>
          <Text style={s.connectTitle}>Connect your wallet</Text>
          <Text style={s.connectSub}>Link Phantom or use demo mode to explore the app.</Text>
          <TouchableOpacity style={s.connectBtn} onPress={connect} disabled={wallet.isConnecting}>
            {wallet.isConnecting
              ? <ActivityIndicator color="#000" />
              : <Text style={s.connectBtnText}>Connect Wallet</Text>}
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  content: { paddingTop: 60, paddingHorizontal: 16, paddingBottom: 48 },
  pageTitle: { color: C.t1, fontSize: 34, fontWeight: '800', marginBottom: 24, letterSpacing: -0.5 },
  heroCard: { borderRadius: R.xl, padding: 24, alignItems: 'center', marginBottom: 12 },
  avatarRing: { width: 88, height: 88, borderRadius: 44, borderWidth: 3, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  avatarEmoji: { fontSize: 44 },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  nameInput: { color: C.t1, fontSize: 20, fontWeight: '700', borderBottomWidth: 1, borderBottomColor: C.accent, paddingHorizontal: 8, paddingBottom: 4, minWidth: 140, textAlign: 'center' },
  saveBtn: { backgroundColor: C.accent, borderRadius: R.sm, paddingHorizontal: 14, paddingVertical: 7, marginLeft: 10 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  displayName: { color: C.t1, fontSize: 22, fontWeight: '700', letterSpacing: -0.3 },
  editIcon: { color: C.t3, fontSize: 16 },
  addrRow: { flexDirection: 'row', alignItems: 'center' },
  addrText: { fontSize: 14, fontWeight: '600' },
  addrCopy: { fontSize: 16 },
  demoBadge: { marginTop: 10, backgroundColor: 'rgba(255,159,10,0.2)', borderRadius: R.sm, paddingHorizontal: 12, paddingVertical: 4 },
  demoText: { color: C.orange, fontSize: 12, fontWeight: '700' },
  balanceCard: { backgroundColor: C.s1, borderRadius: R.lg, padding: 20, marginBottom: 12, alignItems: 'center' },
  balanceLabel: { color: C.t3, fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  balanceValue: { color: C.t1, fontSize: 40, fontWeight: '800', marginTop: 6, letterSpacing: -1 },
  card: { backgroundColor: C.s1, borderRadius: R.lg, padding: 16, marginBottom: 12 },
  cardLabel: { color: C.t3, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCell: { width: '47%', backgroundColor: C.s2, borderRadius: R.md, padding: 16 },
  statValue: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  statLabel: { color: C.t3, fontSize: 12, marginTop: 4 },
  disconnectBtn: { backgroundColor: C.s1, borderRadius: R.lg, paddingVertical: 16, alignItems: 'center', marginBottom: 12 },
  disconnectText: { color: C.red, fontSize: 16, fontWeight: '700' },
  devNetwork: { color: C.t3, fontSize: 13, marginBottom: 10 },
  faucetBtn: { backgroundColor: C.green, borderRadius: R.md, paddingVertical: 14, alignItems: 'center' },
  faucetBtnText: { color: '#000', fontSize: 14, fontWeight: '800' },
  connectCard: { backgroundColor: C.s1, borderRadius: R.xl, padding: 32, alignItems: 'center' },
  connectTitle: { color: C.t1, fontSize: 22, fontWeight: '800', marginBottom: 8 },
  connectSub: { color: C.t2, fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  connectBtn: { backgroundColor: C.accent, borderRadius: R.md, paddingVertical: 16, paddingHorizontal: 40 },
  connectBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
