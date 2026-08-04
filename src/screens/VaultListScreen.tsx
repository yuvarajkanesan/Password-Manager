import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { useVault } from '../contexts/VaultContext';
import EntryAvatar from '../components/EntryAvatar';
import EmptyState from '../components/EmptyState';
import EntryDetailModal from './EntryDetailModal';
import AddEditEntryModal from './AddEditEntryModal';
import { RADIUS, elevation } from '../constants/theme';
import type { EntryCategory, VaultEntry } from '../types/vault';

type VaultListScreenProps = {
  category: EntryCategory;
  title: string;
  subtitle: string;
};

export default function VaultListScreen({ category, title, subtitle }: VaultListScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { entries } = useVault();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<VaultEntry | null>(null);
  const [editing, setEditing] = useState<VaultEntry | null>(null);
  const [addVisible, setAddVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);

  const filtered = useMemo(() => {
    const list = entries.filter(e => e.category === category);
    const q = query.trim().toLowerCase();
    const scoped = q ? list.filter(e => e.title.toLowerCase().includes(q) || e.username.toLowerCase().includes(q)) : list;
    return [...scoped].sort((a, b) => a.title.localeCompare(b.title));
  }, [entries, category, query]);

  const accent = category === 'personal' ? colors.personal : colors.official;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient colors={colors.headerGradient} style={[styles.hero, { paddingTop: insets.top + 18 }]}>
        <Text style={styles.heroTitle}>{title}</Text>
        <Text style={styles.heroSubtitle}>{subtitle}</Text>
        <View style={[styles.searchBar, { backgroundColor: 'rgba(255,255,255,0.14)' }]}>
          <Ionicons name="search" size={17} color="rgba(255,255,255,0.75)" />
          <View style={{ flex: 1 }}>
            <SearchInput value={query} onChangeText={setQuery} placeholder={`Search ${title.toLowerCase()}`} />
          </View>
        </View>
      </LinearGradient>

      {filtered.length === 0 ? (
        entries.filter(e => e.category === category).length === 0 ? (
          <EmptyState
            icon={category === 'personal' ? 'person-circle-outline' : 'briefcase-outline'}
            title={`No ${title.toLowerCase()} yet`}
            message={`Tap the + button to save your first ${category} password.`}
          />
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
              <EntryAvatar title={item.title} category={item.category} />
              <View style={styles.rowText}>
                <Text style={[styles.rowTitle, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
                <Text style={[styles.rowSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                  {item.username || 'No username'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.tabInactive} />
            </TouchableOpacity>
          )}
        />
      )}

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: accent }, elevation(colors.shadow, 'lg')]}
        activeOpacity={0.85}
        onPress={() => setAddVisible(true)}>
        <Ionicons name="add" size={28} color={colors.white} />
      </TouchableOpacity>

      <EntryDetailModal
        visible={!!selected}
        entry={selected}
        onClose={() => setSelected(null)}
        onEdit={entryToEdit => {
          setSelected(null);
          setEditing(entryToEdit);
          setEditVisible(true);
        }}
      />

      <AddEditEntryModal visible={addVisible} category={category} onClose={() => setAddVisible(false)} />
      <AddEditEntryModal
        visible={editVisible}
        category={category}
        entry={editing}
        onClose={() => {
          setEditVisible(false);
          setEditing(null);
        }}
      />
    </View>
  );
}

function SearchInput({ value, onChangeText, placeholder }: { value: string; onChangeText: (v: string) => void; placeholder: string }) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="rgba(255,255,255,0.65)"
      style={styles.searchInput}
    />
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
  rowText: { flex: 1, marginLeft: 12 },
  rowTitle: { fontSize: 15, fontWeight: '700' },
  rowSubtitle: { fontSize: 12.5, marginTop: 2 },
  fab: { position: 'absolute', right: 20, bottom: 24, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
});
