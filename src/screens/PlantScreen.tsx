import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker, LongPressEvent } from 'react-native-maps';
import HapticFeedback from 'react-native-haptic-feedback';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useGPS } from '../hooks/useGPS';
import { useWallet } from '../contexts/WalletContext';
import { RARITY_CONFIG } from '../utils/constants';
import type { Rarity, DropMode } from '../types';
import type { RootTabParamList } from '../navigation/AppNavigator';

const RARITIES: Rarity[] = ['common', 'rare', 'legendary', 'mythic'];
const EXPIRY_OPTIONS = [
  { label: '6h', ms: 6 * 3600000 }, { label: '12h', ms: 12 * 3600000 },
  { label: '24h', ms: 24 * 3600000 }, { label: '48h', ms: 48 * 3600000 },
];
const SCREEN_W = Dimensions.get('window').width;
type Nav = BottomTabNavigationProp<RootTabParamList, 'Plant'>;

export default function PlantScreen() {
  const gps = useGPS();
  const { wallet, plantDrop } = useWallet();
  const nav = useNavigation<Nav>();
  const slideAnim = useRef(new Animated.Value(0)).current;

  const [step, setStep] = useState<1 | 2>(1);
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);
  const [name, setName] = useState('');
  const [mode, setMode] = useState<DropMode>('tourism');
  const [rarity, setRarity] = useState<Rarity>('common');
  const [priceSOL, setPriceSOL] = useState(0);
  const [expiryIdx, setExpiryIdx] = useState(2);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const goStep2 = () => {
    if (!pin) return;
    setStep(2);
    Animated.spring(slideAnim, { toValue: -SCREEN_W, friction: 8, tension: 120, useNativeDriver: true }).start();
  };

  const goStep1 = () => {
    setStep(1);
    Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 120, useNativeDriver: true }).start();
  };

  const handleLongPress = useCallback((e: LongPressEvent) => {
    HapticFeedback.trigger('impactMedium');
    setPin({ lat: e.nativeEvent.coordinate.latitude, lng: e.nativeEvent.coordinate.longitude });
  }, []);

  const handlePlant = async () => {
    if (!pin || !wallet.publicKey || !name.trim()) return;
    HapticFeedback.trigger('notificationSuccess');
    setLoading(true);
    setError('');
    try {
      const dropId = BigInt(Date.now());
      const expiryTs = mode === 'event'
        ? BigInt(Math.floor((Date.now() + EXPIRY_OPTIONS[expiryIdx].ms) / 1000))
        : BigInt(0);
      await plantDrop({
        dropId, lat: pin.lat, lng: pin.lng,
        rarity: RARITIES.indexOf(rarity), mode: mode === 'tourism' ? 0 : 1,
        priceLamports: BigInt(Math.round(priceSOL * 1e9)), expiryTs,
      });
      showToast('Drop planted! 🌱');
      setTimeout(() => nav.navigate('Explore'), 1200);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Plant failed — try again');
    } finally {
      setLoading(false);
    }
  };

  const region = { latitude: gps.lat ?? 18.5204, longitude: gps.lng ?? 73.8567, latitudeDelta: 0.002, longitudeDelta: 0.002 };

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.slides, { transform: [{ translateX: slideAnim }] }]}>
        {/* Step 1: Map */}
        <View style={styles.slide}>
          <View style={styles.header}>
            <Text style={styles.title}>Plant a Drop</Text>
            <Text style={styles.sub}>Long-press on the map to place your drop</Text>
          </View>
          <MapView style={styles.map} region={region} onLongPress={handleLongPress}>
            {pin && <Marker coordinate={{ latitude: pin.lat, longitude: pin.lng }} title="Drop location" pinColor="#00BFFF" />}
          </MapView>
          <TouchableOpacity style={[styles.confirmBtn, !pin && styles.confirmBtnDisabled]} onPress={goStep2} disabled={!pin}>
            <Text style={styles.confirmBtnText}>Confirm Location →</Text>
          </TouchableOpacity>
        </View>

        {/* Step 2: Form */}
        <View style={styles.slide}>
          <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
            <Text style={styles.title}>Configure Drop</Text>

            {error !== '' && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{error}</Text>
                <TouchableOpacity onPress={() => setError('')}><Text style={styles.errorBannerDismiss}>✕</Text></TouchableOpacity>
              </View>
            )}

            <Text style={styles.fieldLabel}>Name</Text>
            <TextInput style={styles.input} placeholder="Drop name (max 32 chars)" placeholderTextColor="#555" maxLength={32} value={name} onChangeText={setName} />

            <Text style={styles.fieldLabel}>Mode</Text>
            <View style={styles.toggle}>
              {(['tourism', 'event'] as DropMode[]).map(m => (
                <TouchableOpacity key={m} style={[styles.toggleBtn, mode === m && styles.toggleBtnActive]} onPress={() => setMode(m)}>
                  <Text style={[styles.toggleText, mode === m && styles.toggleTextActive]}>{m === 'tourism' ? '🏛 Tourism' : '⚡ Event'}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Rarity</Text>
            <View style={styles.rarityRow}>
              {RARITIES.map(r => (
                <TouchableOpacity key={r} style={[styles.rarityCard, { borderColor: RARITY_CONFIG[r].color }, rarity === r && { backgroundColor: RARITY_CONFIG[r].color + '22' }]} onPress={() => setRarity(r)}>
                  <Text style={[styles.rarityCardText, { color: RARITY_CONFIG[r].color }]}>{r[0].toUpperCase()}</Text>
                  <Text style={styles.rarityCardLabel}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {mode === 'event' && (
              <>
                <Text style={styles.fieldLabel}>Expiry</Text>
                <View style={styles.toggle}>
                  {EXPIRY_OPTIONS.map((o, i) => (
                    <TouchableOpacity key={o.label} style={[styles.toggleBtn, expiryIdx === i && styles.toggleBtnActive]} onPress={() => setExpiryIdx(i)}>
                      <Text style={[styles.toggleText, expiryIdx === i && styles.toggleTextActive]}>{o.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {mode === 'tourism' && (
              <>
                <Text style={styles.fieldLabel}>Heritage description (optional)</Text>
                <TextInput style={[styles.input, styles.inputMulti]} placeholder="Tell the story of this place…" placeholderTextColor="#555" maxLength={140} multiline value={description} onChangeText={setDescription} />
              </>
            )}

            <Text style={styles.fieldLabel}>Preview</Text>
            <View style={[styles.preview, { borderColor: RARITY_CONFIG[rarity].color }]}>
              <Text style={[styles.previewName, { color: RARITY_CONFIG[rarity].color }]}>{name || 'Unnamed Drop'}</Text>
              <Text style={styles.previewSub}>{rarity.toUpperCase()} · {mode}</Text>
            </View>

            <TouchableOpacity style={[styles.plantBtn, (!name.trim() || !wallet.publicKey) && styles.plantBtnDisabled]} onPress={handlePlant} disabled={!name.trim() || !wallet.publicKey || loading}>
              {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.plantBtnText}>Plant Drop 🌱</Text>}
            </TouchableOpacity>

            {!wallet.publicKey && <Text style={styles.connectHint}>Connect wallet in Profile tab first</Text>}
            <TouchableOpacity onPress={goStep1} style={styles.backBtn}>
              <Text style={styles.backText}>← Change location</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Animated.View>

      {toast !== '' && <View style={styles.toast}><Text style={styles.toastText}>{toast}</Text></View>}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0A0F', overflow: 'hidden' },
  slides: { flex: 1, flexDirection: 'row', width: SCREEN_W * 2 },
  slide: { width: SCREEN_W, flex: 1 },
  header: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 12 },
  title: { color: '#FFF', fontSize: 24, fontWeight: '800' },
  sub: { color: '#666', fontSize: 14, marginTop: 4 },
  map: { flex: 1 },
  confirmBtn: { margin: 16, backgroundColor: '#00BFFF', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  confirmBtnDisabled: { backgroundColor: '#1A1A2E' },
  confirmBtnText: { color: '#000', fontSize: 16, fontWeight: '800' },
  form: { padding: 20, paddingTop: 56, paddingBottom: 40 },
  errorBanner: { backgroundColor: '#FF6B6B22', borderRadius: 10, borderWidth: 1, borderColor: '#FF6B6B', padding: 12, marginBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  errorBannerText: { color: '#FF6B6B', fontSize: 13, flex: 1 },
  errorBannerDismiss: { color: '#FF6B6B', fontSize: 16, marginLeft: 8 },
  fieldLabel: { color: '#777', fontSize: 13, fontWeight: '600', marginBottom: 8, marginTop: 16, textTransform: 'uppercase' },
  input: { backgroundColor: '#1A1A2E', borderRadius: 10, color: '#FFF', padding: 14, fontSize: 15, borderWidth: 1, borderColor: '#333' },
  inputMulti: { height: 80, textAlignVertical: 'top' },
  toggle: { flexDirection: 'row', gap: 8 },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#333', alignItems: 'center', backgroundColor: '#111' },
  toggleBtnActive: { borderColor: '#00BFFF', backgroundColor: 'rgba(0,191,255,0.1)' },
  toggleText: { color: '#555', fontSize: 14, fontWeight: '600' },
  toggleTextActive: { color: '#00BFFF' },
  rarityRow: { flexDirection: 'row', gap: 8 },
  rarityCard: { flex: 1, borderWidth: 2, borderRadius: 10, alignItems: 'center', paddingVertical: 12 },
  rarityCardText: { fontSize: 20, fontWeight: '900' },
  rarityCardLabel: { color: '#888', fontSize: 10, marginTop: 2 },
  preview: { borderWidth: 2, borderRadius: 14, padding: 16, marginTop: 4 },
  previewName: { fontSize: 18, fontWeight: '800' },
  previewSub: { color: '#888', fontSize: 12, marginTop: 4 },
  plantBtn: { backgroundColor: '#00FF88', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  plantBtnDisabled: { backgroundColor: '#1A1A2E' },
  plantBtnText: { color: '#000', fontSize: 16, fontWeight: '800' },
  connectHint: { color: '#555', textAlign: 'center', marginTop: 8, fontSize: 13 },
  backBtn: { marginTop: 16, alignItems: 'center' },
  backText: { color: '#555', fontSize: 14 },
  toast: { position: 'absolute', bottom: 100, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.85)', borderRadius: 20, paddingHorizontal: 20, paddingVertical: 10 },
  toastText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
});
