import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { useVault } from '../contexts/VaultContext';
import TextField from '../components/TextField';
import Button from '../components/Button';
import StrengthMeter from '../components/StrengthMeter';
import { generatePassword } from '../utils/passwordUtils';
import { RADIUS, contentBounds } from '../constants/theme';
import type { VaultEntry, EntryCategory } from '../types/vault';

type AddEditEntryModalProps = {
  visible: boolean;
  category: EntryCategory;
  entry?: VaultEntry | null;
  onClose: () => void;
};

export default function AddEditEntryModal({ visible, category, entry, onClose }: AddEditEntryModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { addEntry, updateEntry } = useVault();
  const isEdit = !!entry;

  const [selectedCategory, setSelectedCategory] = useState<EntryCategory>(category);
  const [title, setTitle] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [titleError, setTitleError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (visible) {
      setSelectedCategory(entry?.category ?? category);
      setTitle(entry?.title ?? '');
      setUsername(entry?.username ?? '');
      setPassword(entry?.password ?? '');
      setUrl(entry?.url ?? '');
      setNotes(entry?.notes ?? '');
      setTitleError('');
    }
  }, [visible, entry, category]);

  const handleGenerate = () => {
    setPassword(generatePassword({ length: 16, uppercase: true, lowercase: true, numbers: true, symbols: true }));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setTitleError('Give this entry a name.');
      return;
    }
    setBusy(true);
    const payload = { category: selectedCategory, title: title.trim(), username: username.trim(), password, url: url.trim(), notes };
    if (isEdit && entry) {
      await updateEntry(entry.id, payload);
    } else {
      await addEntry(payload);
    }
    setBusy(false);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} hitSlop={10}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{isEdit ? 'Edit Entry' : 'New Entry'}</Text>
          <View style={{ width: 24 }} />
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <View style={[styles.segment, { backgroundColor: colors.cardAlt }]}>
              {(['personal', 'official'] as EntryCategory[]).map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.segmentBtn,
                    selectedCategory === cat && { backgroundColor: cat === 'personal' ? colors.personal : colors.official },
                  ]}
                  onPress={() => setSelectedCategory(cat)}>
                  <Text
                    style={[
                      styles.segmentLabel,
                      { color: selectedCategory === cat ? colors.white : colors.textSecondary },
                    ]}>
                    {cat === 'personal' ? 'Personal' : 'Official'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextField
              label="Name"
              icon="bookmark-outline"
              placeholder="e.g. Gmail, Company VPN"
              value={title}
              onChangeText={setTitle}
              error={titleError}
            />
            <TextField
              label="Username / Email"
              icon="person-outline"
              placeholder="username or email"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
            <TextField
              label="Password"
              icon="lock-closed-outline"
              isPassword
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
            />
            <StrengthMeter password={password} />
            <TouchableOpacity style={styles.generateRow} onPress={handleGenerate}>
              <Ionicons name="sparkles-outline" size={15} color={colors.primaryLight} />
              <Text style={[styles.generateText, { color: colors.primaryLight }]}>Generate strong password</Text>
            </TouchableOpacity>

            <TextField
              label="Website / App URL (optional)"
              icon="link-outline"
              placeholder="https://"
              value={url}
              onChangeText={setUrl}
              autoCapitalize="none"
              keyboardType="url"
            />
            <TextField
              label="Notes (optional)"
              icon="document-text-outline"
              placeholder="Anything else worth remembering"
              value={notes}
              onChangeText={setNotes}
              multiline
            />

            <Button label={isEdit ? 'Save Changes' : 'Save Entry'} onPress={handleSave} loading={busy} style={styles.save} />
          </ScrollView>
        </KeyboardAvoidingView>
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
  segment: { flexDirection: 'row', borderRadius: RADIUS.md, padding: 4, marginBottom: 20 },
  segmentBtn: { flex: 1, paddingVertical: 10, borderRadius: RADIUS.sm, alignItems: 'center' },
  segmentLabel: { fontSize: 13.5, fontWeight: '700' },
  generateRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 18, marginTop: 2 },
  generateText: { fontSize: 13, fontWeight: '700' },
  save: { marginTop: 8 },
});
