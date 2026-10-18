export interface Artwork {
  id: string;
  title: string;
  artist: { name: string }[];
  price: number | null;
  currency: string | null;
  primaryImage: { url: string; altText: string | null } | null;
}

export interface ArtworkPage {
  data: Artwork[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export type ArtworkSortValue = 'year_asc' | 'year_desc' | 'price_asc' | 'price_desc';

export interface ArtworkRequest {
  signal?: AbortSignal;
  sort?: ArtworkSortValue;
  filters?: ArtworkFilterValues;
}

function apiUrl(): URL {
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL;
  if (!configuredUrl) {
    throw new Error('Set EXPO_PUBLIC_API_URL to an address reachable from this device.');
  }
  return new URL(configuredUrl.endsWith('/') ? configuredUrl : `${configuredUrl}/`);
}

export function resolveArtworkImageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  try {
    if (/^https?:\/\//i.test(path)) return new URL(path).toString();
    const base = apiUrl();
    return new URL(path, base.origin).toString();
  } catch {
    return null;
  }
}

export async function getArtworks(options: ArtworkRequest = {}): Promise<ArtworkPage> {
  const url = new URL('artworks', apiUrl());
  url.searchParams.set('page', '1');
  url.searchParams.set('limit', '21');
  url.searchParams.set('sort', options.sort ?? 'year_desc');
  if (options.filters?.yearStart !== undefined) {
    url.searchParams.set('yearStart', String(options.filters.yearStart));
  }
  if (options.filters?.yearEnd !== undefined) {
    url.searchParams.set('yearEnd', String(options.filters.yearEnd));
  }
  const response = await fetch(url.toString(), {
    signal: options.signal ?? new AbortController().signal,
  });
  if (!response.ok) throw new Error('Unable to load artworks.');
  return response.json() as Promise<ArtworkPage>;
}
import type { ArtworkFilterValues } from '../artworks/filters';

