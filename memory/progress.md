# Build Progress

## Overall Status: NOT STARTED

---

## Prompt 1 — Foundation + AR Baseline

- [ ] React Native bare project initialized (`solar`)
- [ ] ViroReact installed and building on Android
- [ ] Basic AR camera renders with one animated sphere
- [ ] Android permissions configured (CAMERA, LOCATION, INTERNET)
- [ ] Git repo initialized, .gitignore in place
- [ ] Emulator confirmed running and ADB connected

## Prompt 2 — AR Engine + Radar HUD

- [ ] react-native-geolocation-service GPS hook working
- [ ] react-native-sensors magnetometer/compass hook working
- [ ] haversine.ts: GPS coords → AR [x, y, z] position (unit tested)
- [ ] ARScene renders 5 seeded dummy drops at correct real-world positions
- [ ] Four rarity tiers with distinct sphere colors and animations
- [ ] RadarRing HUD: compass ring showing drop direction + distance
- [ ] Mini-map overlay (react-native-maps) toggleable from AR view
- [ ] Proximity gating: drops highlight when within claim radius

## Prompt 3 — Full Anchor Program + Solana Core

- [ ] Anchor workspace initialized, compiles
- [ ] plant_drop instruction: GPS, rarity, price, expiry, escrow SOL
- [ ] claim_drop instruction: proximity check stub, Bubblegum CPI, escrow release
- [ ] expire_drop instruction: reclaim lamports after expiry
- [ ] record_streak instruction: increment on-chain streak
- [ ] DropState, CollectorState, LeaderboardState PDAs defined
- [ ] Program deployed to Devnet, ID saved in decisions.md
- [ ] MWA wallet connect/disconnect working on emulator
- [ ] Bubblegum cNFT mint tested on Devnet (signature logged)
- [ ] Devnet airdrop utility working

## Prompt 4 — All App Flows

- [ ] Bottom tab navigator: Explore / Plant / Inventory / Leaderboard
- [ ] ExploreScreen: AR + HUD + claim bottom sheet + mint flow
- [ ] PlantScreen: map pin + form (name, rarity, price, expiry, mode) + plant tx
- [ ] Tourism mode: permanent drops, monument metadata display
- [ ] Event mode: countdown timer visible on AR object + bottom sheet
- [ ] InventoryScreen: cNFT grid, collection set progress bars
- [ ] LeaderboardScreen: top 10 collectors, streak badge ranks
- [ ] ProfileScreen: wallet stats, creator earnings, total SOL earned
- [ ] 5 seeded Devnet drops planted (mix of modes and rarities)

## Prompt 5 — Polish + Win Layer + APK

- [ ] All rarity tier particle effects (not just color changes)
- [ ] Haptic feedback: claim, plant, wallet connect
- [ ] Spring animations on all bottom sheets and modals
- [ ] Claim success: confetti burst + sound
- [ ] Skeleton loaders on Inventory + Leaderboard
- [ ] Error states handled everywhere (RPC fail, wallet disconnect, GPS off)
- [ ] Deep link: share a drop location → opens app at correct AR view
- [ ] Demo seed script: plants 5 varied drops around a fixed coordinate
- [ ] Release APK built: android/app/build/outputs/apk/release/
- [ ] Final commit: "chore: demo-ready release"

## Current Focus

Prompt 1

## Last Session

N/A
