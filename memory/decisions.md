# Architectural Decisions

## AR: ViroReact (@reactvision/react-viro 2.54.0)

ReactVision (actively maintained) over raw ARCore. Single RN codebase, no Java/Kotlin.
Only arm64-v8a ABI supported — no x86_64 emulator.

## NFTs: Compressed (Bubblegum v2)

~0 SOL per cNFT vs ~0.012 SOL standard Metaplex. Merkle tree must be pre-created.
Image NFTs: URI stored locally as device file path (content://). Production needs Arweave upload.

## Maps: Two separate renderers

**Plant screen (TileMap.tsx):** Pure React Native `Image` components fetching OSM tile PNGs.
No WebView, no SDK, no API key. Transparent overlay `TouchableOpacity` places pin at user's GPS.
Simple and crash-proof — this is the proven working approach after multiple iterations.
Do NOT replace with WebView/Google Maps for Plant — it breaks pin placement.

**Explore map modal (LeafletMap.tsx):** Self-contained WebView with all HTML/JS/CSS inline.
OSM tiles loaded as `<img>` tags. Zero CDN dependencies (previous version used unpkg.com CDN
and failed silently in Android WebView). Handles pan, zoom, markers, popups, pin placement messages.
Google Maps was tried but showed blank canvas (API key not fully authorized in GCP; Maps SDK for Android
may not be enabled or billing not set up despite key being wired in).

## Wallet: MWA + Demo Fallback

MWA (Mobile Wallet Adapter) primary path — `transact()` signs real Testnet txns.
If no MWA wallet app (Phantom/Solflare) is installed, falls back to `Keypair.generate()` demo mode.
Demo mode: 1.2s simulated delay, fake signature, `isDemoMode: true` flag propagated to all screens.
Demo drops are claimable in demo mode (`canClaim = inRange || isDemoMode`).

## Image NFTs: Local URI

Gallery image → `launchImageLibrary()` from `react-native-image-picker`.
URI stored as `content://media/...` on device. Passed through:
`Drop.imageUri` → `addPlantedDrop()` → `ExploreScreen.addOwnedNFT()` → `OwnedNFT.imageUri`.
Displayed with RN `Image` component (no upload needed). Lost on app clear.
Production path: upload to Arweave/IPFS via Irys, store the HTTPS URI instead.

## Avatar System: Deterministic Hash

`walletAvatar(addr)` hashes wallet address to a stable emoji (15 options) + hex colour (15 options).
Same wallet = same avatar everywhere. No on-chain storage needed.
Display name: in-memory `_username` variable in `avatar.ts`. Lost on restart.
Production: store in `ProfileState` PDA on-chain, or AsyncStorage.

## Art Styles: Client-Side Gradients

6 preset styles (Classic, Cosmic, Neon, Gold, Storm, Phoenix) defined in `artStyles.ts`.
Rendered as `LinearGradient` when no custom image is attached to the drop.
`ArtStyle` field on `Drop` and `OwnedNFT` carries the selection through the full flow.

## UI Design System: Apple Dark

Token file `src/utils/design.ts` exports `C` (colours) and `R` (radii).
True black (#000) background, #1C1C1E surface, #2C2C2E elevated surface.
Accent: #0A84FF (Apple blue), Green: #30D158, Orange: #FF9F0A, Red: #FF453A.
All screens use these tokens — never hardcoded colours in screen files.

## On-Chain Program

**Program ID:** `EXNrAhbDZgXchu6D8i1Gup47qgKkMkTuC6FR6ehZqkQ7`
**Network:** Solana Testnet
**Deployed:** 2026-05-07
**Upgrade authority:** `8R1fJhGaUH5JovHLYgatv7hDAdxFNRo6nf5cREtPVPwF`

To migrate to devnet:
```bash
solana airdrop 2 8R1fJhGaUH5JovHLYgatv7hDAdxFNRo6nf5cREtPVPwF --url devnet
cd anchor && anchor program deploy --url devnet target/deploy/solar_program.so
# update DEVNET_RPC in src/utils/constants.ts
```

## Build System

Always use tmux for Gradle builds — WSL2 OOM kills the VS Code WSL extension mid-build.
Node 20 required (metro-config uses `Array.prototype.toReversed`).
ABI: arm64-v8a only (`-PreactNativeArchitectures=arm64-v8a`).
npm --legacy-peer-deps required (react 19 peer conflicts with several packages).
