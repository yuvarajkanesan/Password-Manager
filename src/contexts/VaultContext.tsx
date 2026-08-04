import React, { createContext, useContext, useState, useRef, useCallback, useEffect, ReactNode } from 'react';
import type { VaultEntry, CardEntry, VaultData, EncryptedBlob } from '../types/vault';
import { deriveKey, generateSalt, encryptVault, decryptVault, WrongPasswordError, PBKDF2_ITERATIONS } from '../crypto/vaultCrypto';
import { saveEncryptedBlob, loadEncryptedBlob, hasVault, wipeVault } from '../storage/vaultStorage';
import { storeBiometricPassword, clearBiometricPassword } from '../storage/biometricStore';
import { setBiometricEnabled as persistBiometricEnabled } from '../storage/vaultStorage';
import { exportBackupBlob, importBackupBlob } from '../utils/backup';

export type VaultState = 'loading' | 'no-vault' | 'locked' | 'unlocked';

type VaultContextValue = {
  state: VaultState;
  entries: VaultEntry[];
  cards: CardEntry[];
  setupVault: (masterPassword: string) => Promise<void>;
  unlock: (masterPassword: string) => Promise<boolean>;
  lock: () => void;
  exportBackup: () => Promise<boolean>;
  restoreFromBackup: () => Promise<boolean>;
  addEntry: (entry: Omit<VaultEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateEntry: (id: string, patch: Partial<Omit<VaultEntry, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  addCard: (card: Omit<CardEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateCard: (id: string, patch: Partial<Omit<CardEntry, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;
  changeMasterPassword: (oldPassword: string, newPassword: string) => Promise<boolean>;
  enableBiometricUnlock: (masterPassword: string) => Promise<void>;
  disableBiometricUnlock: () => Promise<void>;
  resetVault: () => Promise<void>;
};

const VaultContext = createContext<VaultContextValue | null>(null);

function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function VaultProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<VaultState>('loading');
  const [entries, setEntries] = useState<VaultEntry[]>([]);
  const [cards, setCards] = useState<CardEntry[]>([]);
  const keyRef = useRef<string | null>(null);
  const blobMetaRef = useRef<{ salt: string; iterations: number } | null>(null);
  // Mirrors the two state arrays so `persist` can always encrypt a full, current
  // snapshot of both without depending on stale closures over `entries`/`cards`.
  const dataRef = useRef<VaultData>({ entries: [], cards: [] });

  useEffect(() => {
    hasVault().then(exists => setState(exists ? 'locked' : 'no-vault'));
  }, []);

  const persist = useCallback(async () => {
    if (!keyRef.current || !blobMetaRef.current) return;
    const blob = await encryptVault(dataRef.current, keyRef.current, blobMetaRef.current.salt, blobMetaRef.current.iterations);
    await saveEncryptedBlob(blob);
  }, []);

  const setupVault = useCallback(async (masterPassword: string) => {
    const salt = await generateSalt();
    const key = await deriveKey(masterPassword, salt);
    const empty: VaultData = { entries: [], cards: [] };
    const blob = await encryptVault(empty, key, salt, PBKDF2_ITERATIONS);
    await saveEncryptedBlob(blob);
    keyRef.current = key;
    blobMetaRef.current = { salt, iterations: PBKDF2_ITERATIONS };
    dataRef.current = empty;
    setEntries([]);
    setCards([]);
    setState('unlocked');
  }, []);

  const unlockWithBlob = useCallback(async (masterPassword: string, blob: EncryptedBlob) => {
    const key = await deriveKey(masterPassword, blob.salt, blob.iterations);
    try {
      const data = await decryptVault(blob, key);
      const normalized: VaultData = { entries: data.entries ?? [], cards: data.cards ?? [] };
      keyRef.current = key;
      blobMetaRef.current = { salt: blob.salt, iterations: blob.iterations };
      dataRef.current = normalized;
      setEntries(normalized.entries);
      setCards(normalized.cards);
      setState('unlocked');
      return true;
    } catch (e) {
      if (e instanceof WrongPasswordError) return false;
      throw e;
    }
  }, []);

  const unlock = useCallback(async (masterPassword: string) => {
    const blob = await loadEncryptedBlob();
    if (!blob) return false;
    return unlockWithBlob(masterPassword, blob);
  }, [unlockWithBlob]);

  const lock = useCallback(() => {
    keyRef.current = null;
    blobMetaRef.current = null;
    dataRef.current = { entries: [], cards: [] };
    setEntries([]);
    setCards([]);
    setState('locked');
  }, []);

  const addEntry = useCallback(async (entry: Omit<VaultEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = Date.now();
    const newEntry: VaultEntry = { ...entry, id: makeId(), createdAt: now, updatedAt: now };
    const next = [...dataRef.current.entries, newEntry];
    dataRef.current = { ...dataRef.current, entries: next };
    setEntries(next);
    await persist();
  }, [persist]);

  const updateEntry = useCallback(async (id: string, patch: Partial<Omit<VaultEntry, 'id' | 'createdAt' | 'updatedAt'>>) => {
    const next = dataRef.current.entries.map(e => (e.id === id ? { ...e, ...patch, updatedAt: Date.now() } : e));
    dataRef.current = { ...dataRef.current, entries: next };
    setEntries(next);
    await persist();
  }, [persist]);

  const deleteEntry = useCallback(async (id: string) => {
    const next = dataRef.current.entries.filter(e => e.id !== id);
    dataRef.current = { ...dataRef.current, entries: next };
    setEntries(next);
    await persist();
  }, [persist]);

  const addCard = useCallback(async (card: Omit<CardEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = Date.now();
    const newCard: CardEntry = { ...card, id: makeId(), createdAt: now, updatedAt: now };
    const next = [...dataRef.current.cards, newCard];
    dataRef.current = { ...dataRef.current, cards: next };
    setCards(next);
    await persist();
  }, [persist]);

  const updateCard = useCallback(async (id: string, patch: Partial<Omit<CardEntry, 'id' | 'createdAt' | 'updatedAt'>>) => {
    const next = dataRef.current.cards.map(c => (c.id === id ? { ...c, ...patch, updatedAt: Date.now() } : c));
    dataRef.current = { ...dataRef.current, cards: next };
    setCards(next);
    await persist();
  }, [persist]);

  const deleteCard = useCallback(async (id: string) => {
    const next = dataRef.current.cards.filter(c => c.id !== id);
    dataRef.current = { ...dataRef.current, cards: next };
    setCards(next);
    await persist();
  }, [persist]);

  const changeMasterPassword = useCallback(async (oldPassword: string, newPassword: string) => {
    const blob = await loadEncryptedBlob();
    if (!blob) return false;
    const oldKey = await deriveKey(oldPassword, blob.salt, blob.iterations);
    let data: VaultData;
    try {
      const decrypted = await decryptVault(blob, oldKey);
      data = { entries: decrypted.entries ?? [], cards: decrypted.cards ?? [] };
    } catch (e) {
      if (e instanceof WrongPasswordError) return false;
      throw e;
    }
    const newSalt = await generateSalt();
    const newKey = await deriveKey(newPassword, newSalt);
    const newBlob = await encryptVault(data, newKey, newSalt, PBKDF2_ITERATIONS);
    await saveEncryptedBlob(newBlob);
    keyRef.current = newKey;
    blobMetaRef.current = { salt: newSalt, iterations: PBKDF2_ITERATIONS };
    dataRef.current = data;
    setEntries(data.entries);
    setCards(data.cards);
    return true;
  }, []);

  const enableBiometricUnlock = useCallback(async (masterPassword: string) => {
    await storeBiometricPassword(masterPassword);
    await persistBiometricEnabled(true);
  }, []);

  const disableBiometricUnlock = useCallback(async () => {
    await clearBiometricPassword();
    await persistBiometricEnabled(false);
  }, []);

  const resetVault = useCallback(async () => {
    await wipeVault();
    await clearBiometricPassword();
    keyRef.current = null;
    blobMetaRef.current = null;
    dataRef.current = { entries: [], cards: [] };
    setEntries([]);
    setCards([]);
    setState('no-vault');
  }, []);

  // Exports the raw encrypted blob currently on disk — never decrypted plaintext — so
  // an exported backup is only ever as sensitive as also knowing the master password.
  const exportBackup = useCallback(async () => {
    const blob = await loadEncryptedBlob();
    if (!blob) return false;
    return exportBackupBlob(blob);
  }, []);

  // Overwrites the on-device vault with an imported backup blob and drops to the lock
  // screen so the user re-unlocks with whatever master password that backup was
  // encrypted under — works whether called from Settings (vault already existed) or
  // from the no-vault/first-run screen after a fresh reinstall.
  const restoreFromBackup = useCallback(async () => {
    const blob = await importBackupBlob();
    if (!blob) return false;
    await saveEncryptedBlob(blob);
    keyRef.current = null;
    blobMetaRef.current = null;
    dataRef.current = { entries: [], cards: [] };
    setEntries([]);
    setCards([]);
    setState('locked');
    return true;
  }, []);

  const value: VaultContextValue = {
    state,
    entries,
    cards,
    setupVault,
    unlock,
    lock,
    exportBackup,
    restoreFromBackup,
    addEntry,
    updateEntry,
    deleteEntry,
    addCard,
    updateCard,
    deleteCard,
    changeMasterPassword,
    enableBiometricUnlock,
    disableBiometricUnlock,
    resetVault,
  };

  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>;
}

export function useVault() {
  const ctx = useContext(VaultContext);
  if (!ctx) throw new Error('useVault must be used within VaultProvider');
  return ctx;
}
