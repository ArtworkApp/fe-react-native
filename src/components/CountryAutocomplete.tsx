import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { searchCountries } from '../util/countries';

interface Props {
  selected: string | undefined;
  onSelect: (country: string | undefined) => void;
}

export function CountryAutocomplete({ selected, onSelect }: Props) {
  const [query, setQuery] = useState(selected ?? '');
  const [open, setOpen] = useState(false);
  const matches = query.trim() ? searchCountries(query) : [];

  function changeQuery(value: string) {
    setQuery(value);
    setOpen(Boolean(value.trim()));
    if (selected) onSelect(undefined);
  }

  function chooseCountry(country: string | undefined) {
    setQuery(country ?? '');
    setOpen(false);
    onSelect(country);
  }

  return <View>
    <Text style={styles.label}>Artist country</Text>
    <TextInput accessibilityLabel="Artist country" autoCorrect={false}
      value={query} onFocus={() => setOpen(Boolean(query.trim()) && !selected)}
      onChangeText={changeQuery} placeholder="Search countries" style={styles.input} />
    {selected && <Pressable accessibilityRole="button" accessibilityLabel="Clear country"
      style={styles.clear} onPress={() => chooseCountry(undefined)}>
      <Text style={styles.clearText}>Clear country</Text>
    </Pressable>}
    {open && !selected && <ScrollView testID="country-results" nestedScrollEnabled
      keyboardShouldPersistTaps="handled" style={styles.results}>
      {matches.length === 0 && <Text style={styles.message}>No countries found</Text>}
      {matches.map((country) => <Pressable key={country} accessibilityRole="button"
        accessibilityLabel={country} style={styles.option}
        onPress={() => chooseCountry(country)}>
        <Text style={styles.optionText}>{country}</Text>
      </Pressable>)}
    </ScrollView>}
  </View>;
}

const styles = StyleSheet.create({
  label: { color: '#1c1917', fontSize: 16, fontWeight: '600', marginBottom: 8 },
  input: { backgroundColor: '#fff', borderColor: '#d6d3d1', borderRadius: 10,
    borderWidth: 1, color: '#1c1917', fontSize: 16, minHeight: 48, paddingHorizontal: 12 },
  results: { borderColor: '#e7e5e4', borderRadius: 10, borderWidth: 1,
    marginTop: 6, maxHeight: 220, width: '100%' },
  option: { borderBottomColor: '#e7e5e4', borderBottomWidth: 1,
    justifyContent: 'center', minHeight: 48, paddingHorizontal: 12 },
  optionText: { color: '#1c1917', fontSize: 15 },
  message: { color: '#57534e', padding: 12 },
  clear: { alignSelf: 'flex-start', justifyContent: 'center', minHeight: 44 },
  clearText: { color: '#1c1917', fontSize: 14, fontWeight: '600' },
});
