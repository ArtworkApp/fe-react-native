import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { ArtworkSortValue } from '../api/artworks';

interface Props {
  sort: ArtworkSortValue;
  onChange: (sort: ArtworkSortValue) => void;
}

const SORT_OPTIONS: ReadonlyArray<{ label: string; value: ArtworkSortValue }> = [
  { label: 'Year: Oldest First', value: 'year_asc' },
  { label: 'Year: Newest First', value: 'year_desc' },
  { label: 'Price: Lowest First', value: 'price_asc' },
  { label: 'Price: Highest First', value: 'price_desc' },
];

export function ArtworkSort({ sort, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const selectedLabel = SORT_OPTIONS.find((option) => option.value === sort)?.label;

  function selectSort(value: ArtworkSortValue) {
    setOpen(false);
    if (value !== sort) onChange(value);
  }

  return (
    <>
      <Pressable accessibilityRole="button" accessibilityLabel="Sort artworks"
        accessibilityState={{ expanded: open }} style={styles.trigger}
        onPress={() => setOpen(true)}>
        <Text style={styles.triggerText}>Sort</Text>
        <Text style={styles.currentSort}>{selectedLabel}</Text>
      </Pressable>
      {open && <Modal animationType="slide" transparent visible onRequestClose={() => setOpen(false)}>
        <View style={styles.overlay}>
          <Pressable accessibilityRole="button" accessibilityLabel="Close sorting"
            style={styles.backdrop} onPress={() => setOpen(false)} />
          <SafeAreaView edges={['bottom']} style={styles.sheet} accessibilityViewIsModal>
            <Text style={styles.heading}>Sort By</Text>
            {SORT_OPTIONS.map((option) => (
              <Pressable key={option.value} accessibilityRole="radio"
                accessibilityLabel={option.label}
                accessibilityState={{ selected: option.value === sort }}
                style={styles.option} onPress={() => selectSort(option.value)}>
                <Text style={styles.optionText}>{option.label}</Text>
                {option.value === sort && <Text style={styles.checkmark}>✓</Text>}
              </Pressable>
            ))}
            <Pressable accessibilityRole="button" accessibilityLabel="Close sorting"
              style={styles.close} onPress={() => setOpen(false)}>
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
          </SafeAreaView>
        </View>
      </Modal>}
    </>
  );
}

const styles = StyleSheet.create({
  trigger: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: '#fff',
    borderColor: '#e7e5e4', borderRadius: 22, borderWidth: 1, flexDirection: 'row',
    gap: 8, minHeight: 44, paddingHorizontal: 15 },
  triggerText: { color: '#1c1917', fontSize: 14, fontWeight: '600' },
  currentSort: { color: '#57534e', fontSize: 13 },
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(28,25,23,0.5)' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 20 },
  heading: { color: '#1c1917', fontSize: 20, fontWeight: '700', marginBottom: 12 },
  option: { alignItems: 'center', borderBottomColor: '#e7e5e4', borderBottomWidth: 1,
    flexDirection: 'row', justifyContent: 'space-between', minHeight: 52 },
  optionText: { color: '#1c1917', fontSize: 16 },
  checkmark: { color: '#1c1917', fontSize: 19, fontWeight: '700' },
  close: { alignItems: 'center', justifyContent: 'center', minHeight: 48, marginTop: 10 },
  closeText: { color: '#57534e', fontSize: 15, fontWeight: '600' },
});
