# Build Progress

## Overall Status: PHASE 1 COMPLETE ✓

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
- NDK 27.1.12297006, compileSdk 34, targetSdk 34, minSdk 24
- ABI: arm64-v8a only (ViroReact has no x86_64 renderer)
- libvrapi.so patched: replaced with 16KB-aligned stub (Android 15 emulator compat)
- JS bundled into APK for emulator testing (no Metro WSL2 tunnel on API 37)
- Real ARM64 phone: install arm64-v8a-debug.apk directly for full AR

## Prompt 2 — AR Engine + Radar HUD

- [ ] react-native-geolocation-service GPS hook
- [ ] react-native-sensors magnetometer/compass hook
- [ ] haversine.ts: GPS coords → AR [x, y, z] position (unit tested)
- [ ] ARScene renders 5 seeded dummy drops at correct real-world positions
- [ ] Four rarity tiers with distinct sphere colors and animations
- [ ] RadarRing HUD: compass ring showing drop direction + distance
- [ ] Mini-map overlay (react-native-maps) toggleable from AR view
- [ ] Proximity gating: drops highlight when within claim radius

## Prompt 3 — Full Anchor Program + Solana Core

- [ ] Anchor workspace initialized
- [ ] plant_drop, claim_drop, expire_drop, record_streak instructions
- [ ] DropState, CollectorState, LeaderboardState PDAs
- [ ] Program deployed to Devnet
- [ ] MWA wallet connect/disconnect
- [ ] Bubblegum cNFT mint tested on Devnet

## Prompt 4 — All App Flows

- [ ] Bottom tab navigator: Explore / Plant / Inventory / Leaderboard
- [ ] All 5 screens built out

## Prompt 5 — Polish + Win Layer + APK

- [ ] Particle effects, haptics, animations
- [ ] Release APK

## Current Focus

Prompt 2

## Last Session

2026-05-07: Completed Phase 1. ViroReact running on API 37 emulator via ARM
translation (Berberis). Fixed libvrapi.so 16KB page alignment by replacing with
NDK-compiled stub. JS bundled into APK to bypass WSL2/Metro tunnel issue.
All native libs load OK. glowBlue material found. AR scene initialized.
