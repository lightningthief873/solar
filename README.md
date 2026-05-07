# SolAR — GPS-Anchored AR NFT Drops on Solana

> Walk the world. Collect NFTs. Own your proof-of-presence on-chain.

SolAR is a mobile augmented reality app that places glowing NFT objects at real-world GPS coordinates. Walk close enough to a drop, tap the floating orb through your camera, and a compressed NFT mints to your Solana wallet — signed entirely through Mobile Wallet Adapter. No custodial keys. No web browser. Fully on-chain.

---

## What Makes This Different

Most NFT apps are galleries. SolAR is a game layer on top of the physical world.

| Feature | What it does |
|---------|-------------|
| **GPS → AR Bridge** | Haversine math converts real-world coordinates to 3D AR space. Drops appear exactly where they are planted — not just "nearby." |
| **Radar HUD** | A compass ring overlay shows direction and distance to every drop within 200m — including drops behind you that the camera can't see. |
| **Rarity Particle Effects** | Each tier has a distinct AR visual: Common orbits 3 blue satellites, Rare spins 6 purple sparkles, Legendary cascades 8 gold spheres, Mythic runs two counter-rotating rings. |
| **Dual Mode** | **Tourism** drops are permanent heritage markers. **Event** drops expire in 6–48 hours — for conferences, festivals, pop-ups. |
| **Image NFTs** | Creators attach a real photo from their camera roll when planting. Claimed NFTs display the original image in the Inventory and Claim Sheet. |
| **NFT Art Styles** | Six gradient art styles (Cosmic, Neon, Gold, Storm, Phoenix, Classic) for drops without a custom image. |
| **Creator Escrow** | Creators stake SOL when planting paid drops. Lamports transfer to the creator on claim, or return on expiry. No middleman. |
| **On-Chain Leaderboard** | A global `LeaderboardState` PDA tracks top collectors by claim count and streak. Auto-refreshes every 30 seconds. |
| **Compressed NFTs** | Claims mint via Metaplex Bubblegum (cNFTs). Cost per mint is near 0 SOL vs ~0.012 SOL for standard Metaplex. |
| **Avatar System** | Every wallet deterministically generates a unique emoji + colour avatar based on address hash. Set a display name in Profile. |
| **Collection Sets** | Three cross-rarity sets with progress bars: City Explorer, Rare Hunter, Legend Chaser. |
| **Deep Links** | Share a claimed drop as `solar://drop?id=X&lat=Y&lng=Z`. |
| **Proximity Haptic** | Phone vibrates the moment you enter a drop's claim radius. The AR sphere turns green and emits a shockwave ring. |

---

## App Screens

### Explore (AR View)
Full-screen camera with AR drops floating at their GPS positions. Wallet pill top-left. Radar HUD top-right. Nearby count badge. Map button opens a full-screen interactive OSM map with drop markers and popups. Tap any sphere to open the Apple-style claim sheet with NFT art banner.

### Plant
Two-step flow. Step 1: tap the TileMap overlay to pin your current GPS location. Step 2: configure name, rarity, mode, expiry, pick a photo from gallery (or choose an art style), and add a heritage description. The planted drop appears in AR immediately on returning to Explore.

### Inventory
Grid of owned NFTs. Real photo art when the drop had an image; gradient art style otherwise. Staggered spring fade-in. Collection set progress bars above the grid.

### Leaderboard
Emoji avatar + display name for each entry. Gold/silver/bronze gradient podium for top 3. Slide-in list for ranks 4–10. Your wallet highlighted. Auto-refreshes every 30 seconds.

### Profile
Emoji avatar (unique per wallet address). Tap to set display name (persists in-session). SOL balance. Stats grid. Connect / disconnect wallet. Testnet faucet link.

---

## Rarity Tiers

| Tier | Colour | AR Effect | Claim Radius |
|------|--------|-----------|-------------|
| Common | Blue `#4A90E2` | 3 satellites slow-orbit (4s) | 15m |
| Rare | Purple `#9B59B6` | 6 satellites fast-orbit (1.5s) | 10m |
| Legendary | Gold `#F39C12` | 8 satellites tilted vertical orbit | 7m |
| Mythic | Pink `#FF69B4` | Inner CW ring + outer CCW ring | 5m |

---

## Architecture

