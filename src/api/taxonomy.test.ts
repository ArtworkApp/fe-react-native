import { getArtworkTypes, getMaterials } from './taxonomy';

afterEach(() => jest.restoreAllMocks());

test('loads active artwork types from the backend', async () => {
  process.env.EXPO_PUBLIC_API_URL = 'http://192.168.1.8:3001/api/v1';
  const data = [{ id: '1', name: 'Painting', active: true }];
  const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
    ok: true, json: async () => ({ data }),
  } as Response);

  await expect(getArtworkTypes()).resolves.toEqual(data);
  expect(fetchMock).toHaveBeenCalledWith(
    'http://192.168.1.8:3001/api/v1/artwork-types',
    expect.objectContaining({ signal: expect.any(AbortSignal) }),
  );
});

test('loads materials with their associated artwork type IDs', async () => {
  process.env.EXPO_PUBLIC_API_URL = 'http://192.168.1.8:3001/api/v1';
  const data = [{ id: '2', name: 'Oil', active: true, artworkTypeId: '1',
    artworkType: { id: '1', name: 'Painting' } }];
  const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
    ok: true, json: async () => ({ data }),
  } as Response);

  await expect(getMaterials()).resolves.toEqual(data);
  expect(fetchMock).toHaveBeenCalledWith(
    'http://192.168.1.8:3001/api/v1/materials',
    expect.objectContaining({ signal: expect.any(AbortSignal) }),
  );
});
