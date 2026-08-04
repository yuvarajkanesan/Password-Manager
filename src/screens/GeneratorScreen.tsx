import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import Button from '../components/Button';
import StrengthMeter from '../components/StrengthMeter';
import { generatePassword, GeneratorOptions } from '../utils/passwordUtils';
import { copyWithAutoClear } from '../utils/clipboard';
import { RADIUS, elevation } from '../constants/theme';

const MIN_LENGTH = 8;
const MAX_LENGTH = 32;

export default function GeneratorScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [options, setOptions] = useState<GeneratorOptions>({
    length: 16,
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
  });
  const [password, setPassword] = useState('');
  const [copied, setCopied] = useState(false);

  const regenerate = useCallback(() => {
    setPassword(generatePassword(options));
    setCopied(false);
  }, [options]);

  useEffect(() => {
    regenerate();
  }, [regenerate]);

  const toggle = (key: keyof Omit<GeneratorOptions, 'length'>) => {
    setOptions(prev => {
      const next = { ...prev, [key]: !prev[key] };
      const anyOn = next.uppercase || next.lowercase || next.numbers || next.symbols;
      return anyOn ? next : prev;
    });
  };

  const adjustLength = (delta: number) => {
    setOptions(prev => ({ ...prev, length: Math.max(MIN_LENGTH, Math.min(MAX_LENGTH, prev.length + delta)) }));
  };

  const handleCopy = () => {
    copyWithAutoClear(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient colors={colors.headerGradient} style={[styles.hero, { paddingTop: insets.top + 18 }]}>
        <Text style={styles.heroTitle}>Password Generator</Text>
        <Text style={styles.heroSubtitle}>Create a strong, unique password</Text>
      </LinearGradient>

      <View style={styles.body}>
        <View style={[styles.passwordCard, { backgroundColor: colors.card }, elevation(colors.shadow, 'md')]}>
          <Text style={[styles.passwordText, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit>
            {password}
          </Text>
          <View style={styles.passwordActions}>
            <TouchableOpacity onPress={regenerate} hitSlop={10} style={styles.iconBtn}>
              <Ionicons name="refresh" size={19} color={colors.primaryLight} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleCopy} hitSlop={10} style={styles.iconBtn}>
              <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={19} color={copied ? colors.success : colors.primaryLight} />
            </TouchableOpacity>
          </View>
        </View>
        <StrengthMeter password={password} />

        <View style={[styles.optionsCard, { backgroundColor: colors.card }, elevation(colors.shadow, 'sm')]}>
          <View style={styles.optionRow}>
            <Text style={[styles.optionLabel, { color: colors.text }]}>Length</Text>
            <View style={styles.stepper}>
              <TouchableOpacity style={[styles.stepBtn, { backgroundColor: colors.cardAlt }]} onPress={() => adjustLength(-1)}>
                <Ionicons name="remove" size={16} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.stepValue, { color: colors.text }]}>{options.length}</Text>
              <TouchableOpacity style={[styles.stepBtn, { backgroundColor: colors.cardAlt }]} onPress={() => adjustLength(1)}>
                <Ionicons name="add" size={16} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          <ToggleRow label="Uppercase (A-Z)" value={options.uppercase} onToggle={() => toggle('uppercase')} />
          <ToggleRow label="Lowercase (a-z)" value={options.lowercase} onToggle={() => toggle('lowercase')} />
          <ToggleRow label="Numbers (0-9)" value={options.numbers} onToggle={() => toggle('numbers')} />
          <ToggleRow label="Symbols (!@#$)" value={options.symbols} onToggle={() => toggle('symbols')} last />
        </View>

        <Button label="Generate New" onPress={regenerate} style={styles.generateBtn} />
      </View>
    </View>
  );
}

function ToggleRow({ label, value, onToggle, last }: { label: string; value: boolean; onToggle: () => void; last?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.optionRow, !last && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
      <Text style={[styles.optionLabel, { color: colors.text }]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.border, true: colors.primaryLight }}
        thumbColor={colors.white}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: 20, paddingBottom: 26, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  heroTitle: { fontSize: 24, fontWeight: '800', color: '#fff' },
  heroSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 3 },
  body: { flex: 1, padding: 20, marginTop: -12 },
  passwordCard: { borderRadius: RADIUS.lg, padding: 18, flexDirection: 'row', alignItems: 'center' },
  passwordText: { flex: 1, fontSize: 19, fontWeight: '700', letterSpacing: 0.5, fontFamily: 'monospace' },
  passwordActions: { flexDirection: 'row', gap: 6 },
  iconBtn: { padding: 6 },
  optionsCard: { borderRadius: RADIUS.lg, paddingHorizontal: 16, marginTop: 20 },
  optionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14 },
  optionLabel: { fontSize: 14.5, fontWeight: '600' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepBtn: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  stepValue: { fontSize: 15, fontWeight: '800', minWidth: 24, textAlign: 'center' },
  generateBtn: { marginTop: 24 },
});
