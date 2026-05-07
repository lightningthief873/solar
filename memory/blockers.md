# Blockers and Known Issues

## Resolved

### libvrapi.so 16KB page alignment (v1.0)
Android 15 requires PT_LOAD segments 16KB-aligned. Fixed with NDK-compiled stub.

### Metro on WSL2 (v1.0)
`adb reverse` doesn't bridge WSL2→emulator. Bundle JS into APK assets before Gradle build.

### react-native-sensors jcenter() (v1.0)
Patched `node_modules/react-native-sensors/android/build.gradle` to use `mavenCentral()`.

### Anchor 1.0.2 CpiContext API (v1.0)
`CpiContext::new` takes `Pubkey` not `AccountInfo` in Anchor 1.0+. Fixed.

### Devnet airdrop rate limit (v1.0)
Deployed to Testnet instead. Program ID unchanged.

### Google Maps blank canvas (v2.0)
`react-native-maps` with `PROVIDER_GOOGLE` showed blank canvas even with API key in AndroidManifest.
Root cause: Maps SDK for Android not enabled in GCP, or billing not set up.
Fix: replaced with self-contained LeafletMap (WebView + inline JS, OSM tiles).

### LeafletMap CDN failure (v2.0)
First LeafletMap version loaded Leaflet from unpkg.com CDN. Failed silently in Android WebView.
Fix: rewrote HTML to inline all JS — tile rendering, pan, zoom, markers, popups — with no external deps.

### LeafletMap in PlantScreen broke pin placement (v2.0)
LeafletMap's `height="100%"` collapsed inside flex container with siblings.
WebView message passing also unreliable for the pin use-case.
Fix: reverted Plant Step 1 to TileMap + overlay TouchableOpacity (places pin at GPS). Works reliably.

### npm peer dep conflicts (v2.0)
react 19 conflicts with react-native-webview and react-native-image-picker peer deps.
Fix: `npm install --legacy-peer-deps`.

---

## Active

### Merkle tree not initialised
Bubblegum merkle tree must be created on-chain before cNFT minting works end-to-end.
`mintCNFT.ts` has the code; needs a real tree address.
Fix: run `createTree()` once, save address to `constants.ts`, wire through `claimDrop()`.

### Program on Testnet, not Devnet
`DEVNET_RPC` in `constants.ts` = `https://api.testnet.solana.com`.
Devnet needs 2+ SOL to redeploy. Fund `8R1fJhGaUH5JovHLYgatv7hDAdxFNRo6nf5cREtPVPwF`.

### NFT metadata uses placeholder URI
`mintCNFT.ts` passes a static URI. Real mints need per-drop JSON + image on Arweave.
Wire `@metaplex-foundation/umi-uploader-irys` and upload before minting.

### OwnedNFT + username stores are in-memory
`addOwnedNFT`/`getOwnedNFTs` in `rpc.ts` and `_username` in `avatar.ts` reset on restart.
Fix: AsyncStorage for username; Helius webhook indexer for NFTs.

### Image URIs are local device paths
`Drop.imageUri` and `OwnedNFT.imageUri` store `content://` paths on the planter's device.
Other users who claim the drop won't see the image (URI is device-local).
Fix: upload to Arweave/IPFS on plant, store HTTPS URI in the metadata.

---

## Deferred

- iOS support (requires ARKit + macOS Xcode)
- Mainnet deployment
- Sound effects (react-native-sound)
- Push notifications (Firebase Cloud Messaging)
- Creator analytics dashboard
- x86_64 emulator AR (no ViroReact renderer)
