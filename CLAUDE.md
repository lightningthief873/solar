# SolAR — GPS-Anchored AR NFT Drops on Solana

## Hackathon

EasyA Miami — Solana Mobile Track
Submit: APK + GitHub repo + demo video + one paragraph description
Network: Devnet throughout. No mainnet.

## Concept

Users walk outdoors and see glowing NFT objects floating at real-world GPS
coordinates through their phone camera (AR). Walk close enough, tap to claim —
the NFT mints to your wallet on-chain via Bubblegum cNFT, signed through
Mobile Wallet Adapter. Creators plant drops at coordinates with rarity tiers,
optional SOL price, and expiry time. Two modes: Tourism (permanent heritage
markers at landmarks) and Events (ephemeral 48-hour drops at conferences,
festivals). Your wallet becomes your proof-of-presence history.

## What Makes This Win

1. GPS → AR bridge (Haversine + compass) — the hard part done right
2. Four rarity tiers with distinct particle AR visuals
3. Dual mode: permanent Tourism drops + ephemeral Event drops
4. Creator earns SOL from paid claims (escrow via Anchor)
5. On-chain leaderboard, streak system, collection sets
6. Radar HUD: compass ring showing direction + distance to all nearby drops
7. Drop discovery mini-map alongside AR view
8. Full creator analytics dashboard

## Locked Tech Stack

- React Native bare workflow (NOT Expo managed)
- @reactvision/react-viro — AR (ARCore on Android)
- @solana-mobile/mobile-wallet-adapter-protocol — wallet signing
- @solana/web3.js + @metaplex-foundation/mpl-bubblegum — cNFTs
- @metaplex-foundation/umi + umi-bundle-defaults
- react-native-geolocation-service — GPS
- react-native-sensors — magnetometer/compass
- react-native-maps — mini-map overlay
- react-native-reanimated — animations
- @react-navigation/native + @react-navigation/bottom-tabs
- Anchor 0.30 on Devnet

## Anchor Program: solar_program

Four instructions (not three):

- plant_drop: register GPS coords, rarity, price, expiry, escrow SOL
- claim_drop: verify proximity, mint cNFT via Bubblegum CPI, release escrow
- expire_drop: creator reclaims unclaimed drops after expiry
- record_streak: increment collector streak counter on-chain

PDAs:

- DropState: [b"drop", creator_pubkey, drop_id]
- CollectorState: [b"collector", wallet_pubkey]
- LeaderboardState: [b"leaderboard"] — global singleton

## Rarity Tiers

| Tier      | Color          | AR Effect         | Claim Radius |
| --------- | -------------- | ----------------- | ------------ |
| Common    | Blue glow      | Slow pulse        | 15m          |
| Rare      | Purple shimmer | Fast spin         | 10m          |
| Legendary | Gold burst     | Particle fountain | 7m           |
| Mythic    | Rainbow prism  | Shockwave ring    | 5m           |

## App Screens

1. ExploreScreen — full-screen AR + radar HUD + mini-map toggle
2. PlantScreen — map pin + drop config form
3. InventoryScreen — owned cNFTs grid + collection set progress
4. LeaderboardScreen — top collectors, streak ranks
5. ProfileScreen — wallet, stats, creator earnings

## File Structure

solar/
├── .claude/
│   ├── settings.json
│   └── settings.local.json    ← personal keys, not committed
├── CLAUDE.md
├── memory/
│   ├── progress.md
│   ├── decisions.md
│   └── blockers.md
├── src/
│   ├── ar/                    ← ViroReact scene, rarity visuals, effects
│   ├── solana/                ← MWA, Bubblegum, RPC, IDL types
│   ├── screens/               ← 5 screens
│   ├── components/            ← HUD, RadarRing, MiniMap, RarityCard, etc.
│   ├── hooks/                 ← useGPS, useCompass, useDrops, useWallet
│   └── utils/                 ← haversine.ts, constants.ts, seedDrops.ts
├── anchor/
│   └── programs/solar_program/
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
8. Keep all Windows path separators as forward slashes in code (\ breaks things).
