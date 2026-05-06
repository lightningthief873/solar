# Blockers and Known Issues

## Active

None.

## Pre-Emptive Risks

### ViroReact Windows Build

ViroReact requires CMake + NDK. On Windows this triggers VS C++ build tools.
If build fails with "CMake not found": open Android Studio SDK Manager,
install CMake 3.22.x explicitly, then retry.

### ARCore in Emulator

Needs: Google Play system image + Hardware GLES 2.0 in AVD config.
Symptom if misconfigured: black AR view with no error.
Fix: recreate AVD with "Google Play" image (not "Google APIs" — different).

### MWA on Emulator

MWA requires a wallet app installed on the emulator device.
Before Prompt 3: sideload Phantom or Ultimate Wallet APK via:
  adb install phantom.apk
Get the APK from the official Phantom GitHub releases.

### Bubblegum v2 Merkle Tree

A Merkle tree must be created before any cNFT can be minted.
Create it once in seedDrops.ts using createTree() from mpl-bubblegum.
Save the tree address in decisions.md — it persists on Devnet.

### Windows Path Separators

All paths in TypeScript/JS code must use forward slashes.
Backslashes in require() or import paths will break the bundler.

### Node 24 + Gradle

If Gradle complains about Node version, pin engines in package.json:
  "engines": { "node": ">=18" }
This doesn't downgrade Node, it just silences the check.

## Deferred (out of scope for hackathon)

- iOS support (ARKit)
- Mainnet deployment
- dApp Store submission
- Push notifications for nearby drops
- Secondary market trading UI
- Anti-spoofing GPS verification (production concern)
