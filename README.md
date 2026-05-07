# SolAR — GPS-Anchored AR NFT Drops on Solana

> Walk the world. Collect NFTs. Own your proof-of-presence on-chain.

SolAR is a mobile augmented reality app that places glowing NFT objects at real-world GPS coordinates. Walk close enough to a drop, tap the floating orb through your camera, and a compressed NFT mints to your Solana wallet — signed entirely through Mobile Wallet Adapter. No custodial keys. No web browser. Fully on-chain.

Built for **EasyA Miami — Solana Mobile Track**.

---

## What Makes This Different

Most NFT apps are galleries. SolAR is a game layer on top of the physical world.

| Feature | What it does |
|---------|-------------|
| **GPS → AR Bridge** | Haversine math converts real-world coordinates to 3D AR space. Drops appear exactly where they are planted — not just "nearby." |
| **Radar HUD** | A compass ring overlay shows direction and distance to every drop within 200m — including drops behind you that the camera can't see. |
| **Rarity Particle Effects** | Each tier has a distinct AR visual: Common orbits 3 blue satellites, Rare spins 6 purple sparkles, Legendary cascades a gold fountain, Mythic runs two counter-rotating rings. |
| **Dual Mode** | **Tourism** drops are permanent heritage markers (landmarks, monuments). **Event** drops expire in 6–48 hours — designed for conferences, festivals, pop-ups. |
| **Creator Escrow** | Creators stake SOL when planting paid drops. Lamports transfer to the creator on claim, or are returned on expiry. No middleman. |
| **On-Chain Leaderboard** | A global `LeaderboardState` PDA tracks the top 10 collectors by claim count and streak. Auto-refreshes every 30 seconds. |
| **Compressed NFTs** | Claims mint via Metaplex Bubblegum (cNFTs). Cost per mint is effectively 0 SOL vs. ~0.012 SOL for standard Metaplex. Scalable to millions of claims. |
| **Collection Sets** | Three cross-rarity sets with progress bars: City Explorer (5 commons), Rare Hunter (3 rares), Legend Chaser (1 legendary + 1 mythic). |
| **Deep Links** | Share a claimed drop as `solar://drop?id=X&lat=Y&lng=Z`. Opening the link centres the radar on that location. |
| **Proximity Haptic** | Phone vibrates (impactHeavy) the moment you enter a drop's claim radius. The AR sphere turns green and emits a shockwave ring. |

---

## App Screens

### Explore (AR View)
Full-screen camera with AR drops floating at their GPS positions. Wallet pill top-left. Radar HUD top-right. Nearby count badge bottom-right. Mini-map toggle bottom-left. Tap any sphere to open the claim sheet (60% bottom sheet, spring physics).

### Plant
Two-step flow. Step 1: long-press on a map to pin the exact coordinate. Step 2: configure name, rarity, mode (Tourism/Event), expiry, optional price, and a heritage description. Animated horizontal spring slide between steps.

### Inventory
Grid of owned NFTs with per-rarity gradient cards. Staggered spring fade-in on load. Collection set progress bars above the grid.

### Leaderboard
Gold/silver/bronze LinearGradient podium for top 3. Slide-in-from-right list for ranks 4–10. Your wallet highlighted. Your rank shown in a footer bar if outside top 10. Auto-refreshes every 30 seconds.

### Profile
Wallet connect/disconnect (Mobile Wallet Adapter). SOL balance. Stats grid (Total Claims, Streak, Drops Planted, SOL Earned). Developer airdrop button (testnet only).

---

## Rarity Tiers

| Tier | Colour | AR Effect | Claim Radius | Satellites |
|------|--------|-----------|-------------|------------|
| Common | Blue `#4A90E2` | 3 slow-orbiting blue spheres | 15m | 3 × orbitSlow (4s) |
| Rare | Purple `#9B59B6` | 6 fast-spinning purple sparkles | 10m | 6 × orbitFast (1.5s) |
| Legendary | Gold `#F39C12` | 8 gold spheres, vertically tilted fountain | 7m | 8 × orbitFast tilted |
| Mythic | Pink `#FF69B4` | Inner ring CW + outer ring CCW, double halo | 5m | 6 inner + 8 outer |

