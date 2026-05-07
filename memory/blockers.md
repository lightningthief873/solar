# Blockers and Known Issues

## Resolved

### libvrapi.so 16KB page alignment (FIXED)
Android 15 (API 35+) emulators require PT_LOAD segments to be 16KB-aligned.
ViroReact's bundled libvrapi.so has misaligned segments. Fixed by replacing
with an NDK-compiled stub (all vrapi_ symbols as no-ops, -nostdlib, patched
ELF offsets to 16KB boundaries). The real ARM64 device is unaffected.
Fix location: viro_renderer-release.aar in node_modules (patched in place).

### Metro WSL2 tunnel (WORKAROUND)
adb reverse tcp:8081 tcp:8081 does not bridge WSL2→Windows→Emulator.
Workaround: bundle JS into APK assets with `npx react-native bundle` before
assembleDebug. Metro hot reload is not available on the emulator.
For hot reload on a real ARM64 device: `adb reverse` works fine over USB.

### ABI: x86_64 emulators (ACCEPTED)
ViroReact has no x86_64 native renderer. Only arm64-v8a builds are supported.
API 33 emulators (x86_64 only) cannot install our APK.
API 37 emulators (x86_64 + arm64 via Berberis) work with the patched lib.
Real ARM64 devices work without any workaround.

## Active

### Devnet SOL — deploy blocked (2026-05-07)
All airdrop methods rate-limited (CLI, direct RPC, faucet.solana.com requires GitHub auth).
Wallet: 8R1fJhGaUH5JovHLYgatv7hDAdxFNRo6nf5cREtPVPwF
Fix: use faucet.solana.com manually in a browser with GitHub login, then re-run:
  cd anchor && anchor deploy
After deploy, save program ID to memory/decisions.md.

## Pre-Emptive Risks

### MWA on Emulator
MWA requires a wallet app installed on the emulator device.
Before Prompt 3: sideload Phantom or Ultimate Wallet APK via:
  adb install phantom.apk
Get the APK from the official Phantom GitHub releases.

### Bubblegum v2 Merkle Tree
A Merkle tree must be created before any cNFT can be minted.
Create it once in seedDrops.ts using createTree() from mpl-bubblegum.
Save the tree address in decisions.md — it persists on Devnet.

### Metro on Real Device
For hot reload on a real phone connected via USB:
  adb reverse tcp:8081 tcp:8081  # works on USB, not emulator
  npx react-native start --port 8081
Then open the app — it will auto-connect.

## Deferred (out of scope for hackathon)

- iOS support (ARKit)
- Mainnet deployment
- x86_64 emulator full AR support
