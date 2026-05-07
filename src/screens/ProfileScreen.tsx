import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Clipboard,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useWallet } from '../contexts/WalletContext';
import { getSOLBalance, getOwnedNFTs } from '../solana/rpc';
import { DEVNET_RPC } from '../utils/constants';

const IS_TESTNET = DEVNET_RPC.includes('testnet');

function truncate(addr: string) {
  return `${addr.slice(0, 8)}…${addr.slice(-6)}`;
}

function StatCell({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.statCell}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { wallet, connect, disconnect, stats, refreshStats } = useWallet();
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [toast, setToast] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const fetchBalance = useCallback(async () => {
    if (!wallet.publicKey) return;
    try {
      const bal = await getSOLBalance(wallet.publicKey);
      setSolBalance(bal);
    } catch {
      setSolBalance(null);
    }
  }, [wallet.publicKey]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshStats(), fetchBalance()]);
    setRefreshing(false);
  }, [refreshStats, fetchBalance]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  const openFaucet = () => {
    if (!wallet.publicKey) return;
    const addr = wallet.publicKey.toBase58();
    Linking.openURL(`https://faucet.solana.com/?address=${addr}`).catch(() =>
      Linking.openURL('https://faucet.solana.com'),
    );
  };

  const nfts = getOwnedNFTs();
  const dropsPlanted = 0; // future: fetch from chain
  const solEarned = nfts.reduce((s, n) => s, 0); // placeholder

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4A90E2" />}
    >
      <Text style={styles.title}>Profile</Text>

      {/* Wallet card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Wallet</Text>
        {wallet.publicKey ? (
          <>
            {wallet.isDemoMode && (
              <View style={styles.demoBadge}>
                <Text style={styles.demoText}>Demo Mode — no wallet app found</Text>
              </View>
            )}
            <TouchableOpacity
              onPress={() => {
                Clipboard.setString(wallet.publicKey!.toBase58());
                showToast('Address copied!');
              }}
              style={styles.addressRow}
            >
              <Text style={styles.address}>{truncate(wallet.publicKey.toBase58())}</Text>
              <Text style={styles.copyIcon}>⎘</Text>
            </TouchableOpacity>
            <Text style={styles.balance}>
              {wallet.isDemoMode ? 'Demo Wallet' : solBalance !== null ? `${solBalance.toFixed(4)} SOL` : '—'}
            </Text>
            <TouchableOpacity style={styles.disconnectBtn} onPress={disconnect}>
              <Text style={styles.disconnectText}>Disconnect</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={styles.connectBtn} onPress={connect}>
            {wallet.isConnecting ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.connectText}>Connect Wallet</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Stats */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Stats</Text>
        <View style={styles.statsGrid}>
          <StatCell label="Total Claims" value={stats?.totalClaims ?? 0} />
          <StatCell label="Current Streak" value={stats ? `${stats.streakCount}d 🔥` : '—'} />
          <StatCell label="Drops Planted" value={dropsPlanted} />
          <StatCell label="SOL Earned" value={`${solEarned.toFixed(2)} ◎`} />
        </View>
      </View>

      {/* Creator section placeholder */}
      {dropsPlanted > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Creator Earnings</Text>
          <Text style={styles.placeholder}>Drop analytics coming soon.</Text>
        </View>
      )}

      {/* Dev airdrop */}
      {IS_TESTNET && wallet.publicKey && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Developer Tools</Text>
          <Text style={styles.devNote}>Network: {IS_TESTNET ? 'Testnet' : 'Devnet'}</Text>
          <TouchableOpacity style={styles.airdropBtn} onPress={openFaucet}>
            <Text style={styles.airdropText}>Get Test SOL from Faucet ↗</Text>
          </TouchableOpacity>
          <Text style={styles.faucetNote}>Opens faucet.solana.com with your address pre-filled</Text>
        </View>
      )}

      {toast !== '' && (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0A0F' },
  content: { padding: 16, paddingTop: 56, paddingBottom: 40 },
  title: { color: '#FFF', fontSize: 26, fontWeight: '900', marginBottom: 20 },
  card: { backgroundColor: '#111118', borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#222' },
  cardTitle: { color: '#777', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 12 },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  address: { color: '#4A90E2', fontSize: 15, fontWeight: '600', flex: 1 },
  copyIcon: { color: '#4A90E2', fontSize: 18 },
  balance: { color: '#FFF', fontSize: 28, fontWeight: '900', marginTop: 8 },
  connectBtn: { backgroundColor: '#4A90E2', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  connectText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  demoBadge: { backgroundColor: '#FF980022', borderWidth: 1, borderColor: '#FF9800', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, marginBottom: 10 },
  demoText: { color: '#FF9800', fontSize: 12, fontWeight: '600' },
  disconnectBtn: { marginTop: 14, borderWidth: 1, borderColor: '#333', borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  disconnectText: { color: '#666', fontSize: 14 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCell: { width: '47%', backgroundColor: '#0D0D16', borderRadius: 12, padding: 14, alignItems: 'center' },
  statValue: { color: '#FFF', fontSize: 22, fontWeight: '900' },
  statLabel: { color: '#555', fontSize: 12, marginTop: 4 },
  placeholder: { color: '#444', fontSize: 14 },
  devNote: { color: '#555', fontSize: 13, marginBottom: 10 },
  airdropBtn: { backgroundColor: '#00FF88', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  airdropText: { color: '#000', fontSize: 14, fontWeight: '800' },
  faucetNote: { color: '#444', fontSize: 11, marginTop: 6, textAlign: 'center' },
  toast: { position: 'absolute', bottom: 20, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.85)', borderRadius: 20, paddingHorizontal: 20, paddingVertical: 10 },
  toastText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
});
