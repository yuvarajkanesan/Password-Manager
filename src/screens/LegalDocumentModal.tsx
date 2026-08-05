import React from 'react';
import { Modal, View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import type { LegalDocument } from '../constants/legalContent';
import { contentBounds } from '../constants/theme';

export default function LegalDocumentModal({
  visible,
  document,
  onClose,
}: {
  visible: boolean;
  document: LegalDocument;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} hitSlop={10}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{document.title}</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <Text style={[styles.lastUpdated, { color: colors.textSecondary }]}>{document.lastUpdated}</Text>
          <Text style={[styles.paragraph, { color: colors.text }]}>{document.intro}</Text>

          {document.sections.map(section => (
            <View key={section.heading} style={styles.section}>
              <Text style={[styles.heading, { color: colors.text }]}>{section.heading}</Text>
              {section.body.map((para, i) => (
                <Text key={i} style={[styles.paragraph, { color: colors.textSecondary }]}>
                  {para}
                </Text>
              ))}
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 16.5, fontWeight: '800' },
  content: { padding: 20, paddingBottom: 50, ...contentBounds },
  lastUpdated: { fontSize: 11.5, fontWeight: '700', marginBottom: 14, letterSpacing: 0.3 },
  section: { marginTop: 20 },
  heading: { fontSize: 15, fontWeight: '800', marginBottom: 8 },
  paragraph: { fontSize: 13.5, lineHeight: 21, marginBottom: 10 },
});
