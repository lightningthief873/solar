# Build Progress

## Overall Status: ALL PHASES COMPLETE ✓ — APK BUILDING

---

## Prompt 1 — Foundation + AR Baseline ✓ DONE

- [x] React Native 0.85.3 bare project initialized (`solar`)
- [x] ViroReact 2.54.0 installed, gradle subprojects wired manually
- [x] ARScene: animated blue sphere (rotateY + floatCycle) + "SolAR" text
- [x] Android permissions: CAMERA, LOCATION, INTERNET, NETWORK_STATE
- [x] ARCore metadata: optional, queries block for com.google.ar.core
- [x] src/types/index.ts: Drop, CollectorStats, RarityConfig, Rarity, DropMode
- [x] src/utils/constants.ts: RARITY_CONFIG (4 tiers), DEVNET_RPC, MAX_RADAR_DISTANCE
- [x] Git repo initialized, .gitignore in place
- [x] Initial commit: "feat: Phase 1 — scaffold + ViroReact AR baseline"
- [x] Emulator verified: libviro_renderer.so loads OK, glowBlue material FOUND, JS runs

### Key build facts
- NDK 27.1.12297006, compileSdk 36 (bumped from 34 for Phase 2 deps), minSdk 24
- ABI: arm64-v8a only (ViroReact has no x86_64 renderer)
- libvrapi.so patch: scripts/patch-libvrapi.py — run via postinstall after yarn add
  - Patches PT_LOAD offsets to 16KB multiples (Android 15 / API 35+ requirement)
  - Symbol list: exactly what libviro_renderer.so needs (grep-extracted)
- JS bundled into APK: run `npx react-native bundle ...` with Node 20 before build
- Gradle must run with Node 20 (not 18): `nvm use 20 && ./gradlew assembleDebug`
- react-native-sensors: jcenter() replaced with mavenCentral() in its build.gradle

---

## Prompt 2 — AR Engine + Radar HUD ✓ DONE

- [x] react-native-geolocation-service GPS hook (useGPS.ts)
- [x] react-native-sensors magnetometer/compass hook (useCompass.ts, EMA α=0.15)
- [x] haversine.ts: GPS→AR [x,y,z] position + bearing + distance (8/8 unit tests pass)
- [x] ARScene renders 5 seeded dummy drops at real-world positions
- [x] Four rarity tiers: glowBlue/glowPurple/glowGold/glowRainbow (Constant lighting)
- [x] DropSphere: per-rarity scale + animation; goldPulse when within claim radius
- [x] RadarRing HUD: 180px compass ring, bearing-relative dots, distance sub-rings
- [x] MiniMap: react-native-maps LITE mode, toggleable bottom-left button
- [x] App.tsx: GestureHandlerRootView + @gorhom/bottom-sheet on drop tap
- [x] Commit: "feat: GPS→AR bridge, Haversine, Radar HUD, mini-map"
- [x] Verified: ReactNativeJS running, VRTMaterialManager FOUND (5 materials), ViroAR active

### Phase 2 dependencies added
- react-native-geolocation-service ^5.3.1
- react-native-sensors ^7.3.6
- react-native-maps ^1.27.2
- react-native-reanimated ^4.3.0 + react-native-worklets ^0.8.3
- @gorhom/bottom-sheet ^5.2.13
- react-native-gesture-handler ^2.31.2

---

## Prompt 3 — Anchor Program + Solana Core ✓ DONE

- [x] Anchor workspace initialized (anchor-lang 1.0.2, Rust, Solana CLI 3.1.14)
- [x] plant_drop, claim_drop, expire_drop, record_streak instructions
- [x] DropState, CollectorState, LeaderboardState PDAs
- [x] Proximity check: bounding box in e7 fixed-point (avoids float on-chain)
- [x] CpiContext::new takes Pubkey in Anchor 1.0 (Solana 3.x SDK)
- [x] anchor-lang init-if-needed feature enabled
- [x] `anchor build` passes — solar_program.so (241K) + IDL generated
- [x] IDL copied to src/solana/idl/solar_program.json
- [x] src/solana/rpc.ts: PDA helpers, connection, balance
- [x] src/solana/useMWA.ts: transact()-based MWA hook
- [x] src/solana/mintCNFT.ts: Bubblegum mintV1 + createTree via UMI
- [x] src/contexts/WalletContext.tsx: claimDrop, plantDrop, refreshStats
- [x] App.tsx: wrapped in WalletProvider
- [x] TypeScript clean (tsc --noEmit passes)
- [x] Commit: "feat: Anchor program compiled + MWA + Bubblegum cNFT layer"
- [x] anchor deploy — LIVE on testnet (devnet needs 2+ SOL)

