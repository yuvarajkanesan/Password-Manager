import { createDocument, openDocument, readFile } from 'react-native-saf-x';
import type { EncryptedBlob } from '../types/vault';

// Backups are the raw encrypted blob (salt/iv/cipher/mac), never decrypted plaintext —
// the exported file is only ever as sensitive as an attacker also knowing the master
// password, same as the on-device vault itself.

function backupFilename(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `SecureVault-Backup-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}.svault`;
}

// Returns true if saved, false if the user cancelled the save-location picker.
export async function exportBackupBlob(blob: EncryptedBlob): Promise<boolean> {
  const result = await createDocument(JSON.stringify(blob), {
    initialName: backupFilename(),
    mimeType: 'application/json',
    encoding: 'utf8',
  });
  return result !== null;
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
