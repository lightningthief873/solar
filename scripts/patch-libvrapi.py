#!/usr/bin/env python3
"""
Patch libvrapi.so inside viro_renderer-release.aar so all PT_LOAD segment
file offsets are 16KB-aligned (required by Android 15 / API 35+ / 16KB page size devices).
Run automatically via postinstall in package.json.
"""
import struct, zipfile, shutil, subprocess, sys, os, tempfile

PAGE = 16384
REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AAR = os.path.join(REPO_ROOT, "node_modules/@reactvision/react-viro/android/viro_renderer/viro_renderer-release.aar")
NDK_VER = "27.1.12297006"

def find_clang():
    sdk = os.environ.get("ANDROID_HOME") or os.environ.get("ANDROID_SDK_ROOT", "")
    candidate = os.path.join(sdk, f"ndk/{NDK_VER}/toolchains/llvm/prebuilt/linux-x86_64/bin/aarch64-linux-android24-clang")
    if os.path.exists(candidate):
        return candidate
    sys.exit(f"[patch-libvrapi] NDK clang not found at {candidate}")

def compile_stub(clang):
    src = tempfile.NamedTemporaryFile(suffix=".c", delete=False, mode="w")
    syms = [
        "vrapi_Initialize","vrapi_Shutdown","vrapi_EnterVrMode","vrapi_LeaveVrMode",
        "vrapi_GetSystemPropertyInt","vrapi_GetSystemPropertyFloat","vrapi_GetSystemPropertyString",
        "vrapi_GetSystemStatus","vrapi_SetDisplayRefreshRate","vrapi_GetPredictedDisplayTime",
        "vrapi_GetPredictedTracking2","vrapi_GetPredictedTracking","vrapi_GetTrackingSpace",
        "vrapi_SetTrackingSpace","vrapi_GetTrackingTransform","vrapi_SetTrackingTransform",
        "vrapi_RecenterInputPose","vrapi_GetBoundaryOrientedBoundingBox","vrapi_TestPointIsInBoundary",
        "vrapi_GetBoundaryGeometry","vrapi_GetBoundaryVisible","vrapi_RequestBoundaryVisible",
        "vrapi_GetHandPose","vrapi_GetInputDeviceCapabilities","vrapi_EnumerateInputDevices",
        "vrapi_GetCurrentInputState","vrapi_SetHapticVibrationSimple","vrapi_SetHapticVibrationBuffer",
        "vrapi_SubmitFrame2","vrapi_SubmitFrame","vrapi_CreateTextureSwapChain",
        "vrapi_CreateTextureSwapChain2","vrapi_CreateTextureSwapChain3",
        "vrapi_CreateAndroidSurfaceSwapChain","vrapi_CreateAndroidSurfaceSwapChain2",
        "vrapi_DestroyTextureSwapChain","vrapi_GetTextureSwapChainLength",
        "vrapi_GetTextureSwapChainHandle","vrapi_GetTextureSwapChainBufferFB",
        "vrapi_SetPropertyInt","vrapi_SetPropertyFloat","vrapi_GetPropertyFloat","vrapi_GetPropertyInt",
    ]
    for s in syms:
        src.write(f"void {s}(void){{}}\n")
    src.close()
    out = tempfile.NamedTemporaryFile(suffix=".so", delete=False)
    out.close()
    subprocess.run([clang, "-shared", "-fPIC", "-nostdlib",
                    "-Wl,-z,max-page-size=16384", "-Wl,-z,common-page-size=16384",
                    "-target", "aarch64-linux-android24",
                    "-o", out.name, src.name], check=True)
    os.unlink(src.name)
    return out.name

def align_elf(so_path):
    with open(so_path, "rb") as f:
        orig = bytes(f.read())
    e_phoff = struct.unpack_from("<Q", orig, 32)[0]
    e_phnum = struct.unpack_from("<H", orig, 56)[0]
    e_shoff = struct.unpack_from("<Q", orig, 40)[0]
    phdrs = []
    for i in range(e_phnum):
        base = e_phoff + i * 56
        vals = struct.unpack_from("<IIQQQQQQ", orig, base)
        phdrs.append({"type": vals[0], "offset": vals[2], "base": base, "idx": i})
    loads = sorted([h for h in phdrs if h["type"] == 1], key=lambda h: h["offset"])
    shift = 0
    insertions, new_offsets = [], {}
    for h in loads:
        actual = h["offset"] + shift
        pad = (PAGE - actual % PAGE) % PAGE
        new_offsets[h["idx"]] = actual + pad
        if pad:
            insertions.append((h["offset"], pad))
            shift += pad
    if not insertions:
        return so_path
    new_data = bytearray()
    pos = 0
    for ins_pos, pad in insertions:
        new_data += orig[pos:ins_pos]
        new_data += bytes(pad)
        pos = ins_pos
    new_data += orig[pos:]
    if e_shoff:
        sh_shift = sum(p for (ip, p) in insertions if ip <= e_shoff)
        struct.pack_into("<Q", new_data, 40, e_shoff + sh_shift)
    for h in loads:
        struct.pack_into("<Q", new_data, h["base"] + 8, new_offsets[h["idx"]])
    patched = so_path + ".patched"
    with open(patched, "wb") as f:
        f.write(new_data)
    return patched

def inject_into_aar(so_path):
    tmp = AAR + ".tmp"
    with zipfile.ZipFile(AAR, "r") as zin, zipfile.ZipFile(tmp, "w", zipfile.ZIP_STORED) as zout:
        for item in zin.infolist():
            if item.filename == "jni/arm64-v8a/libvrapi.so":
                with open(so_path, "rb") as f:
                    zout.writestr(item, f.read())
            else:
                zout.writestr(item, zin.read(item.filename))
    shutil.move(tmp, AAR)

if __name__ == "__main__":
    print("[patch-libvrapi] Compiling 16KB-aligned stub...")
    clang = find_clang()
    raw = compile_stub(clang)
    patched = align_elf(raw)
    inject_into_aar(patched)
    os.unlink(raw)
    if patched != raw:
        os.unlink(patched)
    print("[patch-libvrapi] Done — libvrapi.so patched in AAR")
