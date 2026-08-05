package com.securevault

import android.content.pm.ApplicationInfo
import android.os.Build
import android.os.Debug
import android.provider.Settings
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.io.File

// Vault-integrity checks, gated to release builds only — none of this should ever block
// our own debug/dev workflow (adb install requires USB debugging to be on).
class SecurityModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
  override fun getName() = "SecurityCheck"

  // Same root heuristics as before: known su binary paths, known root-manager packages,
  // and the "test-keys" build tag official OTA builds never carry. A positive hit is a
  // deterrent/warning, not a hard boundary — nothing client-side can truly stop a
  // sufficiently determined attacker on their own rooted device.
  @ReactMethod
  fun isDeviceRooted(promise: Promise) {
    promise.resolve(hasRootBinary() || hasRootPackage() || hasTestKeysBuildTag())
  }

  private fun hasRootBinary(): Boolean {
    val paths = arrayOf(
      "/system/bin/su", "/system/xbin/su", "/sbin/su",
      "/system/su", "/su/bin/su", "/system/bin/.ext/.su",
      "/system/usr/we-need-root/su-backup", "/data/local/xbin/su",
      "/data/local/bin/su", "/data/local/su"
    )
    return paths.any { File(it).exists() }
  }

  private fun hasRootPackage(): Boolean {
    val packages = arrayOf(
      "com.topjohnwu.magisk", "eu.chainfire.supersu", "com.noshufou.android.su",
      "com.noshufou.android.su.elite", "com.koushikdutta.superuser",
      "com.thirdparty.superuser", "com.yellowes.su", "com.kingroot.kingmaster",
      "com.kingo.root", "com.smedialink.oneclickroot"
    )
    return packages.any { isPackageInstalledSync(it) }
  }

  private fun isPackageInstalledSync(packageName: String): Boolean {
    return try {
      reactApplicationContext.packageManager.getPackageInfo(packageName, 0)
      true
    } catch (e: Exception) {
      false
    }
  }

  private fun hasTestKeysBuildTag(): Boolean {
    val tags = Build.TAGS
    return tags != null && tags.contains("test-keys")
  }

  // In a release build the app is expected to be non-debuggable with no debugger
  // attached and no live USB-debugging bridge to it — any of those on a *release*
  // build points at a repackaged/tampered APK rather than a normal user device.
  // Always false in debug builds so this never gets in the way of development.
  // Also gated behind ENFORCE_DEBUG_CHECK (see gradle.properties) so a release build
  // can be installed and tested over adb without the app immediately refusing to run —
  // that flag MUST be back to true before any real production release.
  @ReactMethod
  fun isDebuggingEnabled(promise: Promise) {
    if (BuildConfig.DEBUG || !BuildConfig.ENFORCE_DEBUG_CHECK) {
      promise.resolve(false)
      return
    }

    val appIsDebuggable =
      (reactApplicationContext.applicationInfo.flags and ApplicationInfo.FLAG_DEBUGGABLE) != 0
    val debuggerAttached = Debug.isDebuggerConnected() || Debug.waitingForDebugger()
    val adbEnabled = try {
      Settings.Global.getInt(reactApplicationContext.contentResolver, Settings.Global.ADB_ENABLED, 0) == 1
    } catch (e: Exception) {
      false
    }

    promise.resolve(appIsDebuggable || debuggerAttached || adbEnabled)
  }
}
