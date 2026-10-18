import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { getArtworks, type Artwork, type ArtworkSortValue } from '../api/artworks';
import { hasActiveFilters, type ArtworkFilterValues } from '../artworks/filters';
import { ArtworkCard } from '../components/ArtworkCard';
import { ArtworkFilters } from '../components/ArtworkFilters';
import { ArtworkSort } from '../components/ArtworkSort';

type ListingState = 'loading' | 'ready' | 'error';

export default function ArtworkListingScreen() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [state, setState] = useState<ListingState>('loading');
  const [retry, setRetry] = useState(0);
  const [sort, setSort] = useState<ArtworkSortValue>('year_desc');
  const [filters, setFilters] = useState<ArtworkFilterValues>({});

  useEffect(() => {
    const controller = new AbortController();
    setState('loading');
    getArtworks({ signal: controller.signal, sort, filters }).then((page) => {
      if (controller.signal.aborted) return;
      setArtworks(page.data);
      setState('ready');
    }).catch(() => {
      if (!controller.signal.aborted) setState('error');
    });
    return () => controller.abort();
  }, [retry, sort, filters]);

  function changeSort(nextSort: ArtworkSortValue) {
    setState('loading');
    setSort(nextSort);
  }

  function changeFilters(nextFilters: ArtworkFilterValues) {
    if (nextFilters.artistId === filters.artistId &&
        nextFilters.artworkTypeId === filters.artworkTypeId &&
        (nextFilters.materialIds ?? []).join(',') === (filters.materialIds ?? []).join(',') &&
        nextFilters.yearStart === filters.yearStart &&
        nextFilters.yearEnd === filters.yearEnd) return;
    setState('loading');
    setFilters(nextFilters);
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <FlatList testID="artwork-grid" data={state === 'ready' ? artworks : []}
        numColumns={2} keyExtractor={(artwork) => artwork.id}
        renderItem={({ item }) => <View testID="artwork-column" style={styles.column}>
          <ArtworkCard artwork={item} />
        </View>}
        ListHeaderComponent={<View style={styles.header}>
          <Text style={styles.brand}>ArtworkApp</Text>
          <Text style={styles.heading}>Browse Art</Text>
          <Text style={styles.subheading}>Discover original artworks</Text>
          <View style={styles.controls}>
            <ArtworkFilters filters={filters} onApply={changeFilters} />
            <ArtworkSort sort={sort} onChange={changeSort} />
          </View>
        </View>}
        ListEmptyComponent={state === 'loading' ? (
          <View style={styles.skeletonGrid} accessibilityLabel="Loading artworks">
            {Array.from({ length: 6 }, (_, index) => <View key={index} style={styles.skeleton} />)}
          </View>
        ) : state === 'error' ? (
          <View style={styles.message} accessibilityRole="alert">
            <Text style={styles.messageTitle}>Unable to load artworks.</Text>
            <Text style={styles.messageBody}>Please try again.</Text>
            <Pressable style={styles.retry} accessibilityRole="button"
              onPress={() => setRetry((count) => count + 1)}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        ) : hasActiveFilters(filters) ? (
          <View style={styles.message}>
            <Text style={styles.messageTitle}>No artworks found.</Text>
            <Text style={styles.messageBody}>Try adjusting your filters.</Text>
            <Pressable style={styles.retry} accessibilityRole="button"
              accessibilityLabel="Clear Filters" onPress={() => changeFilters({})}>
              <Text style={styles.retryText}>Clear Filters</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.message}>
            <Text style={styles.messageTitle}>No artworks available yet.</Text>
            <Text style={styles.messageBody}>Please check back soon.</Text>
          </View>
        )}
        contentContainerStyle={styles.list} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafaf9' },
  list: { paddingHorizontal: 11, paddingBottom: 32, flexGrow: 1 },
  header: { paddingHorizontal: 5, paddingTop: 20, paddingBottom: 16 },
  controls: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 20 },
  brand: { color: '#57534e', fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  heading: { color: '#1c1917', fontSize: 28, fontWeight: '700', marginTop: 18 },
  subheading: { color: '#57534e', fontSize: 15, marginTop: 4 },
  column: { width: '50%' },
  skeletonGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  skeleton: { width: '47%', aspectRatio: 0.72, margin: '1.5%', borderRadius: 20,
    backgroundColor: '#e7e5e4' },
  message: { alignItems: 'center', padding: 32, gap: 12 },
  messageTitle: { fontSize: 18, fontWeight: '600', color: '#1c1917', textAlign: 'center' },
  messageBody: { color: '#57534e', textAlign: 'center' },
  retry: { backgroundColor: '#1c1917', borderRadius: 10, paddingHorizontal: 24,
    paddingVertical: 13, marginTop: 8, minHeight: 44 },
  retryText: { color: '#fff', fontWeight: '600' },
});
