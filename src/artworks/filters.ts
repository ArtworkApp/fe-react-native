import type { Material } from '../api/taxonomy';

export interface ArtworkFilterValues {
  artistId?: string;
  artworkTypeId?: string;
  materialIds?: string[];
  yearStart?: number;
  yearEnd?: number;
}

export type YearRangeResult =
  | { filters: ArtworkFilterValues; error?: never }
  | { error: string; filters?: never };

function parseYear(value: string): number | undefined | null {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (!/^\d{1,4}$/.test(trimmed)) return null;
  return Number(trimmed);
}

export function parseYearRange(from: string, to: string): YearRangeResult {
  const yearStart = parseYear(from);
  const yearEnd = parseYear(to);
  if (yearStart === null || yearEnd === null) {
    return { error: 'Enter years from 0000 to 9999.' };
  }
  if (yearStart !== undefined && yearEnd !== undefined && yearStart > yearEnd) {
    return { error: 'From year must not exceed To year.' };
  }
  return { filters: { ...(yearStart !== undefined && { yearStart }),
    ...(yearEnd !== undefined && { yearEnd }) } };
}

export function hasActiveFilters(filters: ArtworkFilterValues): boolean {
  return filters.artistId !== undefined || filters.artworkTypeId !== undefined ||
    Boolean(filters.materialIds?.length) || filters.yearStart !== undefined ||
    filters.yearEnd !== undefined;
}

export function selectArtworkType(filters: ArtworkFilterValues, typeId: string | undefined,
  materials: Material[]): ArtworkFilterValues {
  const materialIds = typeId
    ? (filters.materialIds ?? []).filter((id) => materials.some((material) =>
      material.id === id && material.artworkTypeId === typeId))
    : filters.materialIds ?? [];
  const next = { ...filters, materialIds };
  if (typeId) next.artworkTypeId = typeId;
  else delete next.artworkTypeId;
  return next;
}

export function toggleMaterial(filters: ArtworkFilterValues, materialId: string): ArtworkFilterValues {
  const selected = filters.materialIds ?? [];
  const materialIds = selected.includes(materialId)
    ? selected.filter((id) => id !== materialId)
    : [...selected, materialId];
  return { ...filters, materialIds };
}
