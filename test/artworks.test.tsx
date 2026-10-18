import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import ArtworkListingScreen from '../src/app/artworks';
import { getArtworks } from '../src/api/artworks';

jest.mock('../src/api/artworks', () => ({
  getArtworks: jest.fn(),
  resolveArtworkImageUrl: jest.fn(() => null),
}));

const mockedGetArtworks = jest.mocked(getArtworks);

afterEach(() => jest.resetAllMocks());

test('shows a two-column artwork listing from the backend', async () => {
  mockedGetArtworks.mockResolvedValue({
    data: [
      { id: '1', title: 'Blue Garden', artist: [{ name: 'Ada' }], price: null,
        currency: null, primaryImage: null },
      { id: '2', title: 'Red Garden', artist: [], price: null,
        currency: null, primaryImage: null },
    ],
    pagination: { page: 1, limit: 21, total: 2, totalPages: 1 },
  });
  render(<ArtworkListingScreen />);
  await act(async () => { await Promise.resolve(); });
  expect(await screen.findByText('Blue Garden')).toBeTruthy();
  expect(screen.getByText('Red Garden')).toBeTruthy();
  expect(screen.getAllByTestId('artwork-column')).toHaveLength(2);
});

test('shows an empty catalog state', async () => {
  mockedGetArtworks.mockResolvedValue({ data: [], pagination: {
    page: 1, limit: 21, total: 0, totalPages: 0,
  } });
  render(<ArtworkListingScreen />);
  await act(async () => { await Promise.resolve(); });
  expect(await screen.findByText('No artworks available yet.')).toBeTruthy();
});

test('retries an initial request failure', async () => {
  mockedGetArtworks.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({
    data: [], pagination: { page: 1, limit: 21, total: 0, totalPages: 0 },
  });
  render(<ArtworkListingScreen />);
  await act(async () => { await Promise.resolve(); });
  await act(async () => { fireEvent.press(await screen.findByText('Retry')); });
  await waitFor(() => expect(mockedGetArtworks).toHaveBeenCalledTimes(2));
  expect(await screen.findByText('No artworks available yet.')).toBeTruthy();
});
