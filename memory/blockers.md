# Blockers and Known Issues

## Resolved

### libvrapi.so 16KB page alignment
Android 15 (API 35+) requires PT_LOAD segments to be 16KB-aligned.
ViroReact's bundled libvrapi.so had misaligned segments. Fixed by replacing
with an NDK-compiled stub (all vrapi_ symbols as no-ops, -nostdlib, patched
ELF offsets to 16KB boundaries). Real ARM64 devices are unaffected.
Fix: viro_renderer-release.aar in node_modules (patched in place).

### Metro hot reload on WSL2
`adb reverse tcp:8081 tcp:8081` does not bridge WSL2→Windows→emulator.
Workaround: bundle JS into APK assets with `npx react-native bundle` before
Gradle build. Hot reload works fine on a real USB-connected device.

### ABI: x86_64 emulators
ViroReact has no x86_64 native renderer. Only arm64-v8a builds are supported.
Real ARM64 devices (any phone 2018+) work without workaround.

### react-native-sensors using jcenter()
`jcenter()` was removed from Gradle 9. Fixed by patching
`node_modules/react-native-sensors/android/build.gradle` to use `mavenCentral()`.
Must be re-applied after a clean `yarn install`.

### Anchor 1.0.2 CpiContext API change
`CpiContext::new` takes `Pubkey` (not `AccountInfo`) in Anchor 1.0+.
Fixed in all instructions: pass `ctx.accounts.system_program.key()` not `.to_account_info()`.

### `init_if_needed` compile error
Requires `anchor-lang = { version = "1.0.2", features = ["init-if-needed"] }` in Cargo.toml.
Fixed.

### Bubblegum v5 TransactionBuilder double-await
`createTree()` and `mintV1()` return `Promise<TransactionBuilder>`.
Must `await (await builder).sendAndConfirm(umi)`. Fixed in mintCNFT.ts.

### Devnet airdrop rate limit during deploy
Needed 1.71 SOL for program deploy; devnet faucet rate-limited.
Deployed to Testnet instead. Program ID unchanged.
Recovered a stuck buffer via: `solana program close <BUFFER_ADDR> --url testnet --bypass-warning`

## Active

### Merkle tree not initialised
A Bubblegum merkle tree must be created on-chain before cNFT minting works
end-to-end. `mintCNFT.ts` has the code; it just needs a real tree address.
Fix: run `createTree()` once from `src/solana/mintCNFT.ts`, save the address
to `constants.ts`, and pass it through the `claimDrop` flow in WalletContext.

### Program on Testnet, not Devnet
`DEVNET_RPC` in `constants.ts` points to `https://api.testnet.solana.com`.
To move to devnet: fund wallet `8R1fJhGaUH5JovHLYgatv7hDAdxFNRo6nf5cREtPVPwF`
with 2+ SOL then:
```
cd anchor && anchor program deploy --url devnet target/deploy/solar_program.so
```
Then update `DEVNET_RPC` in `constants.ts` to `https://api.devnet.solana.com`.

### NFT metadata uses placeholder URI
`mintCNFT.ts` passes a static metadata URI. Real mints need per-rarity JSON
uploaded to Arweave/IPFS first. Wire `@metaplex-foundation/umi-uploader-irys`
before a production release.

### OwnedNFT store is in-memory only
`addOwnedNFT` / `getOwnedNFTs` in `rpc.ts` use a module-level array.
NFTs are lost on app restart. Replace with AsyncStorage or a proper
chain-event indexer (Helius webhooks) for production.

## Deferred

- iOS support (requires ARKit + macOS Xcode build)
- Mainnet deployment
- Sound effects (react-native-sound + audio assets needed)
- x86_64 emulator AR support (no ViroReact renderer available)
- Push notifications (Firebase Cloud Messaging)
- Creator analytics dashboard (6th screen)
