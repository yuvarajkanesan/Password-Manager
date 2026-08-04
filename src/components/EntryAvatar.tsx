import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import type { EntryCategory } from '../types/vault';

const AVATAR_HUES = ['#17D9C4', '#8B6BD8', '#E2A03F', '#59C97A', '#E5697D', '#5CA8E2'];

function hueFor(title: string): string {
  let hash = 0;
  for (let i = 0; i < title.length; i++) hash = (hash * 31 + title.charCodeAt(i)) % AVATAR_HUES.length;
  return AVATAR_HUES[Math.abs(hash) % AVATAR_HUES.length];
}

export default function EntryAvatar({ title, category, size = 44 }: { title: string; category: EntryCategory; size?: number }) {
  const { colors } = useTheme();
  const letter = title.trim().charAt(0).toUpperCase() || '?';
  const bg = category === 'official' ? colors.official : hueFor(title || '?');

  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg + '26' }]}>
      <Text style={[styles.letter, { color: bg, fontSize: size * 0.4 }]}>{letter}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center' },
  letter: { fontWeight: '800' },
});
