import Aes from 'react-native-aes-crypto';
import type { EncryptedBlob, VaultData } from '../types/vault';

const PBKDF2_ITERATIONS = 10000;
const KEY_LENGTH = 256;
const ALGO = 'aes-256-cbc';

// Derives a 256-bit AES key from the master password + a per-vault salt.
// Never persisted — recomputed on every unlock from the typed password.
export async function deriveKey(masterPassword: string, salt: string, iterations = PBKDF2_ITERATIONS): Promise<string> {
  return Aes.pbkdf2(masterPassword, salt, iterations, KEY_LENGTH, 'sha256');
}

export async function generateSalt(): Promise<string> {
  return Aes.randomKey(16);
}

// Encrypts the whole vault as one JSON blob. An HMAC of the ciphertext (keyed with
// the same derived key) is stored alongside it so `unlock` can detect a wrong master
// password / tampered file before trying to JSON.parse garbage plaintext.
export async function encryptVault(data: VaultData, key: string, salt: string, iterations: number): Promise<EncryptedBlob> {
  const iv = await Aes.randomKey(16);
  const cipher = await Aes.encrypt(JSON.stringify(data), key, iv, ALGO);
  const mac = await Aes.hmac256(cipher, key);
  return { salt, iv, cipher, mac, iterations };
}

export class WrongPasswordError extends Error {
  constructor() {
    super('Incorrect master password');
    this.name = 'WrongPasswordError';
  }
}

export async function decryptVault(blob: EncryptedBlob, key: string): Promise<VaultData> {
  const expectedMac = await Aes.hmac256(blob.cipher, key);
  if (expectedMac !== blob.mac) {
    throw new WrongPasswordError();
  }
  const plaintext = await Aes.decrypt(blob.cipher, key, blob.iv, ALGO);
  return JSON.parse(plaintext) as VaultData;
}

export { PBKDF2_ITERATIONS };
