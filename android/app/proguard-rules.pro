# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:

# Defensive keep for our own native modules: JS calls these bridge methods by string
# name (e.g. NativeModules.SecurityCheck.isDeviceRooted()), so R8 renaming/stripping
# them would silently break the bridge at runtime with no compile-time warning.
-keep class com.securevault.SecurityModule { *; }
-keep class com.securevault.SecurityPackage { *; }
-keepclassmembers class * extends com.facebook.react.bridge.ReactContextBaseJavaModule {
    @com.facebook.react.bridge.ReactMethod <methods>;
}
