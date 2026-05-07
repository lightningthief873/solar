# SolAR — GPS-Anchored AR NFT Drops on Solana

## Concept

Users walk outdoors and see glowing NFT objects floating at real-world GPS
coordinates through their phone camera (AR). Walk close enough, tap to claim —
the NFT mints to your wallet on-chain via Bubblegum cNFT, signed through
Mobile Wallet Adapter. Creators plant drops at coordinates with rarity tiers,
optional SOL price, and expiry time. Two modes: Tourism (permanent heritage
markers at landmarks) and Events (ephemeral drops at conferences, festivals).
Your wallet becomes your proof-of-presence history.

## Key Features

1. GPS → AR bridge (Haversine + compass heading) — drops rendered at exact real-world positions
2. Four rarity tiers with distinct AR particle orbit effects
3. Dual mode: permanent Tourism drops + ephemeral Event drops with countdown
4. Creator earns SOL from paid claims (escrow via Anchor PDAs)
5. On-chain leaderboard, streak system, collection sets
6. Radar HUD: compass ring showing direction + distance to all nearby drops
7. Drop discovery mini-map alongside AR view
8. Proximity haptic + shockwave ring when entering claim radius
9. Deep link sharing: solar://drop?id=X&lat=Y&lng=Z

## Tech Stack

- React Native 0.85.3 bare workflow (NOT Expo managed)
- @reactvision/react-viro 2.54.0 — AR (ARCore on Android)
- @solana-mobile/mobile-wallet-adapter-protocol — wallet signing
- @solana/web3.js + @metaplex-foundation/mpl-bubblegum — cNFTs
- @metaplex-foundation/umi + umi-bundle-defaults
- react-native-geolocation-service — GPS (500ms throttle)
- react-native-sensors — magnetometer/compass (EMA α=0.15)
- react-native-maps — mini-map overlay (LITE mode)
- react-native-reanimated + Animated API — animations
- react-native-haptic-feedback — proximity + claim haptics
- @react-navigation/native + @react-navigation/bottom-tabs v7
- Anchor 1.0.2 on Solana Testnet

## Anchor Program: solar_program

Program ID: EXNrAhbDZgXchu6D8i1Gup47qgKkMkTuC6FR6ehZqkQ7
Network: Testnet (devnet needs 2+ SOL to redeploy)

Four instructions:
- plant_drop: register GPS coords, rarity, price, expiry, escrow SOL
- claim_drop: verify proximity (e7 fixed-point bounding box), mint cNFT, release escrow
- expire_drop: creator reclaims unclaimed drops after expiry
- record_streak: increment collector streak counter on-chain

PDAs:
- DropState: [b"drop", creator_pubkey, drop_id]
- CollectorState: [b"collector", wallet_pubkey]
- LeaderboardState: [b"leaderboard"] — global singleton

## Rarity Tiers

| Tier      | Color   | AR Effect                              | Claim Radius |
| --------- | ------- | -------------------------------------- | ------------ |
| Common    | #4A90E2 | 3 slow-orbiting blue satellite spheres | 15m          |
| Rare      | #9B59B6 | 6 fast-orbiting purple sparkles        | 10m          |
| Legendary | #F39C12 | 8 gold spheres, tilted vertical orbit  | 7m           |
| Mythic    | #FF69B4 | Inner CW ring + outer CCW ring (dual)  | 5m           |

All tiers: sphere turns #00FF88, emits cyan shockwave ring, vibrates on range entry.

## App Screens

1. ExploreScreen — full-screen AR + radar HUD + mini-map toggle + ClaimSheet
2. PlantScreen — 2-step: map long-press pin → spring-slide to config form
3. InventoryScreen — cNFT grid (staggered spring) + collection set progress
4. LeaderboardScreen — podium top-3 + slide-in list rows + 30s auto-refresh
5. ProfileScreen — wallet card + stats + SOL balance + dev airdrop (testnet)

## File Structure

solar/
├── CLAUDE.md
├── memory/
│   ├── progress.md
│   ├── decisions.md
│   └── blockers.md
├── src/
│   ├── ar/
│   │   ├── ARScene.tsx         ← ViroARSceneNavigator, material + animation registry
│   │   └── DropSphere.tsx      ← OrbitRing component, shockwave, proximity detection
│   ├── components/
│   │   ├── RadarRing.tsx       ← Compass HUD overlay
│   │   └── MiniMap.tsx         ← react-native-maps LITE mini-map
│   ├── contexts/
│   │   └── WalletContext.tsx   ← MWA state, claimDrop(), plantDrop(), refreshStats()
│   ├── hooks/
│   │   ├── useGPS.ts           ← Geolocation (500ms min interval)
│   │   └── useCompass.ts       ← Magnetometer with EMA smoothing
│   ├── navigation/
│   │   └── AppNavigator.tsx    ← 5-tab bottom nav
│   ├── screens/
│   │   ├── ExploreScreen.tsx   ← AR view, HUD overlays, drop state
│   │   ├── ClaimSheet.tsx      ← Bottom sheet: claim flow + share button
│   │   ├── PlantScreen.tsx     ← 2-step drop creation with spring slide
│   │   ├── InventoryScreen.tsx ← NFT grid + collection sets
│   │   ├── LeaderboardScreen.tsx
│   │   └── ProfileScreen.tsx
│   ├── solana/
│   │   ├── rpc.ts              ← Connection, PDA helpers, binary leaderboard parser
│   │   ├── useMWA.ts           ← transact()-based signing (testnet)
│   │   ├── mintCNFT.ts         ← Bubblegum createTree + mintV1 via UMI
│   │   └── idl/solar_program.json
│   ├── types/index.ts          ← Drop, OwnedNFT, LeaderboardEntry, CollectionSet, etc.
│   └── utils/
│       ├── haversine.ts        ← GPS distance + AR [x,y,z] position math
│       ├── constants.ts        ← RARITY_CONFIG, COLLECTION_SETS, PROGRAM_ID, DEVNET_RPC
│       ├── seedDrops.ts        ← 5 demo drops at Pune [18.5204, 73.8567]
│       └── deepLink.ts         ← solar:// pub-sub dispatcher
├── anchor/
│   └── programs/solar_program/
│       └── src/
│           ├── lib.rs          ← 4 instruction dispatchers
│           ├── state.rs        ← DropState, CollectorState, LeaderboardState
│           ├── error.rs        ← SolARError enum
│           ├── constants.rs    ← claim radii in e7 fixed-point
│           └── instructions/   ← plant_drop, claim_drop, expire_drop, record_streak
└── android/

## Session Rules

1. Read memory/progress.md FIRST, every session, no exceptions.
2. Update memory/progress.md LAST, every session.
3. Max 200 lines per file — split into smaller files if approaching limit.
4. TypeScript strict. No `any`. Define all types in src/types/.
5. Commit after every working checkpoint with a descriptive message.
6. Never touch android/gradle files unless the task explicitly says to.
7. If blocked on Solana RPC or AR math, write a comment and move on.
   Log the blocker in memory/blockers.md.
8. Keep all path separators as forward slashes in code (backslash breaks things on WSL).
