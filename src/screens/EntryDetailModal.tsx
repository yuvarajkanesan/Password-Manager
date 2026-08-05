import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { useVault } from '../contexts/VaultContext';
import EntryAvatar from '../components/EntryAvatar';
import ConfirmDialog from '../components/ConfirmDialog';
import ExpandableText from '../components/ExpandableText';
import { copyWithAutoClear, copyPlain } from '../utils/clipboard';
import { RADIUS, elevation, contentBounds } from '../constants/theme';
import type { VaultEntry } from '../types/vault';

type EntryDetailModalProps = {
  visible: boolean;
  entry: VaultEntry | null;
  onClose: () => void;
  onEdit: (entry: VaultEntry) => void;
};

export default function EntryDetailModal({ visible, entry, onClose, onEdit }: EntryDetailModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { deleteEntry } = useVault();
  const [revealed, setRevealed] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [copiedField, setCopiedField] = useState<'username' | 'password' | null>(null);

  if (!entry) return null;

  const flashCopied = (field: 'username' | 'password') => {
    setCopiedField(field);
    setTimeout(() => setCopiedField(prev => (prev === field ? null : prev)), 1500);
  };

  const handleCopyUsername = () => {
    copyPlain(entry.username);
    flashCopied('username');
  };

  const handleCopyPassword = () => {
    copyWithAutoClear(entry.password);
    flashCopied('password');
  };

  const handleDelete = async () => {
    setConfirmDelete(false);
    await deleteEntry(entry.id);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent>
      <View style={[styles.overlay, { backgroundColor: colors.overlay, paddingTop: insets.top + 40 }]}>
        <View style={[styles.sheet, { backgroundColor: colors.card }, elevation(colors.shadow, 'lg')]}>
          <View style={styles.grabber} />
          <View style={styles.headerRow}>
            <EntryAvatar title={entry.title} category={entry.category} size={52} />
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{entry.title}</Text>
              <View style={[styles.badge, { backgroundColor: entry.category === 'personal' ? colors.personal + '22' : colors.official + '22' }]}>
                <Text style={[styles.badgeText, { color: entry.category === 'personal' ? colors.personal : colors.official }]}>
                  {entry.category === 'personal' ? 'Personal' : 'Official'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.body}>
            <FieldRow
              label="Username / Email"
              value={entry.username || '—'}
              onCopy={entry.username ? handleCopyUsername : undefined}
              copied={copiedField === 'username'}
            />

            <View style={styles.fieldBlock}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Password</Text>
              <View style={[styles.fieldRow, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}>
                <Text style={[styles.fieldValue, { color: colors.text, flex: 1 }]} numberOfLines={1}>
                  {revealed ? entry.password : '••••••••••••'}
                </Text>
                <TouchableOpacity onPress={() => setRevealed(r => !r)} hitSlop={10} style={styles.fieldIcon}>
                  <Ionicons name={revealed ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleCopyPassword} hitSlop={10} style={styles.fieldIcon}>
                  <Ionicons name={copiedField === 'password' ? 'checkmark' : 'copy-outline'} size={18} color={copiedField === 'password' ? colors.success : colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            {entry.url ? (
              <FieldRow
                label="Website / App URL"
                value={entry.url}
                onCopy={() => copyPlain(entry.url!)}
                onPress={() => Linking.openURL(entry.url!.startsWith('http') ? entry.url! : `https://${entry.url}`)}
              />
            ) : null}

            {entry.notes ? (
              <View style={styles.fieldBlock}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Notes</Text>
                <ExpandableText
                  text={entry.notes}
                  boxStyle={[styles.notes, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}
                  textStyle={{ color: colors.text, fontSize: 14, lineHeight: 20 }}
                />
              </View>
            ) : null}

            <View style={styles.actions}>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.cardAlt }]} onPress={() => onEdit(entry)}>
                <Ionicons name="create-outline" size={17} color={colors.text} />
                <Text style={[styles.actionText, { color: colors.text }]}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.dangerSoft }]} onPress={() => setConfirmDelete(true)}>
                <Ionicons name="trash-outline" size={17} color={colors.danger} />
                <Text style={[styles.actionText, { color: colors.danger }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>

      <ConfirmDialog
        visible={confirmDelete}
        title="Delete entry?"
        message={`"${entry.title}" will be permanently removed from your vault.`}
        confirmLabel="Delete"
        destructive
        onCancel={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
      />
    </Modal>
  );
}

function FieldRow({ label, value, onCopy, onPress, copied }: { label: string; value: string; onCopy?: () => void; onPress?: () => void; copied?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={styles.fieldBlock}>
      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{label}</Text>
      <TouchableOpacity
        activeOpacity={onPress ? 0.7 : 1}
        onPress={onPress}
        style={[styles.fieldRow, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}>
        <Text style={[styles.fieldValue, { color: onPress ? colors.primaryLight : colors.text, flex: 1 }]} numberOfLines={1}>
          {value}
        </Text>
        {onCopy ? (
          <TouchableOpacity onPress={onCopy} hitSlop={10} style={styles.fieldIcon}>
            <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={18} color={copied ? colors.success : colors.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, maxHeight: '88%', paddingTop: 10, ...contentBounds },
  grabber: { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(140,150,160,0.4)', alignSelf: 'center', marginBottom: 14 },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16 },
  title: { fontSize: 18, fontWeight: '800' },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.pill, marginTop: 5 },
  badgeText: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.3 },
  body: { paddingHorizontal: 20, paddingBottom: 30 },
  fieldBlock: { marginBottom: 16 },
  fieldLabel: { fontSize: 11.5, fontWeight: '700', marginBottom: 6, letterSpacing: 0.3, textTransform: 'uppercase' },
  fieldRow: { flexDirection: 'row', alignItems: 'center', borderRadius: RADIUS.md, borderWidth: 1, paddingHorizontal: 14, height: 50 },
  fieldValue: { fontSize: 15 },
  fieldIcon: { marginLeft: 10 },
  notes: { borderRadius: RADIUS.md, borderWidth: 1, padding: 14 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 13, borderRadius: RADIUS.md },
  actionText: { fontSize: 14, fontWeight: '700' },
});
