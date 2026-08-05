import { createDocument, openDocument, readFile, writeFile } from 'react-native-saf-x';
import RNFS from 'react-native-fs';
import { getManualBackupFileUri, setManualBackupFileUri } from '../storage/vaultStorage';
import type { EncryptedBlob } from '../types/vault';

// Backups are the raw encrypted blob (salt/iv/cipher/mac), never decrypted plaintext —
// a backup file is only ever as sensitive as an attacker also knowing the master
// password, same as the on-device vault itself.

const BACKUP_FILENAME = 'SecureVault-Backup.svault';

// "Export backup": one file, remembered. The first export prompts the system save
// picker; every export after that silently overwrites the exact same file — no picker,
// no pile of dated copies. If the remembered file becomes unwritable (moved, deleted,
// storage provider access revoked), falls back to re-prompting and remembers whatever
// new location the user picks.
export async function exportBackupBlob(blob: EncryptedBlob): Promise<boolean> {
  const data = JSON.stringify(blob);
  const existingUri = await getManualBackupFileUri();

  if (existingUri) {
    try {
      await writeFile(existingUri, data, { encoding: 'utf8' });
      return true;
    } catch {
      // Fall through to re-prompt below.
    }
  }

  const result = await createDocument(data, {
    initialName: BACKUP_FILENAME,
    mimeType: 'application/json',
    encoding: 'utf8',
  });
  if (!result) return false;
  await setManualBackupFileUri(result.uri);
  return true;
}

// Lets the next export pick a fresh location instead of overwriting the remembered one.
export async function forgetManualBackupLocation(): Promise<void> {
  await setManualBackupFileUri(null);
}

export class InvalidBackupError extends Error {
  constructor() {
    super('This file is not a valid SecureVault backup.');
    this.name = 'InvalidBackupError';
  }
}

function isEncryptedBlob(value: any): value is EncryptedBlob {
  return (
    value &&
    typeof value.salt === 'string' &&
    typeof value.iv === 'string' &&
    typeof value.cipher === 'string' &&
    typeof value.mac === 'string' &&
    typeof value.iterations === 'number'
  );
}

// Returns null if the user cancelled the file picker.
export async function importBackupBlob(): Promise<EncryptedBlob | null> {
  const picked = await openDocument({ multiple: false, persist: false });
  if (!picked || picked.length === 0) return null;

  const content = await readFile(picked[0].uri, { encoding: 'utf8' });
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new InvalidBackupError();
  }
  if (!isEncryptedBlob(parsed)) throw new InvalidBackupError();
  return parsed;
}

// Auto-backup deliberately lives in the app's private storage (RNFS.DocumentDirectoryPath
// — Android's app-sandboxed internal storage), not a SAF-picked shared folder: nothing
// else on the device, no other app, can read or even see this file exists. The tradeoff
// is that it does NOT survive an uninstall (Android wipes private storage with the app) —
// that's what "Export backup" is for. One rolling file, overwritten every cycle.
const AUTO_BACKUP_PATH = `${RNFS.DocumentDirectoryPath}/SecureVault-AutoBackup.svault`;

export async function writeAutoBackupBlob(blob: EncryptedBlob): Promise<void> {
  await RNFS.writeFile(AUTO_BACKUP_PATH, JSON.stringify(blob), 'utf8');
}
