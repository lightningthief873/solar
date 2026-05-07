# Build Progress

## Overall Status: v2.0 COMPLETE ✓ — APK BUILT & INSTALLED

---

## v1.0 — Foundation through Release APK ✓ DONE

All phases 1–5 completed: AR engine, Anchor program, all screens, polish.
See git log for full history. Program ID: `EXNrAhbDZgXchu6D8i1Gup47qgKkMkTuC6FR6ehZqkQ7` on Testnet.

---

## v2.0 — UI Redesign + Maps + Image NFTs ✓ DONE (2026-05-07)

### Apple-level UI redesign
- [x] Design token file: `src/utils/design.ts` — true black bg, Apple surface greys, accent blue #0A84FF, green #30D158, orange #FF9F0A
- [x] ProfileScreen: emoji avatar + display name (editable in-session), SOL balance card, stats grid, faucet link
- [x] LeaderboardScreen: emoji avatar on every row + podium card, gradient medals, "Claim drops to appear" empty state
- [x] InventoryScreen: real photo art when available, art style gradient fallback, Apple-style section headers
- [x] ClaimSheet: 200px NFT art banner (real photo or gradient), hairline separators, solid claim CTA button
- [x] PlantScreen: Apple segmented controls, art style horizontal scroll picker, image picker button, preview card

### Maps
- [x] Google Maps API key wired into AndroidManifest.xml (`AIzaSyB7AfZOeeA8_-rzBgliRXbmiyNiZMUSxGc`)
- [x] Explore "View Map" modal: `LeafletMap` — self-contained WebView with all JS/HTML inline, OSM tiles via `<img>`, zero CDN deps
- [x] LeafletMap features: pan (touch drag), zoom +/-, drop markers with emoji + colour label, popups with "Select Drop" button, user dot
- [x] Plant Step 1: `TileMap` (pure RN Image tiles) + transparent overlay TouchableOpacity → places pin at current GPS. Proven reliable approach.

### Image NFTs
- [x] `react-native-image-picker` installed (npm --legacy-peer-deps)
- [x] READ_MEDIA_IMAGES + READ_EXTERNAL_STORAGE permissions in AndroidManifest
- [x] Plant form: "Choose from Gallery" button → native Android photo picker → stores URI
- [x] Art style picker hidden when real image selected
- [x] Drop carries `imageUri` field through plant → explore → claim → inventory
- [x] ClaimSheet: shows real photo as full-width banner if `drop.imageUri` set
- [x] InventoryScreen: shows real photo in NFT card art area if `nft.imageUri` set

### Avatar system
- [x] `src/utils/avatar.ts`: `walletAvatar(addr)` → deterministic emoji + hex colour from address hash
- [x] `getUsername()` / `setUsername()` — in-memory display name storage
- [x] ProfileScreen: avatar ring, tappable display name with inline TextInput editor
- [x] LeaderboardScreen: `Avatar` component on every podium card + list row

### Art styles
- [x] `src/utils/artStyles.ts`: 6 styles — Classic, Cosmic, Neon, Gold, Storm, Phoenix
- [x] Each has: label, emoji, gradient colors[], description
- [x] Used in PlantScreen picker, ClaimSheet banner, InventoryScreen art panel

### Types updated
- [x] `Drop`: added `artStyle?: ArtStyle`, `imageUri?: string`
- [x] `OwnedNFT`: added `artStyle?: ArtStyle` (already had `imageUri`)
- [x] `LeaderboardEntry`: added `username?: string`
- [x] `ArtStyle` type exported from types/index.ts

### Build facts (v2.0)
- npm install --legacy-peer-deps (peer dep conflicts with react 19)
- react-native-webview + react-native-image-picker added (autolinking)
- Build: tmux session, Node 20, -PreactNativeArchitectures=arm64-v8a
- TypeScript strict: 0 errors on final build
- APK: `android/app/build/outputs/apk/release/app-arm64-v8a-release.apk`

---

## Current Focus

v2.0 complete. Committing to git. Ready for GitHub Release v2.0.

## Last Session

2026-05-07: Completed v2.0. Apple UI across all screens, Leaflet WebView map (Explore),
TileMap overlay (Plant), image NFTs from gallery, avatar system, art styles.
tsc clean. APK built and installed on device.
