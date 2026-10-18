import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet,
  Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { ArtistOption } from '../api/artists';
import { getArtworkTypes, getMaterials } from '../api/taxonomy';
import { type ArtworkFilterValues, parseYearRange } from '../artworks/filters';
import { useLookup } from '../hooks/useLookup';
import { ArtistAutocomplete } from './ArtistAutocomplete';
import { ArtworkTaxonomyFilters } from './ArtworkTaxonomyFilters';

interface Props {
  filters: ArtworkFilterValues;
  onApply: (filters: ArtworkFilterValues) => void;
}

export function ArtworkFilters({ filters, onApply }: Props) {
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [appliedArtist, setAppliedArtist] = useState<ArtistOption | null>(null);
  const [draftArtist, setDraftArtist] = useState<ArtistOption | null>(null);
  const [draftTaxonomy, setDraftTaxonomy] = useState<ArtworkFilterValues>({});
  const types = useLookup(open, getArtworkTypes);
  const materials = useLookup(open, getMaterials);

  function openSheet() {
    setFrom(filters.yearStart === undefined ? '' : String(filters.yearStart));
    setTo(filters.yearEnd === undefined ? '' : String(filters.yearEnd));
    setError(null);
    setDraftArtist(appliedArtist?.id === filters.artistId ? appliedArtist : null);
    setDraftTaxonomy({ artworkTypeId: filters.artworkTypeId,
      materialIds: filters.materialIds ?? [] });
    setOpen(true);
  }

  function apply() {
    const result = parseYearRange(from, to);
    if (!result.filters) {
      setError(result.error);
      return;
    }
    setOpen(false);
    setAppliedArtist(draftArtist);
    onApply({ ...result.filters, ...(draftArtist && { artistId: draftArtist.id }),
      ...(draftTaxonomy.artworkTypeId && { artworkTypeId: draftTaxonomy.artworkTypeId }),
      ...(draftTaxonomy.materialIds?.length && { materialIds: draftTaxonomy.materialIds }) });
  }

  return <>
    <Pressable accessibilityRole="button" accessibilityLabel="Filter artworks"
      accessibilityState={{ expanded: open }} style={styles.trigger} onPress={openSheet}>
      <Text style={styles.triggerText}>Filter</Text>
    </Pressable>
    {open && <Modal animationType="slide" transparent visible onRequestClose={() => setOpen(false)}>
      <KeyboardAvoidingView testID="filter-keyboard-avoiding-view"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
        <Pressable accessibilityRole="button" accessibilityLabel="Cancel filters"
          style={styles.backdrop} onPress={() => setOpen(false)} />
        <SafeAreaView edges={['bottom']} style={styles.sheet} accessibilityViewIsModal>
          <ScrollView testID="filter-sheet-scroll" keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag" contentContainerStyle={styles.sheetContent}>
            <Text style={styles.heading}>Filters</Text>
            <View style={styles.artist}>
              <ArtistAutocomplete selected={draftArtist} onSelect={setDraftArtist} />
            </View>
            <ArtworkTaxonomyFilters filters={draftTaxonomy} onChange={setDraftTaxonomy}
              lookups={{ types, materials }} />
            <Text style={styles.sectionHeading}>Year</Text>
            <View style={styles.inputs}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>From</Text>
                <TextInput accessibilityLabel="From" keyboardType="number-pad" maxLength={4}
                  value={from} onChangeText={(value) => { setFrom(value); setError(null); }}
                  placeholder="0000" style={styles.input} />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>To</Text>
                <TextInput accessibilityLabel="To" keyboardType="number-pad" maxLength={4}
                  value={to} onChangeText={(value) => { setTo(value); setError(null); }}
                  placeholder="9999" style={styles.input} />
              </View>
            </View>
            {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
            <Pressable accessibilityRole="button" accessibilityLabel="Apply Filters"
              style={styles.apply} onPress={apply}>
              <Text style={styles.applyText}>Apply Filters</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Cancel"
              style={styles.cancel} onPress={() => setOpen(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>}
  </>;
}

const styles = StyleSheet.create({
  trigger: { alignItems: 'center', backgroundColor: '#fff', borderColor: '#e7e5e4',
    borderRadius: 22, borderWidth: 1, justifyContent: 'center', minHeight: 44,
    paddingHorizontal: 18 },
  triggerText: { color: '#1c1917', fontSize: 14, fontWeight: '600' },
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(28,25,23,0.5)' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '85%' },
  sheetContent: { paddingHorizontal: 20, paddingTop: 20 },
  heading: { color: '#1c1917', fontSize: 20, fontWeight: '700', marginBottom: 20 },
  artist: { marginBottom: 20 },
  sectionHeading: { color: '#1c1917', fontSize: 16, fontWeight: '600', marginBottom: 12,
    marginTop: 20 },
  inputs: { flexDirection: 'row', gap: 12 },
  inputGroup: { flex: 1 },
  label: { color: '#57534e', fontSize: 14, marginBottom: 8 },
  input: { backgroundColor: '#fff', borderColor: '#d6d3d1', borderRadius: 10,
    borderWidth: 1, color: '#1c1917', fontSize: 16, minHeight: 48, paddingHorizontal: 12 },
  error: { color: '#b91c1c', marginTop: 12 },
  apply: { alignItems: 'center', backgroundColor: '#1c1917', borderRadius: 10,
    justifyContent: 'center', minHeight: 48, marginTop: 24 },
  applyText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cancel: { alignItems: 'center', justifyContent: 'center', minHeight: 48, marginTop: 8 },
  cancelText: { color: '#57534e', fontSize: 15, fontWeight: '600' },
});