All tiers: main sphere turns green (`#00FF88`) + emits a cyan shockwave ring when you enter claim range.

---

## Architecture

```
┌─────────────────────────────────────────────┐
│  React Native (bare workflow, TypeScript)   │
│                                             │
│  ┌──────────────┐  ┌─────────────────────┐  │
│  │  AR Layer    │  │  UI Layer           │  │
│  │  ViroReact   │  │  React Navigation   │  │
│  │  DropSphere  │  │  Bottom Sheets      │  │
│  │  ARScene     │  │  Reanimated         │  │
│  └──────┬───────┘  └────────┬────────────┘  │
│         │                   │               │
│  ┌──────▼───────────────────▼────────────┐  │
│  │  Data / Solana Layer                  │  │
│  │  WalletContext (MWA)                  │  │
│  │  rpc.ts (PDA helpers, leaderboard)    │  │
│  │  mintCNFT.ts (Bubblegum UMI)          │  │
│  │  useMWA.ts (transact() signing)       │  │
│  └──────────────────┬───────────────────┘  │
└─────────────────────┼───────────────────────┘
                       │ JSON-RPC
              ┌────────▼────────┐
              │  Solana Testnet │
              │  solar_program  │
              │  (Anchor 1.0.2) │
              │                 │
              │  plant_drop     │
              │  claim_drop     │
              │  expire_drop    │
              │  record_streak  │
              └─────────────────┘
```

### On-Chain Program (Anchor)

**Program ID:** `EXNrAhbDZgXchu6D8i1Gup47qgKkMkTuC6FR6ehZqkQ7`  
**Network:** Solana Testnet  
**Language:** Rust, Anchor 1.0.2

**PDAs:**

| Account | Seeds | Stores |
|---------|-------|--------|
| `DropState` | `["drop", creator_pubkey, drop_id]` | GPS coords, rarity, price, expiry, claimed flag |
| `CollectorState` | `["collector", wallet_pubkey]` | Total claims, streak count, longest streak |
| `LeaderboardState` | `["leaderboard"]` | Top 10 entries (global singleton) |

**Instructions:**
- `plant_drop` — registers a drop PDA, escrows SOL if price > 0
- `claim_drop` — verifies proximity (e7 fixed-point bounding box), mints cNFT via Bubblegum CPI, releases escrow
- `expire_drop` — creator reclaims SOL from unclaimed expired drops
- `record_streak` — increments collector streak (must be called once per 24h window)

### GPS → AR Math

```
haversineDistance(lat1, lng1, lat2, lng2) → metres
gpsToARPosition(userLat, userLng, dropLat, dropLng, compassHeading) → [x, y, z]
```

Bearing is computed from user to drop. The compass heading rotates the entire coordinate frame so drops appear in the correct camera direction. Drops are placed at `y = 0` (eye level), depth capped at 20m to prevent vanishing.

### Key Tech Stack

| Concern | Library |
|---------|---------|
| AR rendering | `@reactvision/react-viro` (ARCore backend) |
| Wallet signing | `@solana-mobile/mobile-wallet-adapter-protocol` |
| NFT minting | `@metaplex-foundation/mpl-bubblegum` + UMI |
| On-chain program | `@coral-xyz/anchor` + Rust |
| Navigation | `@react-navigation/bottom-tabs` v7 |
| Maps | `react-native-maps` (LITE mode mini-map) |
| GPS | `react-native-geolocation-service` |
| Compass | `react-native-sensors` (magnetometer, EMA α=0.15) |
| Animations | `react-native-reanimated` + `Animated` API |
| Haptics | `react-native-haptic-feedback` |

---

## Installing on Android

### Minimum Requirements

