import { getArtists } from './artists';

test('searches the backend for at most 21 artists', async () => {
  process.env.EXPO_PUBLIC_API_URL = 'http://192.168.1.8:3001/api/v1';
  const response = { data: [{ id: '42', name: 'Claude Monet', country: 'France' }] };
  const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
    ok: true, json: async () => response,
  } as Response);

  await expect(getArtists({ search: 'monet' })).resolves.toEqual(response.data);
  expect(fetchMock).toHaveBeenCalledWith(
    'http://192.168.1.8:3001/api/v1/artists?search=monet&limit=21',
    expect.objectContaining({ signal: expect.any(AbortSignal) }),
  );
  fetchMock.mockRestore();
});
