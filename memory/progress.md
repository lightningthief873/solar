# Build Progress

## Overall Status: PHASE 2 COMPLETE ✓

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

Prompt 3

## Last Session

2026-05-07: Completed Phase 2. GPS→AR Haversine bridge working. 5 drops
seeded near Pune [18.5204, 73.8567]. RadarRing and MiniMap overlays wired.
libvrapi.so re-patched (16KB alignment) after yarn re-fetched it during Phase 2
installs. Fixed missing symbols (vrapi_GetTimeInSeconds, vrapi_ShowSystemUI,
vrapi_RecenterPose). Added scripts/patch-libvrapi.py as postinstall hook.
compileSdk bumped to 36 for androidx.core:core:1.17.0 requirement.
App confirmed running: "ReactNativeJS: Running solar", VRTMaterialManager FOUND,
5 materials registered, ViroAR initialized, location permission dialog appeared.
