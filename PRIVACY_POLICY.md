# Privacy Policy for SecureVault

**Last updated: August 4, 2026**

SecureVault ("the app", "we", "us") is a password and card manager developed by Yuvaraj Kanesan. This policy explains what happens to your data when you use it.

## The short version

SecureVault has no server, no account system, and no internet access. Everything you save stays encrypted on your device, and nothing is ever transmitted anywhere. That's not a promise — it's enforced at the operating-system level: the app's release build does not request the Android `INTERNET` permission at all, so it is technically incapable of sending data over a network.

## What data the app handles, and where it stays

| Data | Where it's stored | Ever leaves your device? |
|---|---|---|
| Passwords, usernames, notes you save | Encrypted (AES-256) on-device storage | No |
| Card numbers, expiry, CVV, PIN you save | Encrypted (AES-256) on-device storage | No |
| Your master password | Never stored in plaintext anywhere. Used only in memory to derive an encryption key (PBKDF2), which is discarded when the app locks | No |
| Backup files you export | Written only to a location you explicitly choose via Android's file picker | Only if you personally move or share that file yourself — the app does not upload it anywhere |

Encryption: all saved entries are encrypted with AES-256-CBC using a key derived from your master password via PBKDF2. The app itself cannot decrypt your data without the master password, and there is no "forgot password" recovery — this is by design, the same tradeoff every offline, zero-knowledge password manager makes.

## Permissions the app requests, and exactly why

- **Camera** — used only for the optional "scan card" shortcut when adding a card. The photo is processed on-device by Google ML Kit's on-device text recognition (no image or extracted text is ever sent to Google's or anyone else's servers) and the temporary photo file is deleted immediately after processing. Nothing from a scan is stored beyond the card fields you review and choose to save.
- **Biometric unlock (fingerprint/face)** — if you enable it, unlocking uses Android's own BiometricPrompt system. Your fingerprint or face data is handled entirely by the Android OS and device hardware; the app never receives, sees, or stores biometric data itself.
- No other permissions are requested. There is no location, contacts, microphone, or storage-wide access, and (as above) no internet access.

## Third-party services

The only third-party component involved is **Google ML Kit's on-device Text Recognition**, used solely for the card-scan feature described above. It runs locally on your device and does not transmit data to Google. We do not use analytics, crash reporting, ads, or any other third-party SDK.

## Backups

The "Export backup" feature saves an encrypted copy of your vault to a file you choose via the system file picker. This file is exactly as encrypted as your on-device vault — it's only ever readable with your master password. Where you store or share that file afterward (a cloud drive, email, USB stick) is entirely your choice and outside the app's control.

## Data deletion

Because everything lives only on your device:
- Using "Erase vault" in Settings permanently deletes everything immediately.
- Uninstalling the app deletes everything (the app does not use Android's auto-backup, so no copy survives an uninstall unless you exported one yourself).
- There is no server-side copy to request deletion of, because none exists.

## Children's privacy

SecureVault is not directed at children under 13 and does not knowingly collect data from anyone, regardless of age — it doesn't collect data from anyone at all, by design.

## Security measures

In addition to AES-256 encryption of stored data, the app's release build: blocks screenshots and screen recording while open, refuses to run if USB debugging or a debugger is detected, refuses to run on rooted devices, and disables the Android Autofill framework on sensitive fields. No security measure is perfect, and this policy doesn't constitute a guarantee against all possible attacks — only a description of what protections are in place.

## Changes to this policy

If this policy changes, the "Last updated" date above will change accordingly. Continued use of the app after an update constitutes acceptance of the revised policy.

## Contact

Questions about this policy: **yuvaraj8747@gmail.com**
