import * as Keychain from 'react-native-keychain';

const SERVICE = 'com.securevault.masterkey';

// The master password itself is stashed here, gated behind the device's biometric
// prompt. This is only ever written *after* the user has proven they know the master
// password once — it's a convenience unlock, not a replacement for it. The vault's
// AES key is still derived fresh from whatever password comes out of this (or the
// keyboard) every time; nothing about the encryption changes based on how the
// password was obtained.
export async function storeBiometricPassword(masterPassword: string): Promise<boolean> {
  const result = await Keychain.setGenericPassword('master', masterPassword, {
    service: SERVICE,
    accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    storage: Keychain.STORAGE_TYPE.AES_GCM,
  });
  return result !== false;
}

// Triggers the OS biometric prompt. Returns null if the user cancels, fails, or no
// password was ever stored (caller should fall back to manual master-password entry).
export async function getBiometricPassword(promptMessage = 'Unlock SecureVault'): Promise<string | null> {
  try {
    const creds = await Keychain.getGenericPassword({
      service: SERVICE,
      authenticationPrompt: { title: promptMessage },
    });
    return creds ? creds.password : null;
  } catch {
    return null;
  }
}

export async function hasBiometricPassword(): Promise<boolean> {
  return Keychain.hasGenericPassword({ service: SERVICE });
}

export async function clearBiometricPassword(): Promise<void> {
  await Keychain.resetGenericPassword({ service: SERVICE });
}

export async function isBiometrySupported(): Promise<boolean> {
  const type = await Keychain.getSupportedBiometryType();
  return type !== null;
}