```
┌─────────────────────────────────────────────┐
│  React Native 0.85.3 (bare, TypeScript)     │
│                                             │
│  ┌──────────────┐  ┌─────────────────────┐  │
│  │  AR Layer    │  │  UI Layer           │  │
│  │  ViroReact   │  │  React Navigation   │  │
│  │  DropSphere  │  │  Bottom Sheets      │  │
│  │  ARScene     │  │  Linear Gradient    │  │
│  └──────┬───────┘  └────────┬────────────┘  │
│         │                   │               │
│  ┌──────▼───────────────────▼────────────┐  │
│  │  Data / Solana Layer                  │  │
│  │  WalletContext (MWA + demo fallback)  │  │
│  │  rpc.ts (PDAs, leaderboard, NFT store)│  │
│  │  mintCNFT.ts (Bubblegum UMI)          │  │
│  └──────────────────┬───────────────────┘  │
└─────────────────────┼───────────────────────┘
                       │ JSON-RPC
              ┌────────▼────────┐
              │  Solana Testnet │
              │  solar_program  │
              │  (Anchor 1.0.2) │
              └─────────────────┘
```

### On-Chain Program (Anchor)

**Program ID:** `EXNrAhbDZgXchu6D8i1Gup47qgKkMkTuC6FR6ehZqkQ7`  
**Network:** Solana Testnet

| Account | Seeds | Stores |
|---------|-------|--------|
| `DropState` | `["drop", creator_pubkey, drop_id]` | GPS coords, rarity, price, expiry, claimed flag |
| `CollectorState` | `["collector", wallet_pubkey]` | Total claims, streak count |
| `LeaderboardState` | `["leaderboard"]` | Top 10 entries (global singleton) |

### Key Tech Stack

| Concern | Library |
|---------|---------|
| AR rendering | `@reactvision/react-viro` 2.54.0 (ARCore) |
| Wallet signing | `@solana-mobile/mobile-wallet-adapter-protocol` |
| NFT minting | `@metaplex-foundation/mpl-bubblegum` + UMI |
| On-chain program | `@coral-xyz/anchor` + Rust |
| Navigation | `@react-navigation/bottom-tabs` v7 |
| Maps (Explore) | `react-native-webview` + Leaflet.js + OSM tiles (self-contained, no API key) |
| Maps (Plant) | Custom `TileMap` component — OSM tiles via RN `Image`, no SDK |
| GPS | `react-native-geolocation-service` |
| Compass | `react-native-sensors` (magnetometer, EMA α=0.15) |
| Image picker | `react-native-image-picker` (gallery access for NFT art) |
| Animations | `react-native-reanimated` + `Animated` API |
| Haptics | `react-native-haptic-feedback` |
| Gradients | `react-native-linear-gradient` |

---

## Installing on Android

### Minimum Requirements

