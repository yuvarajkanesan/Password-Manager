import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Modal, Pressable } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, ThemeMode } from '../contexts/ThemeContext';
import { useVault } from '../contexts/VaultContext';
import TextField from '../components/TextField';
import Button from '../components/Button';
import ConfirmDialog from '../components/ConfirmDialog';
import {
  getBiometricEnabled,
  setAutoLockMinutes,
  getAutoLockMinutes,
  getAutoBackupEnabled,
  setAutoBackupEnabled,
  getAutoBackupIntervalDays,
  setAutoBackupIntervalDays,
  getLastAutoBackupAt,
  getManualBackupFileUri,
  setDisguiseCode,
} from '../storage/vaultStorage';
import { isBiometrySupported } from '../storage/biometricStore';
import { forgetManualBackupLocation } from '../utils/backup';
import LegalDocumentModal from './LegalDocumentModal';
import { PRIVACY_POLICY, TERMS_AND_CONDITIONS } from '../constants/legalContent';
import { RADIUS, elevation, contentBounds } from '../constants/theme';

const THEME_OPTIONS: ThemeMode[] = ['System', 'Light', 'Dark'];
const AUTO_LOCK_OPTIONS = [
  { label: 'Immediately', value: 0 },
  { label: '1 minute', value: 1 },
  { label: '5 minutes', value: 5 },
  { label: '15 minutes', value: 15 },
  { label: 'Never', value: -1 },
];
const AUTO_BACKUP_INTERVAL_OPTIONS = [
  { label: 'Daily', value: 1 },
  { label: 'Weekly', value: 7 },
  { label: 'Monthly', value: 30 },
];

