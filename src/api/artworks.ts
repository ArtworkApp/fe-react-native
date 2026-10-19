import type { ArtworkFilterValues } from '../artworks/filters';
import { apiUrl } from './base-url';

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
  if (options.filters?.artistId !== undefined) {
    url.searchParams.set('artistId', options.filters.artistId);
  }
  if (options.filters?.artworkTypeId !== undefined) {
    url.searchParams.set('artworkTypeId', options.filters.artworkTypeId);
  }
  if (options.filters?.materialIds?.length) {
    url.searchParams.set('materialIds', options.filters.materialIds.join(','));
  }
  if (options.filters?.yearStart !== undefined) {
    url.searchParams.set('yearStart', String(options.filters.yearStart));
  }
  if (options.filters?.yearEnd !== undefined) {
    url.searchParams.set('yearEnd', String(options.filters.yearEnd));
  }
  if (options.filters?.country !== undefined) {
    url.searchParams.set('country', options.filters.country);
  }
  const response = await fetch(url.toString(), {
    signal: options.signal ?? new AbortController().signal,
  });
  if (!response.ok) throw new Error('Unable to load artworks.');
  const payload: unknown = await response.json();
  if (typeof payload !== 'object' || payload === null || !('data' in payload) ||
      !Array.isArray((payload as { data?: unknown }).data) || !('pagination' in payload) ||
      typeof (payload as { pagination?: unknown }).pagination !== 'object' ||
      (payload as { pagination?: unknown }).pagination === null) {
    throw new Error('Invalid artworks response.');
  }
  return payload as ArtworkPage;
}

