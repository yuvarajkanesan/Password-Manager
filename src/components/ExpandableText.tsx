import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StyleProp, TextStyle, ViewStyle } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

// Fully hidden on first open — not even a preview, and no empty box either — so a
// detail sheet stays compact by default. "View more" reveals the whole thing (in the
// given box style); "View less" re-hides it back down to just the toggle link.
export default function ExpandableText({
  text,
  boxStyle,
  textStyle,
}: {
  text: string;
  boxStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}) {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);

  return (
    <View>
      {visible ? (
        <View style={boxStyle}>
          <Text style={textStyle}>{text}</Text>
        </View>
      ) : null}
      <TouchableOpacity onPress={() => setVisible(v => !v)} hitSlop={8}>
        <Text style={[styles.toggle, { color: colors.primaryLight }, visible && styles.toggleSpacing]}>
          {visible ? 'View less' : 'View more'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  toggle: { fontSize: 12.5, fontWeight: '700' },
  toggleSpacing: { marginTop: 8 },
});