| Requirement | Minimum |
|-------------|---------|
| Android version | 8.0 (API 26) |
| ARCore | Supported (check [Google's device list](https://developers.google.com/ar/devices)) |
| Architecture | arm64-v8a (any 64-bit Android from 2018+) |
| RAM | 3 GB |
| Storage | ~90 MB |

### Step 1 — Download the APK

Grab `app-arm64-v8a-release.apk` from the [GitHub Releases page](https://github.com/lightningthief873/solar/releases/latest).

### Step 2 — Install a Solana Wallet

Install **Phantom** from the Play Store. Switch to **Testnet**:  
Phantom → Settings → Developer Settings → Testnet.

### Step 3 — Install via ADB

```bash
adb install -r app-arm64-v8a-release.apk
```

Or transfer the APK to your phone and tap to install (allow unknown sources).

### Step 4 — Grant Permissions

On first launch: allow **Camera** and **Precise Location**.

### Step 5 — Connect Wallet & Get Test SOL

1. Profile tab → **Connect Wallet** → approve in Phantom
2. Profile → **Get Test SOL from Faucet ↗** → opens faucet.solana.com with your address pre-filled

### Step 6 — Mock GPS (if not in Pune)

Demo drops are seeded at **18.5204°N, 73.8567°E** (Pune, India). Use [Fake GPS Location](https://play.google.com/store/apps/details?id=com.lexa.fakegps) to simulate that position.

### Step 7 — Explore & Claim

1. Explore tab → point camera outward — glowing orbs appear
2. Radar HUD shows all drops within 200m
3. Get within claim radius → haptic + sphere turns green
4. Tap sphere → **Claim Drop** → approve in Phantom → NFT minted
5. Check Inventory tab for your claimed NFT

### Step 8 — Plant a Drop

1. Plant tab → see your location on the map
2. Tap the map to place your pin at your GPS location
3. **Configure Drop →** → set name, rarity, mode, art style or gallery photo
4. **Plant Drop** → appears in AR on Explore immediately

---

## Building from Source

### Prerequisites

- Node 20 (`nvm use 20`)
- JDK 17
- Android NDK 27.1.12297006
- Rust + Anchor CLI 1.0.2 (for on-chain program only)

### Install & Build

```bash
npm install --legacy-peer-deps

# Bundle JS
npx react-native bundle \
  --platform android --dev false \
  --entry-file index.js \
  --bundle-output android/app/src/main/assets/index.android.bundle \
  --assets-dest android/app/src/main/res

# Build APK
cd android && ./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a

# Output:
# android/app/build/outputs/apk/release/app-arm64-v8a-release.apk
```

---

## Project Structure

```
solar/
├── src/
│   ├── ar/
│   │   ├── ARScene.tsx          — ViroAR scene, materials, animations
│   │   └── DropSphere.tsx       — Per-drop AR node: orbit rings, shockwave
│   ├── components/
│   │   ├── RadarRing.tsx        — Compass HUD overlay
│   │   ├── TileMap.tsx          — OSM tile map (pure RN Image, no SDK)
│   │   └── LeafletMap.tsx       — Self-contained WebView Leaflet map (Explore)
│   ├── contexts/
│   │   └── WalletContext.tsx    — MWA state + demo fallback, claim/plant flows
│   ├── hooks/
│   │   ├── useGPS.ts            — Geolocation (500ms throttle)
│   │   └── useCompass.ts        — Magnetometer with EMA smoothing
│   ├── navigation/
│   │   └── AppNavigator.tsx     — 5-tab bottom nav
│   ├── screens/
│   │   ├── ExploreScreen.tsx    — AR + HUD + LeafletMap modal + claim
│   │   ├── ClaimSheet.tsx       — Bottom sheet: NFT art banner + claim
│   │   ├── PlantScreen.tsx      — 2-step plant: TileMap + form + image picker
│   │   ├── InventoryScreen.tsx  — NFT grid (real photo or art style)
│   │   ├── LeaderboardScreen.tsx— Podium + avatar rows
│   │   └── ProfileScreen.tsx    — Avatar + display name + wallet + stats
│   ├── solana/
│   │   ├── rpc.ts               — Connection, PDAs, NFT store, leaderboard
│   │   ├── useMWA.ts            — MWA signing + demo keypair fallback
│   │   ├── mintCNFT.ts          — Bubblegum cNFT minting via UMI
│   │   └── idl/solar_program.json
│   ├── types/index.ts           — Drop, OwnedNFT, ArtStyle, LeaderboardEntry
│   └── utils/
│       ├── haversine.ts         — GPS distance + AR [x,y,z] position math
│       ├── constants.ts         — RARITY_CONFIG, COLLECTION_SETS, PROGRAM_ID
│       ├── seedDrops.ts         — 5 demo drops at Pune base coordinate
│       ├── artStyles.ts         — 6 NFT art style definitions
│       ├── avatar.ts            — Wallet address → emoji + colour avatar
│       ├── design.ts            — Apple dark design tokens (colours, radii)
│       └── deepLink.ts          — solar:// pub-sub dispatcher
└── anchor/
    └── programs/solar_program/src/
        ├── lib.rs               — 4 instruction dispatchers
        ├── state.rs             — DropState, CollectorState, LeaderboardState
        ├── error.rs             — SolARError enum
        ├── constants.rs         — Claim radii in e7 fixed-point
        └── instructions/        — plant_drop, claim_drop, expire_drop, record_streak
```

---

## Known Limitations

| Limitation | Status |
|------------|--------|
| Merkle tree not pre-created | cNFT minting needs one-time `createTree()` run |
| Testnet only | Fund wallet and redeploy to Devnet for wider testing |
| NFT metadata uses placeholder URI | Wire Irys/Arweave uploader in `mintCNFT.ts` |
| OwnedNFT store is in-memory | Lost on app restart — needs AsyncStorage or chain indexer |
| iOS not supported | Requires macOS + Xcode + ARKit |
| Demo drops centred on Pune, India | Use Fake GPS when testing elsewhere |

---

## License

MIT — build on it, fork it, ship it.
