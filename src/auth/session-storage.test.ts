import * as SecureStore from 'expo-secure-store';
import { clearTokens, loadTokens, saveTokens } from './session-storage';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const tokens = { accessToken: 'access.jwt', refreshToken: 'refresh.jwt' };

beforeEach(() => jest.resetAllMocks());

test('stores and restores a complete token pair', async () => {
  await saveTokens(tokens);
  expect(SecureStore.setItemAsync).toHaveBeenCalledWith(expect.any(String), JSON.stringify(tokens));
  jest.mocked(SecureStore.getItemAsync).mockResolvedValue(JSON.stringify(tokens));
  await expect(loadTokens()).resolves.toEqual(tokens);
});

test('returns null when no token pair is stored', async () => {
  jest.mocked(SecureStore.getItemAsync).mockResolvedValue(null);
  await expect(loadTokens()).resolves.toBeNull();
});

test.each(['not json', JSON.stringify({ accessToken: 'access.jwt' })])(
  'clears corrupt or incomplete stored credentials',
  async (stored) => {
    jest.mocked(SecureStore.getItemAsync).mockResolvedValue(stored);
    await expect(loadTokens()).resolves.toBeNull();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledTimes(1);
  },
);

test('deletes the stored credentials on request', async () => {
  await clearTokens();
  expect(SecureStore.deleteItemAsync).toHaveBeenCalledTimes(1);
});

test('clears any partial credentials when saving fails', async () => {
  jest.mocked(SecureStore.setItemAsync).mockRejectedValue(new Error('Storage unavailable'));
  await expect(saveTokens(tokens)).rejects.toThrow('Storage unavailable');
  expect(SecureStore.deleteItemAsync).toHaveBeenCalledTimes(1);
});
