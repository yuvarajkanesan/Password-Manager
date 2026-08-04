import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { useVault } from '../contexts/VaultContext';
import CardVisual from '../components/CardVisual';
import ConfirmDialog from '../components/ConfirmDialog';
import { copyWithAutoClear, copyPlain } from '../utils/clipboard';
import { RADIUS, elevation } from '../constants/theme';
import type { CardEntry } from '../types/vault';

type CardDetailModalProps = {
  visible: boolean;
  card: CardEntry | null;
  onClose: () => void;
  onEdit: (card: CardEntry) => void;
};

export default function CardDetailModal({ visible, card, onClose, onEdit }: CardDetailModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { deleteCard } = useVault();
  const [revealed, setRevealed] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!card) return null;

  const flashCopied = (field: string) => {
    setCopiedField(field);
    setTimeout(() => setCopiedField(prev => (prev === field ? null : prev)), 1500);
  };

  const handleDelete = async () => {
    setConfirmDelete(false);
    await deleteCard(card.id);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent>
      <View style={[styles.overlay, { backgroundColor: colors.overlay, paddingTop: insets.top + 30 }]}>
        <View style={[styles.sheet, { backgroundColor: colors.card }, elevation(colors.shadow, 'lg')]}>
          <View style={styles.grabber} />
          <View style={styles.headerRow}>
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{card.title}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.body}>
            <View style={styles.cardWrap}>
              <CardVisual card={card} revealed={revealed} />
              <TouchableOpacity
                style={[styles.revealBtn, { backgroundColor: colors.cardAlt }]}
                onPress={() => setRevealed(r => !r)}>
                <Ionicons name={revealed ? 'eye-off-outline' : 'eye-outline'} size={15} color={colors.text} />
                <Text style={[styles.revealText, { color: colors.text }]}>{revealed ? 'Hide number' : 'Reveal number'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.copyNumberBtn, { backgroundColor: colors.cardAlt }]}
                onPress={() => {
                  copyWithAutoClear(card.cardNumber);
                  flashCopied('number');
                }}>
                <Ionicons name={copiedField === 'number' ? 'checkmark' : 'copy-outline'} size={15} color={copiedField === 'number' ? colors.success : colors.text} />
                <Text style={[styles.revealText, { color: colors.text }]}>Copy number</Text>
              </TouchableOpacity>
            </View>

            <FieldRow label="CVV" value={card.cvv} masked field="cvv" copiedField={copiedField} onCopy={() => { copyWithAutoClear(card.cvv); flashCopied('cvv'); }} />
            <FieldRow label="ATM PIN" value={card.pin} masked field="pin" copiedField={copiedField} onCopy={() => { copyWithAutoClear(card.pin); flashCopied('pin'); }} />
            {card.bankName ? (
              <FieldRow label="Bank / Issuer" value={card.bankName} field="bank" copiedField={copiedField} onCopy={() => { copyPlain(card.bankName!); flashCopied('bank'); }} />
            ) : null}

            {card.notes ? (
              <View style={styles.fieldBlock}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Notes</Text>
                <Text style={[styles.notes, { color: colors.text, backgroundColor: colors.cardAlt, borderColor: colors.border }]}>
                  {card.notes}
                </Text>
              </View>
            ) : null}

            <View style={styles.actions}>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.cardAlt }]} onPress={() => onEdit(card)}>
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
        title="Delete card?"
        message={`"${card.title}" will be permanently removed from your vault.`}
        confirmLabel="Delete"
        destructive
        onCancel={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
      />
    </Modal>
  );
}

function FieldRow({
  label,
  value,
  masked,
  field,
  copiedField,
  onCopy,
}: {
  label: string;
  value: string;
  masked?: boolean;
  field: string;
  copiedField: string | null;
  onCopy: () => void;
}) {
  const { colors } = useTheme();
  const [revealed, setRevealed] = useState(false);
  const display = masked && !revealed ? '•'.repeat(Math.max(value.length, 3)) : value || '—';
  const copied = copiedField === field;

  return (
    <View style={styles.fieldBlock}>
      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{label}</Text>
      <View style={[styles.fieldRow, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}>
        <Text style={[styles.fieldValue, { color: colors.text, flex: 1 }]} numberOfLines={1}>{display}</Text>
        {masked ? (
          <TouchableOpacity onPress={() => setRevealed(r => !r)} hitSlop={10} style={styles.fieldIcon}>
            <Ionicons name={revealed ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity onPress={onCopy} hitSlop={10} style={styles.fieldIcon}>
          <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={18} color={copied ? colors.success : colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, maxHeight: '90%', paddingTop: 10 },
  grabber: { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(140,150,160,0.4)', alignSelf: 'center', marginBottom: 14 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 16 },
  title: { fontSize: 18, fontWeight: '800', flex: 1, marginRight: 12 },
  body: { paddingHorizontal: 20, paddingBottom: 30 },
  cardWrap: { marginBottom: 20 },
  revealBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: RADIUS.md, marginTop: 12 },
  copyNumberBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: RADIUS.md, marginTop: 8 },
  revealText: { fontSize: 13, fontWeight: '700' },
  fieldBlock: { marginBottom: 16 },
  fieldLabel: { fontSize: 11.5, fontWeight: '700', marginBottom: 6, letterSpacing: 0.3, textTransform: 'uppercase' },
  fieldRow: { flexDirection: 'row', alignItems: 'center', borderRadius: RADIUS.md, borderWidth: 1, paddingHorizontal: 14, height: 50 },
  fieldValue: { fontSize: 15 },
  fieldIcon: { marginLeft: 10 },
  notes: { fontSize: 14, lineHeight: 20, borderRadius: RADIUS.md, borderWidth: 1, padding: 14 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 13, borderRadius: RADIUS.md },
  actionText: { fontSize: 14, fontWeight: '700' },
});
