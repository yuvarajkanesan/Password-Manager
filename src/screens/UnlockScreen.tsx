import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { useVault } from '../contexts/VaultContext';
import TextField from '../components/TextField';
import Button from '../components/Button';
import ConfirmDialog from '../components/ConfirmDialog';
import { getBiometricEnabled } from '../storage/vaultStorage';
import { getBiometricPassword, hasBiometricPassword } from '../storage/biometricStore';
import { RADIUS } from '../constants/theme';

export default function UnlockScreen() {
  const { colors } = useTheme();
  const { unlock, resetVault } = useVault();
  const insets = useSafeAreaInsets();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [resetVisible, setResetVisible] = useState(false);
  const triedAutoBiometric = useRef(false);

  const tryBiometric = useCallback(async () => {
    const enabled = await getBiometricEnabled();
    const stored = await hasBiometricPassword();
    if (!enabled || !stored) return;
    const pass = await getBiometricPassword();
    if (!pass) return;
    setBusy(true);
    const ok = await unlock(pass);
    setBusy(false);
    if (!ok) setError('Stored biometric credential is out of date. Enter your master password.');
  }, [unlock]);

  useEffect(() => {
    (async () => {
      const enabled = await getBiometricEnabled();
      const stored = await hasBiometricPassword();
      setBiometricAvailable(enabled && stored);
      if (enabled && stored && !triedAutoBiometric.current) {
        triedAutoBiometric.current = true;
        tryBiometric();
      }
    })();
  }, [tryBiometric]);

  const handleUnlock = async () => {
    if (!password) return;
    setError('');
    setBusy(true);
    const ok = await unlock(password);
    setBusy(false);
    if (!ok) setError('Incorrect master password.');
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient colors={colors.headerGradient} style={[styles.hero, { paddingTop: insets.top + 44 }]}>
        <View style={styles.iconCircle}>
          <Ionicons name="lock-closed" size={30} color={colors.accent} />
        </View>
        <Text style={styles.heroTitle}>SecureVault</Text>
        <Text style={styles.heroSubtitle}>Enter your master password to continue</Text>
      </LinearGradient>

      <View style={[styles.body, { backgroundColor: colors.background }]}>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <TextField
            label="Master password"
            icon="lock-closed-outline"
            isPassword
            placeholder="Master password"
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={handleUnlock}
            autoCapitalize="none"
            error={error}
            autoFocus
          />
          <Button label="Unlock" onPress={handleUnlock} disabled={!password} loading={busy} style={styles.submit} />

          {biometricAvailable ? (
            <TouchableOpacity style={styles.bioRow} onPress={tryBiometric} disabled={busy}>
              <Ionicons name="finger-print-outline" size={18} color={colors.primaryLight} />
              <Text style={[styles.bioText, { color: colors.primaryLight }]}>Use biometric unlock</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity style={styles.forgot} onPress={() => setResetVisible(true)}>
            <Text style={[styles.forgotText, { color: colors.textSecondary }]}>Forgot password?</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ConfirmDialog
        visible={resetVisible}
        title="Reset vault?"
        message="Your master password can't be recovered. Resetting permanently deletes every saved password on this device so you can start over."
        confirmLabel="Erase & Reset"
        destructive
        onCancel={() => setResetVisible(false)}
        onConfirm={() => {
          setResetVisible(false);
          resetVault();
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', paddingBottom: 44, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  heroTitle: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
  heroSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4, textAlign: 'center', paddingHorizontal: 30 },
  body: { flex: 1, marginTop: -24, paddingHorizontal: 20 },
  card: { borderRadius: RADIUS.lg, padding: 20 },
  submit: { marginTop: 4 },
  bioRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 18 },
  bioText: { fontSize: 14, fontWeight: '700' },
  forgot: { alignItems: 'center', marginTop: 16 },
  forgotText: { fontSize: 12.5, fontWeight: '600', textDecorationLine: 'underline' },
});
