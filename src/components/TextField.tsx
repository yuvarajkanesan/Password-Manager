import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity, TextInputProps } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../contexts/ThemeContext';
import { RADIUS } from '../constants/theme';

type TextFieldProps = TextInputProps & {
  label?: string;
  icon?: string;
  isPassword?: boolean;
  error?: string;
  rightElement?: React.ReactNode;
};

export default function TextField({ label, icon, isPassword, error, rightElement, style, ...rest }: TextFieldProps) {
  const { colors } = useTheme();
  const [hidden, setHidden] = useState(!!isPassword);
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.container}>
      {label ? <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text> : null}
      <View
        style={[
          styles.row,
          rest.multiline && styles.rowMultiline,
          {
            backgroundColor: colors.inputBg,
            borderColor: focused ? colors.primaryLight : colors.border,
            borderWidth: focused ? 1.5 : 1,
          },
        ]}>
        {icon ? <Ionicons name={icon} size={18} color={colors.textSecondary} style={styles.icon} /> : null}
        <TextInput
          {...rest}
          secureTextEntry={hidden}
          placeholderTextColor={colors.textSecondary}
          onFocus={e => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={e => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          // Sensitive fields (master password, CVV, PIN, saved passwords) opt out of
          // Android's Autofill framework entirely — a compromised/malicious autofill
          // service is a real credential-harvesting vector against password managers,
          // and there's never a legitimate reason to autofill *into* the vault itself.
          {...(isPassword ? { importantForAutofill: 'no' as const, autoComplete: 'off' as const } : null)}
          style={[styles.input, { color: colors.text }, rest.multiline && styles.inputMultiline, style]}
        />
        {isPassword ? (
          <TouchableOpacity onPress={() => setHidden(h => !h)} hitSlop={10}>
            <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={19} color={colors.textSecondary} />
          </TouchableOpacity>
        ) : (
          rightElement
        )}
      </View>
      {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 14 },
  label: { fontSize: 12.5, fontWeight: '600', marginBottom: 6, letterSpacing: 0.2 },
  row: { flexDirection: 'row', alignItems: 'center', borderRadius: RADIUS.md, paddingHorizontal: 14, height: 52 },
  rowMultiline: { height: undefined, minHeight: 90, alignItems: 'flex-start', paddingVertical: 12 },
  icon: { marginRight: 10, marginTop: 2 },
  input: { flex: 1, fontSize: 15.5, paddingVertical: 0, height: '100%' },
  inputMultiline: { height: undefined, textAlignVertical: 'top' },
  error: { fontSize: 12, marginTop: 5, fontWeight: '600' },
});
