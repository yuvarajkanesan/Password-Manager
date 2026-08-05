import React from 'react';
import { View, Text, StyleSheet, BackHandler, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { contentBounds, RADIUS } from '../constants/theme';

export type SecurityBlockReason = 'rooted' | 'debugging';

const COPY: Record<SecurityBlockReason, { title: string; message: string }> = {
  rooted: {
    title: 'Rooted Device Detected',
    message:
      'SecureVault cannot run on a rooted device. Rooting removes protections your vault relies on, so this app refuses to open here to keep your saved passwords and cards safe.',
  },
  debugging: {
    title: 'Developer Mode Detected',
    message:
      'This build cannot run while USB debugging or a debugger is active. This is a safety measure against tampering — turn off developer options to continue.',
  },
};

export default function SecurityBlockScreen({ reason }: { reason: SecurityBlockReason }) {
  const insets = useSafeAreaInsets();
  const { title, message } = COPY[reason];

  return (
    <LinearGradient colors={['#3A0E12', '#1A2A45', '#0A0E17']} style={[styles.container, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 32 }]}>
      <View style={[styles.content, contentBounds]}>
        <View style={styles.iconOuter}>
          <View style={styles.iconInner}>
            <Ionicons name="shield-half" size={38} color="#F16569" />
          </View>
        </View>

        <Text style={styles.badge}>SECURITY BLOCK</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>

        <View style={styles.spacer} />

        <TouchableOpacity style={styles.exitBtn} activeOpacity={0.85} onPress={() => BackHandler.exitApp()}>
          <Text style={styles.exitLabel}>Exit App</Text>
        </TouchableOpacity>
        <Text style={styles.footer}>SecureVault · Local, encrypted, offline</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', paddingHorizontal: 28 },
  content: { flex: 1, alignItems: 'center', width: '100%' },
  iconOuter: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(241,101,105,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 28,
  },
  iconInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(241,101,105,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: { color: '#F16569', fontSize: 11.5, fontWeight: '800', letterSpacing: 2, marginBottom: 14 },
  title: { color: '#fff', fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 14, letterSpacing: 0.2 },
  message: { color: 'rgba(255,255,255,0.72)', fontSize: 14.5, lineHeight: 22, textAlign: 'center', maxWidth: 380 },
  spacer: { flex: 1, minHeight: 24 },
  exitBtn: {
    width: '100%',
    backgroundColor: 'rgba(241,101,105,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(241,101,105,0.4)',
    borderRadius: RADIUS.md,
    paddingVertical: 15,
    alignItems: 'center',
  },
  exitLabel: { color: '#F16569', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  footer: { color: 'rgba(255,255,255,0.35)', fontSize: 11.5, marginTop: 20 },
});
