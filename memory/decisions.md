# Architectural Decisions

## AR: ViroReact (@reactvision/react-viro) over raw ARCore

ReactVision (actively maintained, acquired by Morrow 2025) gives us a
single React Native codebase for AR without writing Java/Kotlin.
ARCore is still the Android backend — we just skip the boilerplate.
Key constraint: only arm64-v8a ABI is supported (no x86_64 emulator).

## NFTs: Compressed (Bubblegum v2) over Standard Metaplex

Cost per mint: ~0 SOL for cNFTs vs ~0.012 SOL for standard Metaplex.
Merkle tree must be pre-created before minting. Tree address needs to be
stored in constants.ts and wired into the claimDrop flow.

## Wallet: Mobile Wallet Adapter only

MWA is the Solana Mobile stack requirement. No mnemonic storage ever.
`transact()` is the only signing path. Cluster set to testnet in useMWA.ts.

## Anchor: 4 instructions with PDAs and escrow

- `plant_drop` escrows SOL so creators have skin in the game
- `claim_drop` does proximity check in e7 fixed-point (avoids floats on-chain),
  mints cNFT via Bubblegum CPI, releases escrow to creator
- `expire_drop` returns escrowed lamports to creator after expiry
- `record_streak` increments streak (24h window)

CpiContext::new takes Pubkey in Anchor 1.0+ (not AccountInfo).
`pub(crate) fn handler` on all instructions avoids re-export name collisions.

## Dual Mode: Tourism vs Events

Tourism: permanent, no expiry, heritage metadata field, visible to all.
Events: time-limited (6–48h), countdown visible in AR and claim sheet.
Same on-chain structure; mode is a u8 flag (0 = tourism, 1 = event).

## GPS → AR Math

Haversine distance → metres. Bearing from user to drop → AR [x, 0, z] position.
Compass heading rotates the entire coordinate frame so drops face the camera.
Depth capped at 20m to prevent drops vanishing in the distance.

## Radar HUD

React Native overlay (not inside ViroReact) — a 180px compass ring SVG
with bearing-relative dots for each drop within 200m, plus distance sub-rings.
Solves the core UX problem: you cannot see drops behind you in the camera.

## AR Particle Effects

Each rarity tier renders satellite spheres in a parent ViroNode
that rotates via ViroAnimations (rotateY). Pre-placed at N evenly-spaced
angles — rotating the parent creates the orbit effect without physics.
- Common: 3 satellites, orbitSlow (4s)
- Rare: 6 satellites, orbitFast (1.5s)
- Legendary: 8 satellites tilted 0.18 on Y, orbitFast
- Mythic: inner ring (6, orbitFast CW) + outer ring (8, orbitReverse CCW)

Shockwave: single-frame ViroAnimation (scale 1→4, opacity 1→0, 800ms EaseOut)
triggered once when user enters claim radius. `onFinish` unmounts the sphere.

## On-Chain Program

**Program ID:** `EXNrAhbDZgXchu6D8i1Gup47qgKkMkTuC6FR6ehZqkQ7`
**Network:** Solana Testnet
**Deployed:** 2026-05-07
**Upgrade authority:** `8R1fJhGaUH5JovHLYgatv7hDAdxFNRo6nf5cREtPVPwF`
**Deploy tx:** `XFEKQ8r1Ja6f8LoSXwzmNvybMMj48oyJKmdHU86jjNipjG5vTjVLHYbwQxwmy9DRfX5oMTeMnAQuNmepSGLXNcf`

To migrate to devnet:
```
solana airdrop 2 8R1fJhGaUH5JovHLYgatv7hDAdxFNRo6nf5cREtPVPwF --url devnet
cd anchor && anchor program deploy --url devnet target/deploy/solar_program.so
# then update DEVNET_RPC in src/utils/constants.ts
```

---

## Demo Guide

### Prerequisites
- Android phone with ARCore support (arm64-v8a, Android 8.0+)
- Phantom or Solflare installed, network set to Testnet
- APK from GitHub Releases: `app-arm64-v8a-release.apk`

### Install
```bash
adb install -r app-arm64-v8a-release.apk
```

### Steps
1. Open SolAR → Profile → Connect Wallet → authorize in Phantom
2. Profile → Airdrop 1 SOL (may need to retry once if rate-limited)
3. Mock GPS to `18.5204, 73.8567` if not in Pune (use Fake GPS app)
4. Explore → point camera outward — 5 seed drops appear in AR
5. Move GPS within claim radius → phone vibrates + sphere turns green
6. Tap sphere → claim sheet → Claim Drop → approve in Phantom → Minted!
7. Inventory → claimed NFT card appears
8. Leaderboard → your wallet appears after first claim
9. After claim: Share Drop → native share sheet with solar:// URL

### Deep Link Test
```bash
adb shell am start -a android.intent.action.VIEW \
  -d "solar://drop?id=drop-1&lat=18.5204&lng=73.8567" com.solar
```

### Seed Drop Locations (base: 18.5204°N, 73.8567°E)

| ID | Name | Rarity | Direction | Distance |
|----|------|--------|-----------|----------|
| drop-1 | Ancient Gateway | Mythic | North | 10m |
| drop-2 | Solana Summit Drop | Legendary | East | 20m |
| drop-3 | Hidden Courtyard | Rare | South-East | 15m |
| drop-4 | Street Corner | Common | West | 25m |
| drop-5 | Flash Drop | Common | North-East | 30m |

### Known Limitations

| Issue | Status |
|-------|--------|
| Merkle tree not pre-created (cNFT mint needs it) | Needs one-time setup |
| Deployed on Testnet not Devnet | Fund wallet and redeploy |
| NFT metadata uses placeholder URI | Wire Irys uploader |
| Sound effects not implemented | Add react-native-sound |
| iOS not supported | Requires macOS + Xcode |
| Seed drops centred on Pune, India | Use Fake GPS when testing elsewhere |