| Requirement | Minimum |
|-------------|---------|
| Android version | 8.0 (API 26) |
| ARCore | Supported (check [Google's device list](https://developers.google.com/ar/devices)) |
| CPU architecture | arm64-v8a (any 64-bit Android phone from 2018+) |
| RAM | 3 GB |
| Camera | Any rear camera |
| GPS | Required (built-in on all modern phones) |
| Storage | ~80 MB for the APK |

> Most Android phones from 2018 onward meet these specs. If your phone supports Google Play AR apps, it will run SolAR.

### Step 1 — Download the APK

Grab the latest release from the [GitHub Releases page](https://github.com/lightningthief873/solar/releases/latest).

Download `app-arm64-v8a-release.apk`.

Alternatively, sideload via ADB (see Step 4).

### Step 2 — Install a Solana Wallet

Install **Phantom** from the Google Play Store.

Create or import a wallet, then switch the network to **Testnet**:  
Phantom → Settings → Developer Settings → change network to Testnet.

### Step 3 — Enable USB Debugging (for ADB sideload)

> Skip this step if you downloaded the APK directly to your phone and are installing it by tapping the file.

1. **Settings → About phone** → tap **Build number** 7 times  
   *(On some phones this is under Settings → Software information)*
2. **Settings → Developer options** → enable **USB Debugging**
3. Connect phone to PC via USB → tap **Allow** on the prompt that appears

### Step 4 — Install via ADB

**Install Android Platform Tools on your PC** (if you don't have `adb`):
- Download from [developer.android.com/tools/releases/platform-tools](https://developer.android.com/tools/releases/platform-tools)
- Extract and add the folder to your system PATH

**Verify your phone is detected:**
```bash
adb devices
# Expected: <your-serial>   device
```

**Install the APK:**
```bash
adb install -r app-arm64-v8a-release.apk
```

You should see `Success`. The SolAR icon will appear in your app drawer.

> **Alternatively**, transfer the APK file to your phone via USB/cable, open your file manager, tap the APK, and tap Install. You may need to allow "Install from unknown sources" in Settings → Security.

### Step 5 — Grant Permissions

On first launch SolAR will request:
- **Camera** — required for AR rendering. Tap Allow.
- **Precise Location** — required for GPS-based drop detection. Tap Allow.

If you accidentally deny either, go to Settings → Apps → SolAR → Permissions and enable them manually.

### Step 6 — Connect Your Wallet and Get Testnet SOL

1. Open SolAR → tap **Profile** (bottom-right tab)
2. Tap **Connect Wallet** → Phantom opens → tap **Connect**
3. Back in SolAR, tap the green **Airdrop 1 SOL** button
4. Wait ~5 seconds — your balance should update to `1.0000 SOL`

> If airdrop fails with "rate limited", wait 60 seconds and try again. Testnet faucets enforce per-IP rate limits.

### Step 7 — Mock Your GPS (if not in Pune, India)

The 5 demo drops are seeded at **[18.5204°N, 73.8567°E]** (Pune, India). If you're not physically there, use a GPS mock app to simulate being at that location.

**Recommended:** [Fake GPS Location](https://play.google.com/store/apps/details?id=com.lexa.fakegps) (free)

Setup:
1. Developer options → **Select mock location app** → choose Fake GPS Location
2. Open Fake GPS → tap the map or search for `18.5204, 73.8567` → tap **Play ▶**
3. Switch back to SolAR — drops will appear in AR within a few seconds

### Step 8 — Explore and Claim Drops

1. Tap the **Explore** tab → point your camera at any open surface
2. Glowing orbs appear at their real-world positions — each one is an NFT drop
3. The **Radar HUD** (compass ring, top-right) shows direction + distance to every drop within 200m, including ones behind you
4. Move your mock GPS (or walk) within the claim radius of a drop:
   - Phone **vibrates** (heavy impact haptic)
   - Sphere turns **green** and fires a **cyan shockwave ring**
   - Label changes to **"◎ Tap to claim"**
5. Tap the sphere → claim sheet slides up from the bottom
6. Tap **Claim Drop** → Phantom opens → tap **Approve**
7. Wait ~3 seconds → "Minted! 🎉" toast appears

### Step 9 — Check Your Inventory and Leaderboard

- **Inventory** tab → your claimed NFT appears as a gradient card (colour matches rarity) with the claim date
- **Leaderboard** tab → your wallet address appears after your first claim

### Step 10 — Share a Drop

After a successful claim, tap **Share Drop ↗** in the claim sheet. The native share sheet opens with a `solar://` deep link. Anyone who taps that link (with SolAR installed) will have their radar centred on that drop's location.

You can also test deep links directly via ADB:
```bash
adb shell am start -a android.intent.action.VIEW \
  -d "solar://drop?id=drop-1&lat=18.5204&lng=73.8567" \
  com.solar
```

---

## Building from Source

### Prerequisites

- Node 20 (via nvm: `nvm use 20`)
- JDK 17
- Android NDK 27.1.12297006
- Rust + `cargo-build-sbf` (for Anchor program)
- Anchor CLI 1.0.2
- Solana CLI 3.1.14

### Install Dependencies

```bash
yarn install --ignore-engines
```

### Bundle JS + Build Debug APK

```bash
# Terminal 1 — Metro bundler
yarn start

# Terminal 2 — build + deploy to connected device
yarn android
```

### Build Release APK

```bash
# 1. Bundle JS
npx react-native bundle \
  --platform android \
  --dev false \
  --entry-file index.js \
  --bundle-output android/app/src/main/assets/index.android.bundle \
  --assets-dest android/app/src/main/res/

# 2. Build APK
cd android && ./gradlew assembleRelease

# APK output:
# android/app/build/outputs/apk/release/app-arm64-v8a-release.apk
```

### Build Anchor Program

```bash
cd anchor
anchor build          # compiles solar_program.so
anchor test           # runs test suite
anchor deploy         # deploys to configured cluster (testnet by default)
```

---

## Project Structure

```
solar/
├── App.tsx                          # Root: WalletProvider + deep link handler
├── android/                         # Native Android project
├── anchor/
│   └── programs/solar_program/
│       └── src/
│           ├── lib.rs               # Program entry, 4 instruction dispatchers
│           ├── state.rs             # DropState, CollectorState, LeaderboardState
│           ├── error.rs             # SolARError enum
│           ├── constants.rs         # Claim radii in e7 fixed-point
│           └── instructions/
│               ├── plant_drop.rs
│               ├── claim_drop.rs
│               ├── expire_drop.rs
│               └── record_streak.rs
└── src/
    ├── ar/
    │   ├── ARScene.tsx              # ViroARSceneNavigator wrapper, material + animation registry
    │   └── DropSphere.tsx           # Per-drop AR node: orbit rings, shockwave, label
    ├── components/
    │   ├── RadarRing.tsx            # Compass HUD overlay
    │   └── MiniMap.tsx              # react-native-maps LITE mini-map
    ├── contexts/
    │   └── WalletContext.tsx        # MWA state, claimDrop(), plantDrop(), refreshStats()
    ├── hooks/
    │   ├── useGPS.ts                # Geolocation with 500ms throttle
    │   └── useCompass.ts            # Magnetometer with EMA smoothing
    ├── navigation/
    │   └── AppNavigator.tsx         # 5-tab bottom nav
    ├── screens/
    │   ├── ExploreScreen.tsx        # AR view + HUD overlays + drop state
    │   ├── ClaimSheet.tsx           # Bottom sheet content: claim + share
    │   ├── PlantScreen.tsx          # 2-step drop creation
    │   ├── InventoryScreen.tsx      # NFT grid + collection sets
    │   ├── LeaderboardScreen.tsx    # Podium + ranked list
    │   └── ProfileScreen.tsx        # Wallet + stats
    ├── solana/
    │   ├── rpc.ts                   # Connection, PDA helpers, leaderboard parser
    │   ├── useMWA.ts                # transact()-based signing hook
    │   ├── mintCNFT.ts              # Bubblegum createTree + mintV1 via UMI
    │   └── idl/solar_program.json   # Generated IDL
    ├── types/index.ts               # Drop, OwnedNFT, LeaderboardEntry, etc.
    └── utils/
        ├── haversine.ts             # GPS distance + AR position math
        ├── constants.ts             # RARITY_CONFIG, COLLECTION_SETS, PROGRAM_ID
        ├── seedDrops.ts             # 5 demo drops at Pune base coordinate
        └── deepLink.ts              # solar:// pub-sub dispatcher
```

---

## Further Enhancements (For Developers)

### On-Chain / Solana

- **Merkle Tree Initialisation** — Before real cNFT minting works end-to-end, a Bubblegum merkle tree must be created on-chain. Add a `createMerkleTree()` call in `seedDrops.ts` and store the tree address in constants. The code in `mintCNFT.ts` is ready; it just needs the tree address wired in.
- **Devnet Deploy** — The program is on testnet. Fund `8R1fJhGaUH5JovHLYgatv7hDAdxFNRo6nf5cREtPVPwF` with 2+ devnet SOL and run `cd anchor && anchor program deploy --url devnet target/deploy/solar_program.so`. Update `DEVNET_RPC` in `constants.ts`.
- **NFT Metadata on Arweave/IPFS** — `mintCNFT.ts` currently passes a placeholder URI. Wire in `@metaplex-foundation/umi-uploader-irys` to upload per-rarity metadata JSON + image to Arweave before minting.
- **`expire_drop` Crank** — Write a serverless function (Cloudflare Worker or Lambda) that polls expired drops and calls the `expire_drop` instruction to return lamports to creators.
- **`record_streak` Automation** — Currently streak must be called manually. Auto-call it from `claimDrop()` in `WalletContext.tsx` after a successful claim.
- **Event-Sourced NFT Index** — Replace the in-memory `_ownedNFTs` store in `rpc.ts` with a proper indexer: subscribe to Bubblegum program logs via `connection.onLogs()` and filter by the collector's public key.

### AR / Visual

- **Sound Effects** — Add `react-native-sound` with three files: `claim_success.mp3` (chime, <30KB), `drop_nearby.mp3` (soft ping), `plant_confirm.mp3`. Wire into `ClaimSheet.tsx` and `handleEnterRange()` in `ExploreScreen.tsx`.
- **ViroParticleEmitter** — Upgrade from orbit-sphere particles to true GPU particle emitters for better visual density without polygon cost. ViroReact exposes `ViroParticleEmitter` with `image`, `spawnBehavior`, `particleAppearance`, and `particlePhysics` props.
- **Drop Preview in AR** — Before tapping, show a floating info card (name + rarity pill) using `ViroFlexView` above each sphere.
- **Dynamic LOD** — At distances > 50m, replace the full orbit ring with a single-colour low-poly sphere to maintain 60fps on mid-range devices.
- **Night Mode** — Detect ambient light via the sensor API and switch to a higher-emissive material set for low-light environments.

### UX / Product

- **Push Notifications** — Use Firebase Cloud Messaging to notify collectors when a new drop is planted within 1km of their last-known location.
- **Creator Dashboard** — Add a 6th tab showing analytics for drops you planted: claim rate, revenue earned, time remaining on event drops.
- **Social Profiles** — Let wallets set a display name + avatar (stored in a `ProfileState` PDA). Show display names on the leaderboard instead of truncated addresses.
- **Collectible Frames** — Apply a rarity-specific frame/border image to claimed NFTs stored in the inventory, fetched from the NFT metadata URI.
- **Clan / Group Drops** — Multi-signature drops that require N friends to claim simultaneously — useful for team events at hackathons.
- **iOS Port** — ViroReact supports iOS via ARKit. The JS codebase is already cross-platform; only the MWA layer needs an iOS-compatible fallback (e.g. WalletConnect).

### Infrastructure

- **Indexer** — Deploy a lightweight Helius webhook listener that indexes all `claim_drop` transactions into a PostgreSQL table for real-time leaderboard and analytics without parsing raw PDA binary.
- **CI/CD** — Add GitHub Actions: `tsc --noEmit` + `anchor build` + `anchor test` on every PR. Build APK on main branch push.
- **E2E Tests** — Detox or Maestro for the full claim flow with a mock GPS provider.

---

## Known Limitations

| Limitation | Workaround |
|------------|-----------|
| Deployed on Testnet, not Devnet | Fund wallet with devnet SOL and redeploy |
| Merkle tree not pre-created | Run `createMerkleTree()` in `mintCNFT.ts` before first real mint |
| NFT metadata uses placeholder URI | Wire Irys/Arweave uploader into `mintCNFT.ts` |
| Sound effects not implemented | Install `react-native-sound` + add `src/assets/sounds/*.mp3` |
| iOS not supported | ViroReact iOS build requires macOS + Xcode |
| GPS seed drops centred on Pune, India | Use a mock GPS app when testing elsewhere |

---

## License

MIT — build on it, fork it, win with it.
