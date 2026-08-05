import AsyncStorage from '@react-native-async-storage/async-storage';
import type { EncryptedBlob } from '../types/vault';

const BLOB_KEY = 'vault_blob_v1';
const BIOMETRIC_ENABLED_KEY = 'biometric_unlock_enabled';
const AUTO_LOCK_KEY = 'auto_lock_minutes';
const AUTO_BACKUP_ENABLED_KEY = 'auto_backup_enabled';
const AUTO_BACKUP_INTERVAL_KEY = 'auto_backup_interval_days';
const AUTO_BACKUP_LAST_RUN_KEY = 'auto_backup_last_run_at';
const MANUAL_BACKUP_FILE_KEY = 'manual_backup_file_uri';

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
  await AsyncStorage.removeMany([
    BLOB_KEY,
    BIOMETRIC_ENABLED_KEY,
    AUTO_LOCK_KEY,
    AUTO_BACKUP_ENABLED_KEY,
    AUTO_BACKUP_INTERVAL_KEY,
    AUTO_BACKUP_LAST_RUN_KEY,
    MANUAL_BACKUP_FILE_KEY,
  ]);
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

export async function setAutoBackupEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(AUTO_BACKUP_ENABLED_KEY, enabled ? '1' : '0');
}

export async function getAutoBackupEnabled(): Promise<boolean> {
  return (await AsyncStorage.getItem(AUTO_BACKUP_ENABLED_KEY)) === '1';
}

// In days: 1 = daily, 7 = weekly, 30 = monthly.
export async function setAutoBackupIntervalDays(days: number): Promise<void> {
  await AsyncStorage.setItem(AUTO_BACKUP_INTERVAL_KEY, String(days));
}

export async function getAutoBackupIntervalDays(): Promise<number> {
  const raw = await AsyncStorage.getItem(AUTO_BACKUP_INTERVAL_KEY);
  return raw ? Number(raw) : 7;
}

export async function setLastAutoBackupAt(timestamp: number): Promise<void> {
  await AsyncStorage.setItem(AUTO_BACKUP_LAST_RUN_KEY, String(timestamp));
}

export async function getLastAutoBackupAt(): Promise<number> {
  const raw = await AsyncStorage.getItem(AUTO_BACKUP_LAST_RUN_KEY);
  return raw ? Number(raw) : 0;
}

// Remembers the exact file "Export backup" last wrote to, so repeat exports silently
// overwrite that same file instead of prompting a new save-location each time and
// scattering copies around. Cleared to re-prompt if a write to it ever fails (moved,
// deleted, or the storage provider revoked access).
export async function setManualBackupFileUri(uri: string | null): Promise<void> {
  if (uri) await AsyncStorage.setItem(MANUAL_BACKUP_FILE_KEY, uri);
  else await AsyncStorage.removeItem(MANUAL_BACKUP_FILE_KEY);
}

export async function getManualBackupFileUri(): Promise<string | null> {
  return AsyncStorage.getItem(MANUAL_BACKUP_FILE_KEY);
}
