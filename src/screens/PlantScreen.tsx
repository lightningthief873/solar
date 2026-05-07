import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { TileMap } from '../components/TileMap';
import LinearGradient from 'react-native-linear-gradient';
import HapticFeedback from 'react-native-haptic-feedback';
import { launchImageLibrary } from 'react-native-image-picker';
import type { Asset } from 'react-native-image-picker';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useGPS } from '../hooks/useGPS';
import { useWallet } from '../contexts/WalletContext';
import { addPlantedDrop } from '../solana/rpc';
import { RARITY_CONFIG } from '../utils/constants';
import { C, R } from '../utils/design';
import { ART_STYLES } from '../utils/artStyles';
import type { Rarity, DropMode, ArtStyle } from '../types';
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
  const [artStyle, setArtStyle] = useState<ArtStyle>('default');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [priceSOL] = useState(0);
  const [expiryIdx, setExpiryIdx] = useState(2);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');

  const mapLat = gps.lat ?? 18.5204;
  const mapLng = gps.lng ?? 73.8567;

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

  const placePin = useCallback(() => {
    HapticFeedback.trigger('impactMedium');
    setPin({ lat: mapLat, lng: mapLng });
  }, [mapLat, mapLng]);

  const pickImage = useCallback(() => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, (response) => {
      if (response.assets && response.assets[0]) {
        const asset: Asset = response.assets[0];
        if (asset.uri) setImageUri(asset.uri);
      }
    });
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
      addPlantedDrop({
        id: `drop-planted-${dropId}`,
        lat: pin.lat, lng: pin.lng,
        name: name.trim(),
        rarity, priceSOL,
        expiresAt: mode === 'event' ? Date.now() + EXPIRY_OPTIONS[expiryIdx].ms : null,
        mode,
        claimRadius: mode === 'event' ? 10 : 15,
        isClaimed: false,
        description,
        artStyle,
        imageUri: imageUri ?? undefined,
      });
      showToast('Drop planted!');
      setTimeout(() => nav.navigate('Explore'), 1200);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Plant failed — try again');
    } finally {
      setLoading(false);
    }
  };

  const cfg = RARITY_CONFIG[rarity];
  const artDef = ART_STYLES[artStyle];

  return (
    <View style={s.root}>
      <Animated.View style={[s.slides, { transform: [{ translateX: slideAnim }] }]}>

        {/* ─── Step 1: Map ─────────────────────────────────── */}
        <View style={s.slide}>
          <View style={s.header}>
            <Text style={s.pageTitle}>Plant a Drop</Text>
            <Text style={s.pageSub}>Tap "Place Here" to drop at your current location</Text>
          </View>

          <View style={s.mapContainer}>
            <TileMap
              drops={pin ? [{ id: 'pin', lat: pin.lat, lng: pin.lng, name: 'Drop Here', rarity, priceSOL: 0, expiresAt: null, mode: 'tourism', claimRadius: 15, isClaimed: false }] : []}
              userLat={mapLat}
              userLng={mapLng}
              height={380}
              onDropSelect={() => {}}
            />
            {/* Full-area tap target places pin at current GPS */}
            <TouchableOpacity
              style={s.mapOverlay}
              onPress={placePin}
              activeOpacity={0.7}
            >
              {!pin && (
                <View style={s.tapHint}>
                  <Text style={s.tapHintText}>Tap to place drop at your location</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {pin && (
            <View style={s.pinConfirm}>
              <Text style={s.pinConfirmText}>
                📍 {pin.lat.toFixed(5)}°N, {pin.lng.toFixed(5)}°E
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[s.primaryBtn, !pin && s.primaryBtnDisabled]}
            onPress={goStep2}
            disabled={!pin}
          >
            <Text style={[s.primaryBtnText, !pin && s.primaryBtnTextDisabled]}>
              {pin ? 'Configure Drop →' : 'Tap map to place pin'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ─── Step 2: Config form ─────────────────────────── */}
        <View style={s.slide}>
          <ScrollView contentContainerStyle={s.form} keyboardShouldPersistTaps="handled">
            <Text style={s.pageTitle}>Configure</Text>

            {error !== '' && (
              <View style={s.errorBox}>
                <Text style={s.errorText}>{error}</Text>
                <TouchableOpacity onPress={() => setError('')}><Text style={s.errorDismiss}>✕</Text></TouchableOpacity>
              </View>
            )}

            {/* Name */}
            <Text style={s.fieldLabel}>Name</Text>
            <TextInput
              style={s.input}
              placeholder="Drop name"
              placeholderTextColor={C.t3}
              maxLength={32}
              value={name}
              onChangeText={setName}
            />

            {/* Mode toggle */}
            <Text style={s.fieldLabel}>Mode</Text>
            <View style={s.segmented}>
              {(['tourism', 'event'] as DropMode[]).map(m => (
                <TouchableOpacity
                  key={m}
                  style={[s.segment, mode === m && s.segmentActive]}
                  onPress={() => setMode(m)}
                >
                  <Text style={[s.segmentText, mode === m && s.segmentTextActive]}>
                    {m === 'tourism' ? '🏛 Tourism' : '⚡ Event'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Rarity */}
            <Text style={s.fieldLabel}>Rarity</Text>
            <View style={s.rarityRow}>
              {RARITIES.map(r => {
                const rc = RARITY_CONFIG[r];
                const active = rarity === r;
                return (
                  <TouchableOpacity
                    key={r}
                    style={[s.rarityCard, { borderColor: active ? rc.color : C.s3 }, active && { backgroundColor: rc.color + '18' }]}
                    onPress={() => setRarity(r)}
                  >
                    <Text style={[s.rarityLetter, { color: rc.color }]}>{r[0].toUpperCase()}</Text>
                    <Text style={[s.rarityName, active && { color: rc.color }]}>{r}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* NFT Image */}
            <Text style={s.fieldLabel}>NFT Image</Text>
            <TouchableOpacity style={s.imgPicker} onPress={pickImage} activeOpacity={0.8}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={s.imgPreview} resizeMode="cover" />
              ) : (
                <View style={s.imgPickerEmpty}>
                  <Text style={s.imgPickerIcon}>🖼</Text>
                  <Text style={s.imgPickerText}>Choose from Gallery</Text>
                  <Text style={s.imgPickerSub}>Photo becomes the NFT art</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Art style (used when no custom image) */}
            {!imageUri && (
              <>
                <Text style={s.fieldLabel}>Or choose art style</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.artScroll}>
                  {(Object.entries(ART_STYLES) as [ArtStyle, typeof ART_STYLES[ArtStyle]][]).map(([key, art]) => (
                    <TouchableOpacity
                      key={key}
                      style={[s.artCard, artStyle === key && s.artCardActive]}
                      onPress={() => setArtStyle(key)}
                    >
                      <LinearGradient colors={art.colors.length >= 2 ? art.colors : ['#111', '#222']} style={s.artGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                        <Text style={s.artEmoji}>{art.emoji}</Text>
                      </LinearGradient>
                      <Text style={[s.artLabel, artStyle === key && s.artLabelActive]}>{art.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            {/* Event expiry */}
            {mode === 'event' && (
              <>
                <Text style={s.fieldLabel}>Expiry</Text>
                <View style={s.segmented}>
                  {EXPIRY_OPTIONS.map((o, i) => (
                    <TouchableOpacity
                      key={o.label}
                      style={[s.segment, expiryIdx === i && s.segmentActive]}
                      onPress={() => setExpiryIdx(i)}
                    >
                      <Text style={[s.segmentText, expiryIdx === i && s.segmentTextActive]}>{o.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {/* Heritage description */}
            {mode === 'tourism' && (
              <>
                <Text style={s.fieldLabel}>Description (optional)</Text>
                <TextInput
                  style={[s.input, s.inputMulti]}
                  placeholder="Tell the story of this place…"
                  placeholderTextColor={C.t3}
                  maxLength={140}
                  multiline
                  value={description}
                  onChangeText={setDescription}
                />
              </>
            )}

            {/* Preview card */}
            <Text style={s.fieldLabel}>Preview</Text>
            <View style={[s.previewCard, { borderColor: cfg.color + '60' }]}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={s.previewImage} resizeMode="cover" />
              ) : (
                <LinearGradient colors={artDef.colors.length >= 2 ? artDef.colors : ['#111', '#222']} style={s.previewArtBand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <Text style={s.previewEmoji}>{artDef.emoji}</Text>
                </LinearGradient>
              )}
              <View style={s.previewInfo}>
                <Text style={[s.previewName, { color: cfg.color }]}>{name || 'Unnamed Drop'}</Text>
                <Text style={s.previewMeta}>{rarity.toUpperCase()} · {mode}</Text>
              </View>
            </View>

            {/* Plant button */}
            <TouchableOpacity
              style={[s.plantBtn, (!name.trim() || !wallet.publicKey) && s.plantBtnDisabled]}
              onPress={handlePlant}
              disabled={!name.trim() || !wallet.publicKey || loading}
            >
              {loading
                ? <ActivityIndicator color="#000" />
                : <Text style={s.plantBtnText}>Plant Drop</Text>}
            </TouchableOpacity>

            {!wallet.publicKey && (
              <Text style={s.connectHint}>Connect wallet in Profile tab first</Text>
            )}

            <TouchableOpacity onPress={goStep1} style={s.backBtn}>
              <Text style={s.backText}>← Change location</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Animated.View>

      {toast !== '' && (
        <View style={s.toast}><Text style={s.toastText}>{toast}</Text></View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg, overflow: 'hidden' },
  slides: { flex: 1, flexDirection: 'row', width: SCREEN_W * 2 },
  slide: { width: SCREEN_W, flex: 1 },
  header: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 12 },
  pageTitle: { color: C.t1, fontSize: 34, fontWeight: '800', letterSpacing: -0.5 },
  pageSub: { color: C.t3, fontSize: 14, marginTop: 4 },
  mapContainer: { position: 'relative' },
  mapOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 20 },
  tapHint: { backgroundColor: 'rgba(10,132,255,0.18)', borderRadius: R.md, paddingHorizontal: 18, paddingVertical: 10, borderWidth: 1, borderColor: C.accent },
  tapHintText: { color: C.accent, fontSize: 14, fontWeight: '700' },
  pinConfirm: { backgroundColor: 'rgba(48,209,88,0.1)', borderRadius: R.md, marginHorizontal: 16, marginTop: 8, paddingVertical: 10, paddingHorizontal: 14, borderWidth: 1, borderColor: C.green },
  pinConfirmText: { color: C.green, fontSize: 13, fontWeight: '600', textAlign: 'center' },
  primaryBtn: { margin: 16, backgroundColor: C.accent, borderRadius: R.lg, paddingVertical: 17, alignItems: 'center' },
  primaryBtnDisabled: { backgroundColor: C.s1 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  primaryBtnTextDisabled: { color: C.t3 },
  form: { padding: 20, paddingTop: 56, paddingBottom: 48 },
  errorBox: { backgroundColor: 'rgba(255,69,58,0.12)', borderRadius: R.md, borderWidth: 1, borderColor: C.red, padding: 12, marginBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  errorText: { color: C.red, fontSize: 13, flex: 1 },
  errorDismiss: { color: C.red, fontSize: 16, marginLeft: 8 },
  fieldLabel: { color: C.t3, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, marginTop: 20 },
  input: { backgroundColor: C.s1, borderRadius: R.md, color: C.t1, padding: 14, fontSize: 15 },
  inputMulti: { height: 80, textAlignVertical: 'top' },
  segmented: { flexDirection: 'row', backgroundColor: C.s1, borderRadius: R.md, padding: 3, gap: 3 },
  segment: { flex: 1, paddingVertical: 9, borderRadius: R.sm, alignItems: 'center' },
  segmentActive: { backgroundColor: C.s3 },
  segmentText: { color: C.t3, fontSize: 14, fontWeight: '600' },
  segmentTextActive: { color: C.t1 },
  rarityRow: { flexDirection: 'row', gap: 8 },
  rarityCard: { flex: 1, borderWidth: 2, borderRadius: R.md, alignItems: 'center', paddingVertical: 12, backgroundColor: C.s1 },
  rarityLetter: { fontSize: 22, fontWeight: '900' },
  rarityName: { color: C.t3, fontSize: 10, marginTop: 2, textTransform: 'capitalize' },
  artScroll: { marginHorizontal: -20, paddingLeft: 20 },
  artCard: { marginRight: 10, alignItems: 'center', borderWidth: 2, borderColor: 'transparent', borderRadius: R.md, padding: 4 },
  artCardActive: { borderColor: C.accent },
  artGrad: { width: 64, height: 64, borderRadius: R.md, alignItems: 'center', justifyContent: 'center' },
  artEmoji: { fontSize: 30 },
  artLabel: { color: C.t3, fontSize: 11, marginTop: 6, fontWeight: '600' },
  artLabelActive: { color: C.accent },
  imgPicker: { backgroundColor: C.s1, borderRadius: R.lg, height: 120, overflow: 'hidden' },
  imgPreview: { width: '100%', height: '100%' },
  imgPickerEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  imgPickerIcon: { fontSize: 32 },
  imgPickerText: { color: C.t1, fontSize: 15, fontWeight: '700' },
  imgPickerSub: { color: C.t3, fontSize: 12 },
  previewCard: { borderRadius: R.lg, borderWidth: 1, overflow: 'hidden', marginTop: 4 },
  previewArtBand: { height: 80, alignItems: 'center', justifyContent: 'center' },
  previewImage: { width: '100%', height: 100 },
  previewEmoji: { fontSize: 36 },
  previewInfo: { padding: 12 },
  previewName: { fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
  previewMeta: { color: C.t3, fontSize: 12, marginTop: 4 },
  plantBtn: { backgroundColor: C.green, borderRadius: R.lg, paddingVertical: 17, alignItems: 'center', marginTop: 24 },
  plantBtnDisabled: { backgroundColor: C.s2 },
  plantBtnText: { color: '#000', fontSize: 17, fontWeight: '800' },
  connectHint: { color: C.t3, textAlign: 'center', marginTop: 10, fontSize: 13 },
  backBtn: { marginTop: 20, alignItems: 'center' },
  backText: { color: C.t3, fontSize: 14 },
  toast: { position: 'absolute', bottom: 100, alignSelf: 'center', backgroundColor: C.s1, borderRadius: R.pill, paddingHorizontal: 20, paddingVertical: 10 },
  toastText: { color: C.t1, fontSize: 15, fontWeight: '700' },
});
