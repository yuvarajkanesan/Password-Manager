import AsyncStorage from '@react-native-async-storage/async-storage';
import type { EncryptedBlob } from '../types/vault';

const BLOB_KEY = 'vault_blob_v1';
const BIOMETRIC_ENABLED_KEY = 'biometric_unlock_enabled';
const AUTO_LOCK_KEY = 'auto_lock_minutes';

export async function saveEncryptedBlob(blob: EncryptedBlob): Promise<void> {
  await AsyncStorage.setItem(BLOB_KEY, JSON.stringify(blob));
}

export async function loadEncryptedBlob(): Promise<EncryptedBlob | null> {
  const raw = await AsyncStorage.getItem(BLOB_KEY);
  return raw ? (JSON.parse(raw) as EncryptedBlob) : null;
}

export async function hasVault(): Promise<boolean> {
  return (await AsyncStorage.getItem(BLOB_KEY)) !== null;
}

export async function wipeVault(): Promise<void> {
  await AsyncStorage.removeMany([BLOB_KEY, BIOMETRIC_ENABLED_KEY, AUTO_LOCK_KEY]);
}

export async function setBiometricEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, enabled ? '1' : '0');
}

export async function getBiometricEnabled(): Promise<boolean> {
  return (await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY)) === '1';
}

// 0 means "never" (no auto-lock on background).
export async function setAutoLockMinutes(minutes: number): Promise<void> {
  await AsyncStorage.setItem(AUTO_LOCK_KEY, String(minutes));
}

export async function getAutoLockMinutes(): Promise<number> {
  const raw = await AsyncStorage.getItem(AUTO_LOCK_KEY);
  return raw ? Number(raw) : 1;
}
