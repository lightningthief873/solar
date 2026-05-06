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

TBD — fill in after `anchor deploy` in Prompt 3.
