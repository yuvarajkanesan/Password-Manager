import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { calculateStrength } from '../utils/passwordUtils';
import { RADIUS } from '../constants/theme';

const SCORE_COLORS = ['#E5484D', '#E2A03F', '#E2C93F', '#59C97A', '#17D9C4'];

export default function StrengthMeter({ password }: { password: string }) {
  const { colors } = useTheme();
  const { score, label } = calculateStrength(password);
  const color = SCORE_COLORS[score];

  return (
    <View style={styles.container}>
      <View style={styles.barRow}>
        {[0, 1, 2, 3, 4].map(i => (
          <View
            key={i}
            style={[
              styles.segment,
              { backgroundColor: i <= score && password ? color : colors.border },
            ]}
          />
        ))}
      </View>
      <Text style={[styles.label, { color: password ? color : colors.textSecondary }]}>
        {password ? label : 'No password'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 8, marginBottom: 4 },
  barRow: { flexDirection: 'row', gap: 4 },
  segment: { flex: 1, height: 4, borderRadius: RADIUS.pill },
  label: { fontSize: 11.5, fontWeight: '700', marginTop: 6, letterSpacing: 0.2 },
});
