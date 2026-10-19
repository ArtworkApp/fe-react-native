import { apiUrl } from './base-url';

export interface ArtworkType {
  id: string;
  name: string;
  active: boolean;
}

export interface Material extends ArtworkType {
  artworkTypeId: string;
  artworkType: { id: string; name: string } | null;
}

async function getLookup<T>(path: string, signal?: AbortSignal): Promise<T[]> {
  const response = await fetch(new URL(path, apiUrl()).toString(), {
    signal: signal ?? new AbortController().signal,
  });
  if (!response.ok) throw new Error(`Unable to load ${path}.`);
  const payload: unknown = await response.json();
  if (typeof payload !== 'object' || payload === null || !('data' in payload) ||
      !Array.isArray(payload.data)) {
    throw new Error(`Invalid ${path} response.`);
  }
  return payload.data as T[];
}

export function getArtworkTypes(signal?: AbortSignal): Promise<ArtworkType[]> {
  return getLookup<ArtworkType>('artwork-types', signal);
}

export function getMaterials(signal?: AbortSignal): Promise<Material[]> {
  return getLookup<Material>('materials', signal);
}
