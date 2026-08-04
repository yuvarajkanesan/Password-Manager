import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { RADIUS, elevation } from '../constants/theme';
import { maskCardNumber, formatCardNumberDisplay } from '../utils/cardUtils';
import type { CardEntry } from '../types/vault';

export default function CardVisual({ card, revealed = false }: { card: CardEntry; revealed?: boolean }) {
  const { colors } = useTheme();
  const number = card.cardNumber ? (revealed ? formatCardNumberDisplay(card.cardNumber) : maskCardNumber(card.cardNumber)) : '•••• •••• •••• ••••';
  const expiry = card.expiryMonth && card.expiryYear ? `${card.expiryMonth.padStart(2, '0')}/${card.expiryYear.slice(-2)}` : 'MM/YY';

  return (
    <LinearGradient
      colors={['#0A2A45', '#0E4B66', '#8B6BD8']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, elevation(colors.shadow, 'md')]}>
      <View style={styles.topRow}>
        <Text style={styles.bank} numberOfLines={1}>{card.bankName || card.title || 'Card'}</Text>
        <View style={styles.networkBadge}>
          <Text style={styles.networkText}>{card.network.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.chip} />

      <Text style={styles.number}>{number}</Text>

      <View style={styles.bottomRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.smallLabel}>CARD HOLDER</Text>
          <Text style={styles.holder} numberOfLines={1}>{card.cardholderName || '—'}</Text>
        </View>
        <View>
          <Text style={styles.smallLabel}>EXPIRES</Text>
          <Text style={styles.holder}>{expiry}</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: RADIUS.lg, padding: 20, aspectRatio: 1.65, justifyContent: 'space-between' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  bank: { color: 'rgba(255,255,255,0.92)', fontSize: 14.5, fontWeight: '700', flex: 1, marginRight: 10 },
  networkBadge: { backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 9, paddingVertical: 4, borderRadius: RADIUS.pill },
  networkText: { color: '#fff', fontSize: 10.5, fontWeight: '800', letterSpacing: 0.5 },
  chip: { width: 38, height: 28, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.55)' },
  number: { color: '#fff', fontSize: 19.5, fontWeight: '700', letterSpacing: 2, fontFamily: 'monospace' },
  bottomRow: { flexDirection: 'row', alignItems: 'flex-end' },
  smallLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 9, fontWeight: '700', letterSpacing: 0.5, marginBottom: 3 },
  holder: { color: '#fff', fontSize: 13.5, fontWeight: '700', letterSpacing: 0.5 },
});
