import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { useVault } from '../contexts/VaultContext';
import TextField from '../components/TextField';
import Button from '../components/Button';
import CardVisual from '../components/CardVisual';
import CardScanScreen from './CardScanScreen';
import { formatCardNumberInput } from '../utils/cardUtils';
import type { CardOcrResult } from '../utils/cardOcr';
import { RADIUS } from '../constants/theme';
import type { CardEntry, CardNetwork } from '../types/vault';

const NETWORKS: CardNetwork[] = ['Visa', 'Mastercard', 'RuPay', 'Amex', 'Other'];

type AddEditCardModalProps = {
  visible: boolean;
  card?: CardEntry | null;
  onClose: () => void;
};

export default function AddEditCardModal({ visible, card, onClose }: AddEditCardModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { addCard, updateCard } = useVault();
  const isEdit = !!card;

  const [title, setTitle] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [cvv, setCvv] = useState('');
  const [pin, setPin] = useState('');
  const [bankName, setBankName] = useState('');
  const [network, setNetwork] = useState<CardNetwork>('Visa');
  const [notes, setNotes] = useState('');
  const [titleError, setTitleError] = useState('');
  const [busy, setBusy] = useState(false);
  const [scanVisible, setScanVisible] = useState(false);

  useEffect(() => {
    if (visible) {
      setTitle(card?.title ?? '');
      setCardholderName(card?.cardholderName ?? '');
      setCardNumber(card?.cardNumber ?? '');
      setExpiryMonth(card?.expiryMonth ?? '');
      setExpiryYear(card?.expiryYear ?? '');
      setCvv(card?.cvv ?? '');
      setPin(card?.pin ?? '');
      setBankName(card?.bankName ?? '');
      setNetwork(card?.network ?? 'Visa');
      setNotes(card?.notes ?? '');
      setTitleError('');
    }
  }, [visible, card]);

  const previewCard: CardEntry = {
    id: 'preview',
    title,
    cardholderName,
    cardNumber,
    expiryMonth,
    expiryYear,
    cvv,
    pin,
    bankName,
    network,
    notes,
    createdAt: 0,
    updatedAt: 0,
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setTitleError('Give this card a nickname.');
      return;
    }
    setBusy(true);
    const payload = {
      title: title.trim(),
      cardholderName: cardholderName.trim(),
      cardNumber: cardNumber.replace(/\s/g, ''),
      expiryMonth: expiryMonth.trim(),
      expiryYear: expiryYear.trim(),
      cvv: cvv.trim(),
      pin: pin.trim(),
      bankName: bankName.trim(),
      network,
      notes,
    };
    if (isEdit && card) {
      await updateCard(card.id, payload);
    } else {
      await addCard(payload);
    }
    setBusy(false);
    onClose();
  };

  const handleScanned = (result: CardOcrResult) => {
    setScanVisible(false);
    if (result.cardNumber) setCardNumber(formatCardNumberInput(result.cardNumber));
    if (result.expiryMonth) setExpiryMonth(result.expiryMonth);
    if (result.expiryYear) setExpiryYear(result.expiryYear);
    if (result.cardholderName) setCardholderName(result.cardholderName);
    if (result.network) setNetwork(result.network);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} hitSlop={10}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{isEdit ? 'Edit Card' : 'New Card'}</Text>
          <View style={{ width: 24 }} />
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <View style={styles.previewWrap}>
              <CardVisual card={previewCard} revealed />
            </View>

            <TouchableOpacity style={[styles.scanBtn, { backgroundColor: colors.cardAlt }]} onPress={() => setScanVisible(true)}>
              <Ionicons name="camera-outline" size={17} color={colors.official} />
              <Text style={[styles.scanText, { color: colors.official }]}>Scan card with camera</Text>
            </TouchableOpacity>

            <View style={[styles.segment, { backgroundColor: colors.cardAlt }]}>
              {NETWORKS.map(n => (
                <TouchableOpacity
                  key={n}
                  style={[styles.segmentBtn, network === n && { backgroundColor: colors.official }]}
                  onPress={() => setNetwork(n)}>
                  <Text style={[styles.segmentLabel, { color: network === n ? colors.white : colors.textSecondary }]}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextField
              label="Nickname"
              icon="bookmark-outline"
              placeholder="e.g. HDFC Debit Card"
              value={title}
              onChangeText={setTitle}
              error={titleError}
            />
            <TextField
              label="Cardholder name"
              icon="person-outline"
              placeholder="Name on card"
              value={cardholderName}
              onChangeText={setCardholderName}
              autoCapitalize="words"
            />
            <TextField
              label="Card number"
              icon="card-outline"
              placeholder="0000 0000 0000 0000"
              value={cardNumber}
              onChangeText={v => setCardNumber(formatCardNumberInput(v))}
              keyboardType="number-pad"
            />

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <TextField
                  label="Expiry month"
                  placeholder="MM"
                  value={expiryMonth}
                  onChangeText={v => setExpiryMonth(v.replace(/\D/g, '').slice(0, 2))}
                  keyboardType="number-pad"
                  maxLength={2}
                />
              </View>
              <View style={{ flex: 1 }}>
                <TextField
                  label="Expiry year"
                  placeholder="YYYY"
                  value={expiryYear}
                  onChangeText={v => setExpiryYear(v.replace(/\D/g, '').slice(0, 4))}
                  keyboardType="number-pad"
                  maxLength={4}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <TextField
                  label="CVV"
                  icon="lock-closed-outline"
                  isPassword
                  placeholder="•••"
                  value={cvv}
                  onChangeText={v => setCvv(v.replace(/\D/g, '').slice(0, 4))}
                  keyboardType="number-pad"
                />
              </View>
              <View style={{ flex: 1 }}>
                <TextField
                  label="ATM PIN"
                  icon="lock-closed-outline"
                  isPassword
                  placeholder="••••"
                  value={pin}
                  onChangeText={v => setPin(v.replace(/\D/g, '').slice(0, 6))}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            <TextField
              label="Bank / Issuer (optional)"
              icon="business-outline"
              placeholder="e.g. HDFC Bank"
              value={bankName}
              onChangeText={setBankName}
            />
            <TextField
              label="Notes (optional)"
              icon="document-text-outline"
              placeholder="Anything else worth remembering"
              value={notes}
              onChangeText={setNotes}
              multiline
            />

            <Button label={isEdit ? 'Save Changes' : 'Save Card'} onPress={handleSave} loading={busy} style={styles.save} />
          </ScrollView>
        </KeyboardAvoidingView>
      </View>

      <CardScanScreen visible={scanVisible} onClose={() => setScanVisible(false)} onScanned={handleScanned} />
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
  content: { padding: 20, paddingBottom: 50 },
  previewWrap: { marginBottom: 14 },
  scanBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 12, borderRadius: RADIUS.md, marginBottom: 20 },
  scanText: { fontSize: 13.5, fontWeight: '700' },
  segment: { flexDirection: 'row', borderRadius: RADIUS.md, padding: 4, marginBottom: 20, flexWrap: 'wrap' },
  segmentBtn: { flex: 1, minWidth: 60, paddingVertical: 10, borderRadius: RADIUS.sm, alignItems: 'center' },
  segmentLabel: { fontSize: 12, fontWeight: '700' },
  row: { flexDirection: 'row', gap: 12 },
  save: { marginTop: 8 },
});
