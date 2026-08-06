import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { View, StatusBar, AppState, AppStateStatus, StyleSheet } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { VaultProvider, useVault } from './src/contexts/VaultContext';
import CustomTabBar from './src/components/CustomTabBar';
import SetupScreen from './src/screens/SetupScreen';
import UnlockScreen from './src/screens/UnlockScreen';
import VaultListScreen from './src/screens/VaultListScreen';
import CardsListScreen from './src/screens/CardsListScreen';
import GeneratorScreen from './src/screens/GeneratorScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import SecurityBlockScreen, { SecurityBlockReason } from './src/screens/SecurityBlockScreen';
import CalculatorScreen from './src/screens/CalculatorScreen';
import { getAutoLockMinutes, hasDisguiseCode } from './src/storage/vaultStorage';
import { isDeviceRooted, isDebuggingEnabled } from './src/native/security';

const TAB_ROUTES = [
  { key: 'Personal', name: 'Personal' },
  { key: 'Official', name: 'Official' },
  { key: 'Cards', name: 'Cards' },
  { key: 'Generator', name: 'Generator' },
  { key: 'Settings', name: 'Settings' },
];

function UnlockedApp() {
  const insets = useSafeAreaInsets();
  const { lock } = useVault();
  const [activeTab, setActiveTab] = useState('Personal');
  const appState = useRef(AppState.currentState);
  const backgroundedAt = useRef<number | null>(null);

  useEffect(() => {
    const sub = AppState.addEventListener('change', async (next: AppStateStatus) => {
      if (appState.current === 'active' && next.match(/inactive|background/)) {
        backgroundedAt.current = Date.now();
      } else if (appState.current.match(/inactive|background/) && next === 'active') {
        const minutes = await getAutoLockMinutes();
        const elapsedMs = backgroundedAt.current ? Date.now() - backgroundedAt.current : 0;
        if (minutes >= 0 && elapsedMs >= minutes * 60 * 1000) {
          lock();
        }
      }
      appState.current = next;
    });
    return () => sub.remove();
  }, [lock]);

  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        {activeTab === 'Personal' ? (
          <VaultListScreen category="personal" title="Personal" subtitle="Your everyday accounts" />
        ) : null}
        {activeTab === 'Official' ? (
          <VaultListScreen category="official" title="Official" subtitle="Work & organization accounts" />
        ) : null}
        {activeTab === 'Cards' ? <CardsListScreen /> : null}
        {activeTab === 'Generator' ? <GeneratorScreen /> : null}
        {activeTab === 'Settings' ? <SettingsScreen /> : null}
      </View>
      <CustomTabBar routes={TAB_ROUTES} activeKey={activeTab} onTabPress={setActiveTab} insetBottom={insets.bottom} />
    </View>
  );
}

function AppContent() {
  const { colors } = useTheme();
  const { state } = useVault();
  const [securityBlock, setSecurityBlock] = useState<SecurityBlockReason | null>(null);
  const [securityChecked, setSecurityChecked] = useState(false);

  useEffect(() => {
    (async () => {
      const [rooted, debugging] = await Promise.all([isDeviceRooted(), isDebuggingEnabled()]);
      if (rooted) setSecurityBlock('rooted');
      else if (debugging) setSecurityBlock('debugging');
      setSecurityChecked(true);
    })();
  }, []);

  if (!securityChecked) return null;
  if (securityBlock) return <SecurityBlockScreen reason={securityBlock} />;

  return (
    <>
      <StatusBar backgroundColor={colors.headerGradient[0]} barStyle="light-content" />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {state === 'loading' ? null : null}
        {state === 'no-vault' ? <SetupScreen /> : null}
        {state === 'locked' ? <UnlockScreen /> : null}
        {state === 'unlocked' ? <UnlockedApp /> : null}
      </View>
    </>
  );
}

// The app disguises itself as a Calculator (see app icon/name + CalculatorScreen).
// Typing the code chosen during first-run setup reveals SecureVault; anyone else just
// gets a working calculator. Exceptions where the disguise doesn't apply:
//  - No vault yet (fresh install) — there's nothing to disguise, so onboarding shows
//    directly and the user sets their disguise code as part of it.
//  - Immediately after finishing that onboarding — skip straight into the app rather
//    than re-challenging with the code they just chose seconds ago.
//  - An existing vault from before this feature existed, with no disguise code ever
//    set — enforcing the gate here would permanently lock that vault out, since no
//    code could ever match. Falls back to the old (no-disguise) behavior until the
//    user opts in via Settings > Change disguise code.
function DisguiseGate() {
  const { state } = useVault();
  const [revealed, setRevealed] = useState(false);
  const [disguiseConfigured, setDisguiseConfigured] = useState<boolean | null>(null);
  const appState = useRef(AppState.currentState);
  const prevVaultState = useRef(state);

  useEffect(() => {
    if (prevVaultState.current === 'no-vault' && state !== 'no-vault') {
      setRevealed(true);
    }
    prevVaultState.current = state;
  }, [state]);

  useEffect(() => {
    if (state === 'locked' || state === 'unlocked') {
      hasDisguiseCode().then(setDisguiseConfigured);
    }
  }, [state]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (appState.current === 'active' && next.match(/inactive|background/)) {
        setRevealed(false);
      }
      appState.current = next;
    });
    return () => sub.remove();
  }, []);

  if (state === 'loading') return null;
  if (state === 'no-vault') return <AppContent />;
  if (disguiseConfigured === null) return null;
  if (!disguiseConfigured) return <AppContent />;
  if (!revealed) return <CalculatorScreen onReveal={() => setRevealed(true)} />;
  return <AppContent />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <VaultProvider>
          <DisguiseGate />
        </VaultProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  screen: { flex: 1 },
  content: { flex: 1 },
});
