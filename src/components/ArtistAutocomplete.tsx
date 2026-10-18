import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { getArtists, type ArtistOption } from '../api/artists';

interface Props {
  selected: ArtistOption | null;
  onSelect: (artist: ArtistOption | null) => void;
}

export function ArtistAutocomplete({ selected, onSelect }: Props) {
  const [search, setSearch] = useState(selected?.name ?? '');
  const [results, setResults] = useState<ArtistOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const term = search.trim();
    if (term.length < 2 || selected?.name === term) {
      setResults([]);
      setLoading(false);
      setFailed(false);
      return;
    }
    const controller = new AbortController();
    setResults([]);
    setLoading(true);
    setFailed(false);
    const timeout = setTimeout(() => {
      getArtists({ search: term, signal: controller.signal }).then((artists) => {
        if (!controller.signal.aborted) setResults(artists);
      }).catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      }).finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    }, 300);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [search, selected, attempt]);

  function changeSearch(value: string) {
    setSearch(value);
    setResults([]);
    if (selected) onSelect(null);
  }

  function selectArtist(artist: ArtistOption | null) {
    setSearch(artist?.name ?? '');
    setResults([]);
    onSelect(artist);
  }

  return <View>
    <Text style={styles.label}>Artist</Text>
    <TextInput accessibilityLabel="Artist" autoCorrect={false} value={search}
      onChangeText={changeSearch} placeholder="Search artist name" style={styles.input} />
    {selected && <Pressable accessibilityRole="button" accessibilityLabel="Clear artist"
      style={styles.clear} onPress={() => selectArtist(null)}>
      <Text style={styles.clearText}>Clear artist</Text>
    </Pressable>}
    {search.trim().length >= 2 && !selected && <View style={styles.results}>
      <ScrollView testID="artist-results-scroll" nestedScrollEnabled
        keyboardShouldPersistTaps="handled" style={styles.resultsScroll}>
        {loading && <Text style={styles.message}>Searching artists...</Text>}
        {failed && <View>
          <Text style={styles.error}>Artist search failed.</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Retry artist search"
            style={styles.result} onPress={() => setAttempt((value) => value + 1)}>
            <Text style={styles.clearText}>Retry</Text>
          </Pressable>
        </View>}
        {!loading && !failed && results.length === 0 &&
          <Text style={styles.message}>No artists found</Text>}
        {!loading && !failed && results.map((artist) => <Pressable key={artist.id}
          accessibilityRole="button"
          accessibilityLabel={`${artist.name}${artist.country ? `, ${artist.country}` : ''}`}
          style={styles.result} onPress={() => selectArtist(artist)}>
          <Text style={styles.resultText}>{artist.name}</Text>
          {artist.country && <Text style={styles.country}>{artist.country}</Text>}
        </Pressable>)}
      </ScrollView>
    </View>}
  </View>;
}

const styles = StyleSheet.create({
  label: { color: '#1c1917', fontSize: 16, fontWeight: '600', marginBottom: 8 },
  input: { backgroundColor: '#fff', borderColor: '#d6d3d1', borderRadius: 10,
    borderWidth: 1, color: '#1c1917', fontSize: 16, minHeight: 48, paddingHorizontal: 12 },
  results: { borderColor: '#e7e5e4', borderRadius: 10, borderWidth: 1, marginTop: 6 },
  resultsScroll: { maxHeight: 220 },
  result: { borderBottomColor: '#e7e5e4', borderBottomWidth: 1, justifyContent: 'center',
    minHeight: 48, paddingHorizontal: 12 },
  resultText: { color: '#1c1917', fontSize: 15 },
  country: { color: '#57534e', fontSize: 13 },
  message: { color: '#57534e', padding: 12 },
  error: { color: '#b91c1c', padding: 12 },
  clear: { alignSelf: 'flex-start', justifyContent: 'center', minHeight: 44 },
  clearText: { color: '#1c1917', fontSize: 14, fontWeight: '600' },
});
