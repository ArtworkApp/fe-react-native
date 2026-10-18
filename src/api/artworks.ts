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

export async function getArtworks(signal: AbortSignal = new AbortController().signal): Promise<ArtworkPage> {
  const url = new URL('artworks', apiUrl());
  url.searchParams.set('page', '1');
  url.searchParams.set('limit', '21');
  url.searchParams.set('sort', 'year_desc');
  const response = await fetch(url.toString(), { signal });
  if (!response.ok) throw new Error('Unable to load artworks.');
  return response.json() as Promise<ArtworkPage>;
}
