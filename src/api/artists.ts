import { apiUrl } from './base-url';

export interface ArtistOption {
  id: string;
  name: string;
  country: string | null;
}

interface ArtistSearchOptions {
  search: string;
  signal?: AbortSignal;
}

export async function getArtists(options: ArtistSearchOptions): Promise<ArtistOption[]> {
  const url = new URL('artists', apiUrl());
  url.searchParams.set('search', options.search.trim());
  url.searchParams.set('limit', '21');
  const response = await fetch(url.toString(), {
    signal: options.signal ?? new AbortController().signal,
  });
  if (!response.ok) throw new Error('Artist search failed.');
  const payload: unknown = await response.json();
  if (typeof payload !== 'object' || payload === null || !('data' in payload) ||
      !Array.isArray(payload.data)) {
    throw new Error('Invalid artist search response.');
  }
  return payload.data as ArtistOption[];
}
