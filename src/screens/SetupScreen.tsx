import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { useVault } from '../contexts/VaultContext';
import TextField from '../components/TextField';
import Button from '../components/Button';
import StrengthMeter from '../components/StrengthMeter';
import LegalDocumentModal from './LegalDocumentModal';
import { PRIVACY_POLICY, TERMS_AND_CONDITIONS } from '../constants/legalContent';
import { setDisguiseCode } from '../storage/vaultStorage';
import { RADIUS, contentBounds } from '../constants/theme';

const MIN_DISGUISE_CODE_LENGTH = 8;

export default function SetupScreen() {
  const { colors } = useTheme();
  const { setupVault, restoreFromBackup } = useVault();
  const insets = useSafeAreaInsets();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [disguiseCode, setDisguiseCodeInput] = useState('');
  const [error, setError] = useState('');
  const [disguiseError, setDisguiseError] = useState('');
  const [busy, setBusy] = useState(false);
  const [restoreBusy, setRestoreBusy] = useState(false);
  const [restoreError, setRestoreError] = useState('');
  const [privacyPolicyVisible, setPrivacyPolicyVisible] = useState(false);
  const [termsVisible, setTermsVisible] = useState(false);

  const canSubmit = password.length >= 8 && password === confirm && disguiseCode.length >= MIN_DISGUISE_CODE_LENGTH;

  const handleCreate = async () => {
    if (password.length < 8) {
      setError('Use at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    if (disguiseCode.length < MIN_DISGUISE_CODE_LENGTH) {
      setDisguiseError(`Use at least ${MIN_DISGUISE_CODE_LENGTH} digits.`);
      return;
    }
    setError('');
    setDisguiseError('');
    setBusy(true);
    try {
      await setDisguiseCode(disguiseCode);
      await setupVault(password);
    } finally {
      setBusy(false);
    }
  };

  const handleRestore = async () => {
    setRestoreError('');
    setRestoreBusy(true);
    try {
      await restoreFromBackup();
      // On success the app switches straight to the lock screen — nothing else to do here.
    } catch {
      setRestoreError('That file is not a valid SecureVault backup.');
    }
    setRestoreBusy(false);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient colors={colors.headerGradient} style={[styles.hero, { paddingTop: insets.top + 36 }]}>
        <View style={styles.iconCircle}>
          <Ionicons name="shield-checkmark" size={34} color={colors.accent} />
        </View>
        <Text style={styles.heroTitle}>SecureVault</Text>
        <Text style={styles.heroSubtitle}>Create your master password</Text>
      </LinearGradient>

      <ScrollView style={[styles.body, { backgroundColor: colors.background }]} contentContainerStyle={styles.bodyContent}>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <TextField
            label="Master password"
            icon="lock-closed-outline"
            isPassword
            placeholder="Enter a strong password"
            value={password}
            onChangeText={setPassword}
            autoCapitalize="none"
          />
          <StrengthMeter password={password} />
          <TextField
            label="Confirm password"
            icon="lock-closed-outline"
            isPassword
            placeholder="Re-enter password"
            value={confirm}
            onChangeText={setConfirm}
            autoCapitalize="none"
            error={error}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <Text style={[styles.sectionLabel, { color: colors.text }]}>Disguise code</Text>
          <Text style={[styles.sectionHint, { color: colors.textSecondary }]}>
            SecureVault hides on your home screen as a Calculator. Choose an 8+ digit code — type it into the
            calculator and press "=" any time to reveal your vault.
          </Text>
          <TextField
            label="Calculator reveal code"
            icon="apps-outline"
            isPassword
            placeholder="e.g. 19570824"
            value={disguiseCode}
            onChangeText={v => setDisguiseCodeInput(v.replace(/\D/g, '').slice(0, 12))}
            keyboardType="number-pad"
            error={disguiseError}
          />

          <View style={[styles.notice, { backgroundColor: colors.goldSoft }]}>
            <Ionicons name="information-circle-outline" size={16} color={colors.gold} />
            <Text style={[styles.noticeText, { color: colors.textSecondary }]}>
              This password encrypts your vault on this device. There is no cloud backup — if you forget it,
              your saved passwords cannot be recovered.
            </Text>
          </View>
          <Button label="Create Vault" onPress={handleCreate} disabled={!canSubmit} loading={busy} style={styles.submit} />

          <TouchableOpacity style={styles.restoreRow} onPress={handleRestore} disabled={restoreBusy}>
            <Ionicons name="cloud-upload-outline" size={15} color={colors.primaryLight} />
            <Text style={[styles.restoreText, { color: colors.primaryLight }]}>
              {restoreBusy ? 'Restoring…' : 'Restore from a backup instead'}
            </Text>
          </TouchableOpacity>
          {restoreError ? <Text style={[styles.restoreError, { color: colors.danger }]}>{restoreError}</Text> : null}

          <Text style={[styles.legalText, { color: colors.textSecondary }]}>
            By continuing you agree to the{' '}
            <Text style={[styles.legalLink, { color: colors.primaryLight }]} onPress={() => setTermsVisible(true)}>
              Terms & Conditions
            </Text>{' '}
            and{' '}
            <Text style={[styles.legalLink, { color: colors.primaryLight }]} onPress={() => setPrivacyPolicyVisible(true)}>
              Privacy Policy
            </Text>
            .
          </Text>
        </View>
      </ScrollView>

      <LegalDocumentModal visible={privacyPolicyVisible} document={PRIVACY_POLICY} onClose={() => setPrivacyPolicyVisible(false)} />
      <LegalDocumentModal visible={termsVisible} document={TERMS_AND_CONDITIONS} onClose={() => setTermsVisible(false)} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', paddingBottom: 40, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  heroTitle: { fontSize: 24, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
  heroSubtitle: { fontSize: 13.5, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  body: { flex: 1, marginTop: -24 },
  bodyContent: { padding: 20, paddingBottom: 40, ...contentBounds },
  card: { borderRadius: RADIUS.lg, padding: 20 },
  divider: { height: 1, marginVertical: 18 },
  sectionLabel: { fontSize: 14.5, fontWeight: '700', marginBottom: 6 },
  sectionHint: { fontSize: 12, lineHeight: 17, marginBottom: 14 },
  notice: { flexDirection: 'row', gap: 8, padding: 12, borderRadius: RADIUS.md, marginBottom: 20, marginTop: 4 },
  noticeText: { flex: 1, fontSize: 12, lineHeight: 17 },
  submit: {},
  restoreRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 18 },
  restoreText: { fontSize: 13, fontWeight: '700' },
  restoreError: { fontSize: 12, fontWeight: '600', textAlign: 'center', marginTop: 8 },
  legalText: { fontSize: 11.5, textAlign: 'center', marginTop: 20, lineHeight: 17 },
  legalLink: { fontWeight: '700', textDecorationLine: 'underline' },
});
