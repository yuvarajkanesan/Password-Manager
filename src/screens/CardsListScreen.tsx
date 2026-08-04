import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { useVault } from '../contexts/VaultContext';
import EmptyState from '../components/EmptyState';
import CardDetailModal from './CardDetailModal';
import AddEditCardModal from './AddEditCardModal';
import { last4 } from '../utils/cardUtils';
import { RADIUS, elevation } from '../constants/theme';
import type { CardEntry } from '../types/vault';

export default function CardsListScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { cards } = useVault();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<CardEntry | null>(null);
  const [editing, setEditing] = useState<CardEntry | null>(null);
  const [addVisible, setAddVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const scoped = q
      ? cards.filter(c => c.title.toLowerCase().includes(q) || (c.bankName || '').toLowerCase().includes(q) || c.cardNumber.includes(q))
      : cards;
    return [...scoped].sort((a, b) => a.title.localeCompare(b.title));
  }, [cards, query]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient colors={colors.headerGradient} style={[styles.hero, { paddingTop: insets.top + 18 }]}>
        <Text style={styles.heroTitle}>Cards</Text>
        <Text style={styles.heroSubtitle}>Credit & debit cards</Text>
        <View style={[styles.searchBar, { backgroundColor: 'rgba(255,255,255,0.14)' }]}>
          <Ionicons name="search" size={17} color="rgba(255,255,255,0.75)" />
          <View style={{ flex: 1 }}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search cards"
              placeholderTextColor="rgba(255,255,255,0.65)"
              style={styles.searchInput}
            />
          </View>
        </View>
      </LinearGradient>

      {filtered.length === 0 ? (
        cards.length === 0 ? (
          <EmptyState icon="card-outline" title="No cards yet" message="Tap the + button to save your first credit or debit card." />
        ) : (
          <EmptyState icon="search-outline" title="No matches" message="Try a different search term." />
        )
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.row, { backgroundColor: colors.card }, elevation(colors.shadow, 'sm')]}
              activeOpacity={0.75}
              onPress={() => setSelected(item)}>
              <View style={[styles.iconWrap, { backgroundColor: colors.official + '22' }]}>
                <Ionicons name="card" size={20} color={colors.official} />
              </View>
              <View style={styles.rowText}>
                <Text style={[styles.rowTitle, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
                <Text style={[styles.rowSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                  {item.network} •••• {last4(item.cardNumber) || '----'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.tabInactive} />
            </TouchableOpacity>
          )}
        />
      )}

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.official }, elevation(colors.shadow, 'lg')]}
        activeOpacity={0.85}
        onPress={() => setAddVisible(true)}>
        <Ionicons name="add" size={28} color={colors.white} />
      </TouchableOpacity>

      <CardDetailModal
        visible={!!selected}
        card={selected}
        onClose={() => setSelected(null)}
        onEdit={cardToEdit => {
          setSelected(null);
          setEditing(cardToEdit);
          setEditVisible(true);
        }}
      />

      <AddEditCardModal visible={addVisible} onClose={() => setAddVisible(false)} />
      <AddEditCardModal
        visible={editVisible}
        card={editing}
        onClose={() => {
          setEditVisible(false);
          setEditing(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: 20, paddingBottom: 22, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  heroTitle: { fontSize: 24, fontWeight: '800', color: '#fff' },
  heroSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 3, marginBottom: 16 },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: RADIUS.md, paddingHorizontal: 14, height: 44 },
  searchInput: { color: '#fff', fontSize: 14.5, height: '100%' },
  listContent: { padding: 16, paddingBottom: 100 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: RADIUS.md, marginBottom: 10 },
  iconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1, marginLeft: 12 },
  rowTitle: { fontSize: 15, fontWeight: '700' },
  rowSubtitle: { fontSize: 12.5, marginTop: 2, letterSpacing: 0.3 },
  fab: { position: 'absolute', right: 20, bottom: 24, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
});
