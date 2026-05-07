# Architectural Decisions

## AR: ViroReact (@reactvision/react-viro) over raw ARCore

ReactVision acquired by Morrow 2025, actively maintained.
Single RN codebase, Expo TypeScript starter works out of box.
ARCore is still the Android backend — we just avoid the Java boilerplate.

## NFTs: Compressed (Bubblegum v2) over Standard Metaplex

Cost per mint: ~0 SOL for cNFTs vs ~0.012 SOL for standard.
At 10,000 claims/day this is the only viable option.
Merkle tree must be pre-created before minting — do this in seed script.

## Wallet: Mobile Wallet Adapter only

MWA is the Solana Mobile stack requirement.
No mnemonic storage ever. transact() is the only signing path.

## Anchor: 4 instructions with proper PDAs and escrow

plant_drop uses escrow (lockSOL) so creators have skin in the game.
Paid drops release lamports to creator on claim.
Free drops just mint the cNFT with no SOL transfer.

## Dual Mode: Tourism vs Events

Same core mechanic (GPS + AR + mint), different UX framing.
Tourism: permanent, institutional, heritage metadata.
Events: time-limited, festive, countdown on the AR object.
Differentiator: most competitors will build one or the other. We build both.

## Radar HUD

Direction + distance to all drops within 200m shown as a compass ring.
This solves the core usability problem: you can't see drops behind you.
Implemented as a React Native overlay above the AR view, not inside ViroReact.

## Program ID

EXNrAhbDZgXchu6D8i1Gup47qgKkMkTuC6FR6ehZqkQ7

Deployed 2026-05-07 on Solana Testnet (devnet airdrop rate-limited).
Upgrade authority: 8R1fJhGaUH5JovHLYgatv7hDAdxFNRo6nf5cREtPVPwF
Deploy tx: XFEKQ8r1Ja6f8LoSXwzmNvybMMj48oyJKmdHU86jjNipjG5vTjVLHYbwQxwmy9DRfX5oMTeMnAQuNmepSGLXNcf
To migrate to devnet: fund wallet with 2+ SOL then `cd anchor && anchor program deploy --url devnet target/deploy/solar_program.so`

---

## Demo Guide (for judges)

### Prerequisites
- Android device with ARCore support (Pixel 3+ or Samsung Galaxy S9+)
- Phantom or Solflare wallet installed
- SolAR APK: `android/app/build/outputs/apk/release/app-release.apk`

### Steps
1. `adb install -r app-release.apk`
2. Open SolAR → tap "Profile" → tap "Connect Wallet" → authorize in Phantom
3. Tap "Profile" → tap "Airdrop 1 SOL" (testnet faucet, rate-limited — may need to try twice)
4. Tap "Explore" — point camera outward; 5 seed drops appear in AR at base coordinate [18.5204, 73.8567]
5. Walk near a drop OR use emulator (GPS mocked to seed location) — AR sphere turns green + phone vibrates
6. Tap glowing sphere → claim sheet opens → tap "Claim Drop"
7. Wait ~3s for Bubblegum mint TX to confirm → toast "Minted! 🎉"
8. Tap "Inventory" → claimed NFT appears with rarity card (staggered animation)
9. Tap "Leaderboard" → your wallet appears after first claim
10. In Claim sheet after mint, tap "Share Drop ↗" → native share sheet opens with `solar://` URL

### Deep Link Test
```
adb shell am start -a android.intent.action.VIEW -d "solar://drop?id=drop-1&lat=18.5204&lng=73.8567" com.solar
```

### Seed Drop Locations (from base [18.5204, 73.8567])
| Drop | Name | Rarity | Direction | Distance |
|------|------|--------|-----------|----------|
| drop-1 | Ancient Gateway | Mythic | North | 10m |
| drop-2 | Solana Summit Drop | Legendary | East | 20m |
| drop-3 | Hidden Courtyard | Rare | SE | 15m |
| drop-4 | Street Corner | Common | West | 25m |
| drop-5 | Flash Drop | Common | NE | 30m |

### Known Limitations
- Merkle tree must be pre-created before on-chain cNFT minting (run `seedDrops.ts` first)
- Deployed to Testnet not Devnet (devnet airdrop rate limits exceeded during build); program ID same
- Sound effects not implemented (react-native-sound would require additional native rebuild)
- AR frame rate depends on device GPU; reduce particle counts in DropSphere.tsx if < 30fps