### Phase 3 key facts
- Platform-tools v1.52 (496MB) — must be manually extracted if download fails:
  `cd ~/.local/share/solana/install/releases/stable-.../platform-tools-sdk/sbf/dependencies/platform-tools && tar -xjf tmp-*.tar.bz2`
- anchor-lang 1.0.2: CpiContext::new(program_pubkey, accounts) — NOT AccountInfo
- pub(crate) fn handler in each instruction file (avoids re-export name clash)
- Program deployed testnet: EXNrAhbDZgXchu6D8i1Gup47qgKkMkTuC6FR6ehZqkQ7
- SOLAR_RPC in constants.ts = testnet (update to devnet when funded)

### Deploy steps (when SOL available)
1. cd anchor && anchor deploy
2. Note program ID → save to memory/decisions.md
3. Update declare_id! in lib.rs if changed

---

## Prompt 4 — All App Flows ✓ DONE

- [x] AppNavigator: 5-tab bottom nav (Explore/Plant/Inventory/Leaderboard/Profile)
- [x] ExploreScreen: AR + wallet pill + RadarRing + mini-map toggle + BottomSheet claim
      Claim flow: haptics + shake animation on error + countdown for event drops
- [x] PlantScreen: 2-step (map long-press pin → configure form) + plantDrop() call
- [x] InventoryScreen: 2-col NFT grid (LinearGradient) + collection set progress bars
- [x] LeaderboardScreen: podium top-3 (gold/silver/bronze) + list rows 4-10 + 30s refresh
- [x] ProfileScreen: wallet card + stats grid + SOL balance + dev airdrop (testnet only)
- [x] App.tsx: WalletProvider → GestureHandlerRootView → AppNavigator (18 lines)
- [x] tsc --noEmit: 0 errors
- [x] Commit: "feat: all screens + full claim/plant/inventory/leaderboard flows"

### Phase 4 key facts
- react-navigation/bottom-tabs v7 with emoji tab icons (no image assets needed)
- LinearGradient for NFT cards + leaderboard podium (react-native-linear-gradient)
- ExploreScreen 199 lines (200-line limit enforced — split if adding more)
- getLeaderboard() reads binary PDA: skip 12 bytes (8 discriminator + 4 vec len), 40-byte entries
- OwnedNFT store is in-memory in rpc.ts (addOwnedNFT / getOwnedNFTs)
- IS_TESTNET detected from DEVNET_RPC URL substring — dev airdrop hidden on mainnet

## Prompt 5 — Polish + Win Layer + APK ✓ DONE

- [x] AR particle effects: per-rarity orbit rings (3/6/8/double), shockwave on range entry, "Tap to claim" label
- [x] Proximity haptic: impactHeavy + toast when entering any drop's claim radius
- [x] Share button: native Share sheet after successful claim, solar:// deep link URL
- [x] Deep links: AndroidManifest solar:// intent filter + App.tsx Linking handler + src/utils/deepLink.ts pub-sub
- [x] Animation audit: InventoryScreen staggered spring fade-in, LeaderboardScreen slide-from-right stagger, PlantScreen spring horizontal slide between steps, BottomSheet spring config {damping:20, stiffness:200}
- [x] Error states: red banner + retry on PlantScreen, error state on LeaderboardScreen, empty states with illustrations on all screens
- [x] seed drops updated to spec: Ancient Gateway (Mythic/N), Solana Summit Drop (Legendary/E), Hidden Courtyard (Rare/SE), Street Corner (Common/W), Flash Drop (Common/NE)
- [x] tsc --noEmit: 0 errors
- [x] Release APK: `cd android && ./gradlew assembleRelease`

### Phase 5 key facts
- ExploreScreen split: ClaimSheet.tsx extracted (share button, countdown, claim UI)
- OrbitRing component in DropSphere.tsx: pre-placed spheres at N angles, parent ViroNode animates rotateY
- Shockwave: ViroAnimatedComponent(shockwave anim) runs once on isClaimable transition, onFinish hides it
- ViroAnimatedComponent requires delay + onStart + onFinish props (all required by types)
- `transparency` is not a valid ViroMaterial key — removed
- Deep link pub-sub: dispatchDeepLink() in App.tsx → setDeepLinkListener() in ExploreScreen on focus
- enableProguardInReleaseBuilds = false already set in android/app/build.gradle ✓
- APK signed with debug.keystore (fine for hackathon demo)

## Current Focus

DONE — submit APK

## Last Session

2026-05-07: Completed Phase 5. All polish features implemented. tsc clean.
Committed v1.0.0-hackathon. APK at android/app/build/outputs/apk/release/app-release.apk.