function formatLastBackup(timestamp: number): string {
  if (!timestamp) return 'Never';
  const diffMs = Date.now() - timestamp;
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays} days ago`;
}

export default function SettingsScreen() {
  const { colors, themeMode, setThemeMode } = useTheme();
  const { changeMasterPassword, enableBiometricUnlock, disableBiometricUnlock, resetVault, lock, exportBackup, restoreFromBackup } = useVault();
  const insets = useSafeAreaInsets();

  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [autoLock, setAutoLock] = useState(1);
  const [changePwVisible, setChangePwVisible] = useState(false);
  const [enableBioVisible, setEnableBioVisible] = useState(false);
  const [resetVisible, setResetVisible] = useState(false);
  const [lockVisible, setLockVisible] = useState(false);
  const [autoLockPickerVisible, setAutoLockPickerVisible] = useState(false);
  const [restoreVisible, setRestoreVisible] = useState(false);
  const [backupBusy, setBackupBusy] = useState(false);
  const [backupNote, setBackupNote] = useState('');
  const [autoBackupEnabled, setAutoBackupEnabledState] = useState(false);
  const [autoBackupInterval, setAutoBackupInterval] = useState(7);
  const [lastAutoBackup, setLastAutoBackup] = useState(0);
  const [autoBackupIntervalPickerVisible, setAutoBackupIntervalPickerVisible] = useState(false);
  const [manualBackupFileSet, setManualBackupFileSet] = useState(false);
  const [privacyPolicyVisible, setPrivacyPolicyVisible] = useState(false);
  const [termsVisible, setTermsVisible] = useState(false);
  const [changeDisguiseVisible, setChangeDisguiseVisible] = useState(false);

  const refresh = useCallback(async () => {
    setBiometricEnabled(await getBiometricEnabled());
    setBiometricSupported(await isBiometrySupported());
    setAutoLock(await getAutoLockMinutes());
    setAutoBackupEnabledState(await getAutoBackupEnabled());
    setAutoBackupInterval(await getAutoBackupIntervalDays());
    setLastAutoBackup(await getLastAutoBackupAt());
    setManualBackupFileSet((await getManualBackupFileUri()) !== null);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleBiometricToggle = async (value: boolean) => {
    if (value) {
      setEnableBioVisible(true);
    } else {
      await disableBiometricUnlock();
      setBiometricEnabled(false);
    }
  };

  const handleAutoLockSelect = async (value: number) => {
    await setAutoLockMinutes(value);
    setAutoLock(value);
    setAutoLockPickerVisible(false);
  };

  const handleExport = async () => {
    setBackupBusy(true);
    setBackupNote('');
    try {
      const saved = await exportBackup();
      setBackupNote(saved ? 'Backup saved.' : '');
      if (saved) setManualBackupFileSet(true);
    } catch {
      setBackupNote('Could not save backup.');
    }
    setBackupBusy(false);
  };

  const handleForgetBackupLocation = async () => {
    await forgetManualBackupLocation();
    setManualBackupFileSet(false);
    setBackupNote('Next export will ask where to save.');
  };

  const handleRestore = async () => {
    setRestoreVisible(false);
    setBackupBusy(true);
    setBackupNote('');
    try {
      const restored = await restoreFromBackup();
      if (!restored) setBackupNote('');
      // On success the app drops straight to the lock screen — no note needed, it's obvious.
    } catch {
      setBackupNote('That file is not a valid SecureVault backup.');
    }
    setBackupBusy(false);
  };

  const handleAutoBackupToggle = async (value: boolean) => {
    await setAutoBackupEnabled(value);
    setAutoBackupEnabledState(value);
  };

  const handleAutoBackupIntervalSelect = async (days: number) => {
    await setAutoBackupIntervalDays(days);
    setAutoBackupInterval(days);
    setAutoBackupIntervalPickerVisible(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient colors={colors.headerGradient} style={[styles.hero, { paddingTop: insets.top + 18 }]}>
        <View style={contentBounds}>
          <Text style={styles.heroTitle}>Settings</Text>
          <Text style={styles.heroSubtitle}>Appearance, security & data</Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.body}>
        <SectionLabel text="Appearance" />
        <View style={[styles.card, { backgroundColor: colors.card }, elevation(colors.shadow, 'sm')]}>
          <View style={styles.rowBetween}>
            <Text style={[styles.rowLabel, { color: colors.text }]}>Theme</Text>
            <View style={[styles.segment, { backgroundColor: colors.cardAlt }]}>
              {THEME_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.segmentBtn, themeMode === opt && { backgroundColor: colors.primary }]}
                  onPress={() => setThemeMode(opt)}>
                  <Text style={[styles.segmentLabel, { color: themeMode === opt ? colors.white : colors.textSecondary }]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <SectionLabel text="Security" />
        <View style={[styles.card, { backgroundColor: colors.card }, elevation(colors.shadow, 'sm')]}>
          <View style={styles.rowBetween}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowLabel, { color: colors.text }]}>Biometric unlock</Text>
              <Text style={[styles.rowHint, { color: colors.textSecondary }]}>
                {biometricSupported ? 'Use fingerprint/face to skip typing your master password' : 'Not supported on this device'}
              </Text>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={handleBiometricToggle}
              disabled={!biometricSupported}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={colors.white}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <TouchableOpacity style={styles.rowBetween} onPress={() => setAutoLockPickerVisible(true)}>
            <Text style={[styles.rowLabel, { color: colors.text }]}>Auto-lock</Text>
            <View style={styles.valueRow}>
              <Text style={[styles.rowValue, { color: colors.textSecondary }]}>
                {AUTO_LOCK_OPTIONS.find(o => o.value === autoLock)?.label ?? '1 minute'}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.tabInactive} />
            </View>
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <TouchableOpacity style={styles.rowBetween} onPress={() => setChangePwVisible(true)}>
            <Text style={[styles.rowLabel, { color: colors.text }]}>Change master password</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.tabInactive} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <TouchableOpacity style={styles.rowBetween} onPress={() => setChangeDisguiseVisible(true)}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowLabel, { color: colors.text }]}>Change disguise code</Text>
              <Text style={[styles.rowHint, { color: colors.textSecondary }]}>The code you type into the Calculator to reveal this app</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.tabInactive} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <TouchableOpacity style={styles.rowBetween} onPress={() => setLockVisible(true)}>
            <Text style={[styles.rowLabel, { color: colors.text }]}>Lock now</Text>
            <Ionicons name="lock-closed-outline" size={16} color={colors.tabInactive} />
          </TouchableOpacity>
        </View>

        <SectionLabel text="Backup" />
        <View style={[styles.card, { backgroundColor: colors.card }, elevation(colors.shadow, 'sm')]}>
          <TouchableOpacity style={styles.rowBetween} onPress={handleExport} disabled={backupBusy}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowLabel, { color: colors.text }]}>Export backup</Text>
              <Text style={[styles.rowHint, { color: colors.textSecondary }]}>
                {manualBackupFileSet
                  ? 'Encrypted, overwrites the same file each time — survives an uninstall.'
                  : 'Save an encrypted copy of your vault to a file you choose — survives an uninstall.'}
              </Text>
            </View>
            <Ionicons name="download-outline" size={18} color={colors.tabInactive} />
          </TouchableOpacity>

          {manualBackupFileSet ? (
            <TouchableOpacity onPress={handleForgetBackupLocation} disabled={backupBusy}>
              <Text style={[styles.linkText, { color: colors.primaryLight }]}>Use a different file next time</Text>
            </TouchableOpacity>
          ) : null}

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <TouchableOpacity style={styles.rowBetween} onPress={() => setRestoreVisible(true)} disabled={backupBusy}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowLabel, { color: colors.text }]}>Restore from backup</Text>
              <Text style={[styles.rowHint, { color: colors.textSecondary }]}>Replaces everything currently in this vault.</Text>
            </View>
            <Ionicons name="cloud-upload-outline" size={18} color={colors.tabInactive} />
          </TouchableOpacity>

          {backupNote ? <Text style={[styles.backupNote, { color: colors.textSecondary }]}>{backupNote}</Text> : null}
        </View>

        <SectionLabel text="Scheduled backup" />
        <View style={[styles.card, { backgroundColor: colors.card }, elevation(colors.shadow, 'sm')]}>
          <View style={styles.rowBetween}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowLabel, { color: colors.text }]}>Auto-backup</Text>
              <Text style={[styles.rowHint, { color: colors.textSecondary }]}>
                Saved to this app's private storage — no other app can read it. Checked each time you unlock. Won't
                survive an uninstall, so it doesn't replace Export backup above.
              </Text>
            </View>
            <Switch
              value={autoBackupEnabled}
              onValueChange={handleAutoBackupToggle}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={colors.white}
            />
          </View>

          {autoBackupEnabled ? (
            <>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <TouchableOpacity style={styles.rowBetween} onPress={() => setAutoBackupIntervalPickerVisible(true)}>
                <Text style={[styles.rowLabel, { color: colors.text }]}>Frequency</Text>
                <View style={styles.valueRow}>
                  <Text style={[styles.rowValue, { color: colors.textSecondary }]}>
                    {AUTO_BACKUP_INTERVAL_OPTIONS.find(o => o.value === autoBackupInterval)?.label ?? 'Weekly'}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.tabInactive} />
                </View>
              </TouchableOpacity>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <View style={styles.rowBetween}>
                <Text style={[styles.rowLabel, { color: colors.text }]}>Last backup</Text>
                <Text style={[styles.rowValue, { color: colors.textSecondary }]}>{formatLastBackup(lastAutoBackup)}</Text>
              </View>
            </>
          ) : null}
        </View>

        <SectionLabel text="Legal" />
        <View style={[styles.card, { backgroundColor: colors.card }, elevation(colors.shadow, 'sm')]}>
          <TouchableOpacity style={styles.rowBetween} onPress={() => setPrivacyPolicyVisible(true)}>
            <Text style={[styles.rowLabel, { color: colors.text }]}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.tabInactive} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <TouchableOpacity style={styles.rowBetween} onPress={() => setTermsVisible(true)}>
            <Text style={[styles.rowLabel, { color: colors.text }]}>Terms & Conditions</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.tabInactive} />
          </TouchableOpacity>
        </View>

        <SectionLabel text="Danger zone" />
        <View style={[styles.card, { backgroundColor: colors.card }, elevation(colors.shadow, 'sm')]}>
          <TouchableOpacity style={styles.rowBetween} onPress={() => setResetVisible(true)}>
            <Text style={[styles.rowLabel, { color: colors.danger }]}>Erase vault</Text>
            <Ionicons name="trash-outline" size={16} color={colors.danger} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.about, { color: colors.textSecondary }]}>SecureVault · Local, encrypted, offline</Text>
      </ScrollView>

      <ChangePasswordModal
        visible={changePwVisible}
        onClose={() => setChangePwVisible(false)}
        onSubmit={changeMasterPassword}
      />

      <ChangeDisguiseCodeModal visible={changeDisguiseVisible} onClose={() => setChangeDisguiseVisible(false)} />

      <EnableBiometricModal
        visible={enableBioVisible}
        onClose={() => setEnableBioVisible(false)}
        onSubmit={async password => {
          await enableBiometricUnlock(password);
          setBiometricEnabled(true);
          setEnableBioVisible(false);
        }}
      />

      <AutoLockPicker
        visible={autoLockPickerVisible}
        current={autoLock}
        onSelect={handleAutoLockSelect}
        onClose={() => setAutoLockPickerVisible(false)}
      />

      <OptionPicker
        visible={autoBackupIntervalPickerVisible}
        title="Auto-backup frequency"
        options={AUTO_BACKUP_INTERVAL_OPTIONS}
        current={autoBackupInterval}
        onSelect={handleAutoBackupIntervalSelect}
        onClose={() => setAutoBackupIntervalPickerVisible(false)}
      />

      <LegalDocumentModal visible={privacyPolicyVisible} document={PRIVACY_POLICY} onClose={() => setPrivacyPolicyVisible(false)} />
      <LegalDocumentModal visible={termsVisible} document={TERMS_AND_CONDITIONS} onClose={() => setTermsVisible(false)} />

      <ConfirmDialog
        visible={restoreVisible}
        title="Restore from backup?"
        message="Pick a SecureVault backup file. Everything currently in this vault will be replaced with what's in that file — this can't be undone."
        confirmLabel="Choose File"
        destructive
        onCancel={() => setRestoreVisible(false)}
        onConfirm={handleRestore}
      />

      <ConfirmDialog
        visible={lockVisible}
        title="Lock SecureVault?"
        message="You'll need your master password (or biometrics) to get back in."
        confirmLabel="Lock"
        onCancel={() => setLockVisible(false)}
        onConfirm={() => {
          setLockVisible(false);
          lock();
        }}
      />

      <ConfirmDialog
        visible={resetVisible}
        title="Erase vault?"
        message="This permanently deletes every saved password on this device. This cannot be undone."
        confirmLabel="Erase Everything"
        destructive
        onCancel={() => setResetVisible(false)}
        onConfirm={() => {
          setResetVisible(false);
          resetVault();
        }}
      />
    </View>
  );
}

function SectionLabel({ text }: { text: string }) {
  const { colors } = useTheme();
  return <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{text.toUpperCase()}</Text>;
}

function ChangePasswordModal({
  visible,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (oldPw: string, newPw: string) => Promise<boolean>;
}) {
  const { colors } = useTheme();
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (visible) {
      setOldPw('');
      setNewPw('');
      setConfirmPw('');
      setError('');
    }
  }, [visible]);

  const handleSubmit = async () => {
    if (newPw.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    if (newPw !== confirmPw) {
      setError("New passwords don't match.");
      return;
    }
    setBusy(true);
    const ok = await onSubmit(oldPw, newPw);
    setBusy(false);
    if (!ok) {
      setError('Current password is incorrect.');
      return;
    }
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={[styles.overlay, { backgroundColor: colors.overlay }]} onPress={onClose}>
        <Pressable style={[styles.modalCard, { backgroundColor: colors.card }, elevation(colors.shadow, 'lg')]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Change master password</Text>
          <TextField label="Current password" isPassword value={oldPw} onChangeText={setOldPw} autoCapitalize="none" />
          <TextField label="New password" isPassword value={newPw} onChangeText={setNewPw} autoCapitalize="none" />
          <TextField label="Confirm new password" isPassword value={confirmPw} onChangeText={setConfirmPw} autoCapitalize="none" error={error} />
          <View style={styles.modalActions}>
            <Button label="Cancel" variant="secondary" onPress={onClose} style={{ flex: 1 }} />
            <Button label="Update" onPress={handleSubmit} loading={busy} style={{ flex: 1 }} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const MIN_DISGUISE_CODE_LENGTH = 8;

function ChangeDisguiseCodeModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors } = useTheme();
  const [code, setCode] = useState('');
  const [confirmCode, setConfirmCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (visible) {
      setCode('');
      setConfirmCode('');
      setError('');
    }
  }, [visible]);

  const handleSubmit = async () => {
    if (code.length < MIN_DISGUISE_CODE_LENGTH) {
      setError(`Use at least ${MIN_DISGUISE_CODE_LENGTH} digits.`);
      return;
    }
    if (code !== confirmCode) {
      setError("Codes don't match.");
      return;
    }
    setBusy(true);
    await setDisguiseCode(code);
    setBusy(false);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={[styles.overlay, { backgroundColor: colors.overlay }]} onPress={onClose}>
        <Pressable style={[styles.modalCard, { backgroundColor: colors.card }, elevation(colors.shadow, 'lg')]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Change disguise code</Text>
          <Text style={[styles.modalHint, { color: colors.textSecondary }]}>
            Type this into the Calculator and press "=" to reveal SecureVault.
          </Text>
          <TextField
            label="New code"
            isPassword
            placeholder={`At least ${MIN_DISGUISE_CODE_LENGTH} digits`}
            value={code}
            onChangeText={v => setCode(v.replace(/\D/g, '').slice(0, 12))}
            keyboardType="number-pad"
          />
          <TextField
            label="Confirm new code"
            isPassword
            value={confirmCode}
            onChangeText={v => setConfirmCode(v.replace(/\D/g, '').slice(0, 12))}
            keyboardType="number-pad"
            error={error}
          />
          <View style={styles.modalActions}>
            <Button label="Cancel" variant="secondary" onPress={onClose} style={{ flex: 1 }} />
            <Button label="Update" onPress={handleSubmit} loading={busy} style={{ flex: 1 }} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function EnableBiometricModal({ visible, onClose, onSubmit }: { visible: boolean; onClose: () => void; onSubmit: (pw: string) => Promise<void> }) {
  const { colors } = useTheme();
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (visible) setPw('');
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={[styles.overlay, { backgroundColor: colors.overlay }]} onPress={onClose}>
        <Pressable style={[styles.modalCard, { backgroundColor: colors.card }, elevation(colors.shadow, 'lg')]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Confirm master password</Text>
          <Text style={[styles.modalHint, { color: colors.textSecondary }]}>
            Needed once to link biometric unlock to your vault.
          </Text>
          <TextField isPassword placeholder="Master password" value={pw} onChangeText={setPw} autoCapitalize="none" autoFocus />
          <View style={styles.modalActions}>
            <Button label="Cancel" variant="secondary" onPress={onClose} style={{ flex: 1 }} />
            <Button
              label="Enable"
              onPress={async () => {
                setBusy(true);
                await onSubmit(pw);
                setBusy(false);
              }}
              disabled={!pw}
              loading={busy}
              style={{ flex: 1 }}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function AutoLockPicker({
  visible,
  current,
  onSelect,
  onClose,
}: {
  visible: boolean;
  current: number;
  onSelect: (v: number) => void;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={[styles.overlay, { backgroundColor: colors.overlay }]} onPress={onClose}>
        <Pressable style={[styles.modalCard, { backgroundColor: colors.card }, elevation(colors.shadow, 'lg')]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Auto-lock after</Text>
          {AUTO_LOCK_OPTIONS.map(opt => (
            <TouchableOpacity key={opt.value} style={styles.pickerRow} onPress={() => onSelect(opt.value)}>
              <Text style={[styles.pickerLabel, { color: colors.text }]}>{opt.label}</Text>
              {current === opt.value ? <Ionicons name="checkmark" size={18} color={colors.primaryLight} /> : null}
            </TouchableOpacity>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function OptionPicker({
  visible,
  title,
  options,
  current,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: { label: string; value: number }[];
  current: number;
  onSelect: (v: number) => void;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={[styles.overlay, { backgroundColor: colors.overlay }]} onPress={onClose}>
        <Pressable style={[styles.modalCard, { backgroundColor: colors.card }, elevation(colors.shadow, 'lg')]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>{title}</Text>
          {options.map(opt => (
            <TouchableOpacity key={opt.value} style={styles.pickerRow} onPress={() => onSelect(opt.value)}>
              <Text style={[styles.pickerLabel, { color: colors.text }]}>{opt.label}</Text>
              {current === opt.value ? <Ionicons name="checkmark" size={18} color={colors.primaryLight} /> : null}
            </TouchableOpacity>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: 20, paddingBottom: 22, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  heroTitle: { fontSize: 24, fontWeight: '800', color: '#fff' },
  heroSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 3 },
  body: { padding: 20, paddingBottom: 50, ...contentBounds },
  sectionLabel: { fontSize: 11.5, fontWeight: '800', letterSpacing: 0.6, marginBottom: 8, marginTop: 18 },
  card: { borderRadius: RADIUS.lg, paddingHorizontal: 16 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14 },
  rowLabel: { fontSize: 14.5, fontWeight: '600' },
  rowHint: { fontSize: 11.5, marginTop: 2 },
  backupNote: { fontSize: 12, fontWeight: '600', paddingVertical: 12 },
  linkText: { fontSize: 11.5, fontWeight: '700', paddingBottom: 12, textDecorationLine: 'underline' },
  rowValue: { fontSize: 13.5 },
  valueRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  divider: { height: 1 },
  segment: { flexDirection: 'row', borderRadius: RADIUS.sm, padding: 3 },
  segmentBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.sm - 2 },
  segmentLabel: { fontSize: 12, fontWeight: '700' },
  about: { textAlign: 'center', fontSize: 12, marginTop: 30 },
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: { width: '100%', maxWidth: 400, borderRadius: RADIUS.lg, padding: 22 },
  modalTitle: { fontSize: 17, fontWeight: '800', marginBottom: 14 },
  modalHint: { fontSize: 12.5, marginBottom: 14, lineHeight: 18 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 6 },
  pickerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 13 },
  pickerLabel: { fontSize: 15 },
});
