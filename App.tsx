import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { View, StatusBar, AppState, AppStateStatus, StyleSheet, Alert, BackHandler } from 'react-native';
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
import { getAutoLockMinutes } from './src/storage/vaultStorage';
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
  const [securityCleared, setSecurityCleared] = useState(false);

  useEffect(() => {
    (async () => {
      const [rooted, debugging] = await Promise.all([isDeviceRooted(), isDebuggingEnabled()]);

      if (rooted) {
        Alert.alert(
          '⚠️ Security Warning',
          'SecureVault cannot run on a rooted device.',
          [{ text: 'Exit', onPress: () => BackHandler.exitApp() }],
          { cancelable: false },
        );
        return;
      }

      if (debugging) {
        Alert.alert(
          '⚠️ Security Warning',
          'This build cannot run with developer tools (USB debugging) enabled.',
          [{ text: 'Exit', onPress: () => BackHandler.exitApp() }],
          { cancelable: false },
        );
        return;
      }

      setSecurityCleared(true);
    })();
  }, []);

  if (!securityCleared) return null;

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

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <VaultProvider>
          <AppContent />
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
