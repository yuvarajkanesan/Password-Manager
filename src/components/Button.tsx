import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { RADIUS } from '../constants/theme';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
};

export default function Button({ label, onPress, variant = 'primary', disabled, loading, style }: ButtonProps) {
  const { colors } = useTheme();
  const isDisabled = disabled || loading;

  if (variant === 'primary') {
    return (
      <TouchableOpacity onPress={onPress} disabled={isDisabled} activeOpacity={0.85} style={[styles.wrap, style]}>
        <LinearGradient
          colors={isDisabled ? [colors.tabInactive, colors.tabInactive] : [colors.primary, colors.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}>
          {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.primaryLabel}>{label}</Text>}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  const bg = variant === 'danger' ? colors.dangerSoft : variant === 'ghost' ? 'transparent' : colors.cardAlt;
  const textColor = variant === 'danger' ? colors.danger : colors.text;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
      style={[
        styles.wrap,
        styles.plain,
        { backgroundColor: bg, borderColor: variant === 'ghost' ? 'transparent' : colors.border, opacity: isDisabled ? 0.5 : 1 },
        style,
      ]}>
      {loading ? <ActivityIndicator color={textColor} /> : <Text style={[styles.plainLabel, { color: textColor }]}>{label}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: RADIUS.md, overflow: 'hidden' },
  gradient: { paddingVertical: 15, alignItems: 'center', justifyContent: 'center' },
  primaryLabel: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  plain: { paddingVertical: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  plainLabel: { fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
});
