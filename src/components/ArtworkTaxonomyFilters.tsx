import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ArtworkType, Material } from '../api/taxonomy';
import { selectArtworkType, toggleMaterial, type ArtworkFilterValues } from '../artworks/filters';
import type { LookupState } from '../hooks/useLookup';

interface Props {
  filters: ArtworkFilterValues;
  onChange: (filters: ArtworkFilterValues) => void;
  lookups: { types: LookupState<ArtworkType>; materials: LookupState<Material> };
}

export function ArtworkTaxonomyFilters({ filters, onChange, lookups }: Props) {
  const { types, materials } = lookups;
  const typeControlsDisabled = materials.data === null;
  const visibleMaterials = materials.data?.filter((material) =>
    !filters.artworkTypeId || material.artworkTypeId === filters.artworkTypeId);

  function changeType(typeId: string | undefined) {
    if (!materials.data) return;
    onChange(selectArtworkType(filters, typeId, materials.data));
  }

  return <View>
    <Text style={styles.heading}>Artwork type</Text>
    {types.data === null && !types.failed && <Text style={styles.message}>Loading artwork types...</Text>}
    {types.failed && <View>
      <Text style={styles.error}>Unable to load artwork types.</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Retry artwork types"
        style={styles.option} onPress={types.retry}>
        <Text style={styles.retryText}>Retry artwork types</Text>
      </Pressable>
    </View>}
    {types.data !== null && <View>
      <Pressable accessibilityRole="radio" accessibilityLabel="Artwork type: All"
        accessibilityState={{ selected: !filters.artworkTypeId, disabled: typeControlsDisabled }}
        disabled={typeControlsDisabled} style={styles.option} onPress={() => changeType(undefined)}>
        <Text style={styles.optionText}>All artwork types</Text>
        {!filters.artworkTypeId && <Text style={styles.checkmark}>✓</Text>}
      </Pressable>
      {types.data.map((type) => <Pressable key={type.id} accessibilityRole="radio"
        accessibilityLabel={`Artwork type: ${type.name}`}
        accessibilityState={{ selected: filters.artworkTypeId === type.id,
          disabled: typeControlsDisabled }} disabled={typeControlsDisabled}
        style={styles.option} onPress={() => changeType(type.id)}>
        <Text style={styles.optionText}>{type.name}</Text>
        {filters.artworkTypeId === type.id && <Text style={styles.checkmark}>✓</Text>}
      </Pressable>)}
    </View>}

    <Text style={styles.materialHeading}>Materials</Text>
    {materials.data === null && !materials.failed && <Text style={styles.message}>Loading materials...</Text>}
    {materials.failed && <View>
      <Text style={styles.error}>Unable to load materials.</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Retry materials"
        style={styles.option} onPress={materials.retry}>
        <Text style={styles.retryText}>Retry materials</Text>
      </Pressable>
    </View>}
    {visibleMaterials?.length === 0 && <Text style={styles.message}>No materials available.</Text>}
    {visibleMaterials?.map((material) => <Pressable key={material.id}
      accessibilityRole="checkbox" accessibilityLabel={`Material: ${material.name}`}
      accessibilityState={{ checked: filters.materialIds?.includes(material.id) ?? false }}
      style={styles.option} onPress={() => onChange(toggleMaterial(filters, material.id))}>
      <Text style={styles.optionText}>{material.name}</Text>
      <Text style={styles.checkmark}>{filters.materialIds?.includes(material.id) ? '☑' : '☐'}</Text>
    </Pressable>)}
  </View>;
}

const styles = StyleSheet.create({
  heading: { color: '#1c1917', fontSize: 16, fontWeight: '600', marginBottom: 8 },
  materialHeading: { color: '#1c1917', fontSize: 16, fontWeight: '600', marginBottom: 8,
    marginTop: 20 },
  option: { alignItems: 'center', borderBottomColor: '#e7e5e4', borderBottomWidth: 1,
    flexDirection: 'row', justifyContent: 'space-between', minHeight: 48, paddingHorizontal: 4 },
  optionText: { color: '#1c1917', fontSize: 15 },
  checkmark: { color: '#1c1917', fontSize: 18, fontWeight: '700' },
  message: { color: '#57534e', paddingVertical: 12 },
  error: { color: '#b91c1c', paddingVertical: 12 },
  retryText: { color: '#1c1917', fontSize: 14, fontWeight: '600' },
});
