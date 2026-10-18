import { getArtworks, resolveArtworkImageUrl } from './artworks';

describe('artwork API', () => {
  const originalUrl = process.env.EXPO_PUBLIC_API_URL;

  afterEach(() => {
    process.env.EXPO_PUBLIC_API_URL = originalUrl;
    jest.restoreAllMocks();
  });

  test('requests the first 21 available artworks using the backend default sort', async () => {
    process.env.EXPO_PUBLIC_API_URL = 'http://192.168.1.8:3001/api/v1';
    const response = { data: [], pagination: { page: 1, limit: 21, total: 0, totalPages: 0 } };
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({ ok: true, json: async () => response } as Response);

    await expect(getArtworks()).resolves.toEqual(response);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://192.168.1.8:3001/api/v1/artworks?page=1&limit=21&sort=year_desc',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  test('requests the selected backend sort', async () => {
    process.env.EXPO_PUBLIC_API_URL = 'http://192.168.1.8:3001/api/v1';
    jest.spyOn(global, 'fetch').mockResolvedValue({ ok: true, json: async () => ({ data: [] }) } as Response);

    await getArtworks({ sort: 'price_asc' });

    expect(global.fetch).toHaveBeenCalledWith(
      'http://192.168.1.8:3001/api/v1/artworks?page=1&limit=21&sort=price_asc',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  test('sends inclusive year filters to the backend', async () => {
    process.env.EXPO_PUBLIC_API_URL = 'http://192.168.1.8:3001/api/v1';
    jest.spyOn(global, 'fetch').mockResolvedValue({ ok: true, json: async () => ({ data: [] }) } as Response);

    await getArtworks({ filters: { yearStart: 0, yearEnd: 1950 } });

    expect(global.fetch).toHaveBeenCalledWith(
      'http://192.168.1.8:3001/api/v1/artworks?page=1&limit=21&sort=year_desc&yearStart=0&yearEnd=1950',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  test('sends the selected artist ID alongside the year range', async () => {
    process.env.EXPO_PUBLIC_API_URL = 'http://192.168.1.8:3001/api/v1';
    jest.spyOn(global, 'fetch').mockResolvedValue({ ok: true, json: async () => ({ data: [] }) } as Response);

    await getArtworks({ filters: { artistId: '42', yearStart: 1900 } });

    expect(global.fetch).toHaveBeenCalledWith(
      'http://192.168.1.8:3001/api/v1/artworks?page=1&limit=21&sort=year_desc&artistId=42&yearStart=1900',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  test('sends type and comma-separated material IDs', async () => {
    process.env.EXPO_PUBLIC_API_URL = 'http://192.168.1.8:3001/api/v1';
    jest.spyOn(global, 'fetch').mockResolvedValue({ ok: true, json: async () => ({ data: [] }) } as Response);

    await getArtworks({ filters: { artworkTypeId: '1', materialIds: ['2', '3'] } });

    expect(global.fetch).toHaveBeenCalledWith(
      'http://192.168.1.8:3001/api/v1/artworks?page=1&limit=21&sort=year_desc&artworkTypeId=1&materialIds=2%2C3',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  test('sends the selected artist country', async () => {
    process.env.EXPO_PUBLIC_API_URL = 'http://192.168.1.8:3001/api/v1';
    jest.spyOn(global, 'fetch').mockResolvedValue({ ok: true, json: async () => ({ data: [] }) } as Response);

    await getArtworks({ filters: { country: 'United Kingdom' } });

    expect(global.fetch).toHaveBeenCalledWith(
      'http://192.168.1.8:3001/api/v1/artworks?page=1&limit=21&sort=year_desc&country=United+Kingdom',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  test('resolves backend image paths against the API host', () => {
    process.env.EXPO_PUBLIC_API_URL = 'http://192.168.1.8:3001/api/v1';
    expect(resolveArtworkImageUrl('/api/v1/artworks/1/images/2')).toBe(
      'http://192.168.1.8:3001/api/v1/artworks/1/images/2',
    );
  });

  test('keeps an absolute image URL', () => {
    expect(resolveArtworkImageUrl('https://example.com/art.jpg')).toBe('https://example.com/art.jpg');
  });
});
