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

## Installing on Your Phone (iQOO Z3, Android 13)

Your iQOO Z3 runs a Snapdragon 768G with ARCore support. The APK is already built as `arm64-v8a` — it will run natively without any emulation.

### Step 1 — Install a Solana Wallet

Install **Phantom** from the Google Play Store on your iQOO Z3.

Create or import a wallet. Switch the network to **Testnet**:  
Phantom → Settings → Developer Settings → Testnet.

### Step 2 — Enable USB Debugging on Your Phone

1. Open **Settings → About phone**
2. Tap **Build number** 7 times until you see "You are now a developer"
3. Go back to **Settings → Additional Settings → Developer options**
4. Enable **USB debugging**
5. Connect your phone to your PC via USB cable
6. On the phone, tap **Allow** when the USB debugging prompt appears

### Step 3 — Install ADB on Your PC

**Windows (WSL / PowerShell):**
```bash
# If you have scoop:
scoop install adb

# Or download Android Platform Tools from:
# https://developer.android.com/tools/releases/platform-tools
# Extract and add to PATH
```

**Verify ADB sees your phone:**
```bash
adb devices
# Should show: <serial>   device
```

### Step 4 — Install the APK

```bash
adb install -r android/app/build/outputs/apk/release/app-arm64-v8a-release.apk
```

You should see `Success` in the terminal and the SolAR icon appear on your phone.

### Step 5 — Grant Permissions

On first launch, the app will ask for:
- **Camera** — required for AR. Tap Allow.
- **Location (precise)** — required for GPS drop detection. Tap Allow.

### Step 6 — Connect Your Wallet and Get Testnet SOL

1. Tap the **Profile** tab (bottom right)
2. Tap **Connect Wallet** → Phantom opens → tap **Connect**
3. Back in SolAR, tap **Airdrop 1 SOL** (the green button — testnet only)
4. Wait ~5 seconds. Your balance should show `1.0000 SOL`

> If airdrop fails with "rate limited", wait 60 seconds and try again. Testnet faucet limits are per-IP.

### Step 7 — Explore AR Drops

1. Tap the **Explore** tab
2. Point your camera at a wall or open space
3. The 5 demo drops are seeded at GPS coordinates near **Pune, India [18.5204°N, 73.8567°E]**

**If you are not in Pune:** Use a GPS mock app to simulate being there.

**Recommended GPS mock app:** [Fake GPS Location](https://play.google.com/store/apps/details?id=com.lexa.fakegps) (free on Play Store).

Setup:
1. Install Fake GPS Location
2. Developer options → **Select mock location app** → choose Fake GPS Location
3. In Fake GPS: search "Pune, Maharashtra" → tap the coordinate `18.5204, 73.8567` → tap Play ▶
4. Switch back to SolAR → drops should appear in AR within a few seconds

### Step 8 — Claim a Drop

1. Once GPS is near the seed location, AR spheres appear floating in your camera view
2. The **Radar HUD** (compass ring, top-right) shows direction arrows to all nearby drops
3. "Walk" toward a drop (or adjust mock GPS closer) — when within claim radius:
   - Phone **vibrates**
   - Sphere turns **green** and emits a shockwave ring
   - "◎ Tap to claim" appears below the sphere
4. Tap the sphere → claim sheet slides up
5. Tap **Claim Drop**
6. Phantom opens for signing → tap **Approve**
7. Wait ~3 seconds → toast "Minted! 🎉"

### Step 9 — Check Your Inventory

Tap **Inventory** tab — your claimed NFT appears as a gradient card with rarity colour, name, and claim date.

### Step 10 — Test Deep Links

After claiming, tap **Share Drop ↗** in the claim sheet. This copies a `solar://` URL. You can also test deep links directly:

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
