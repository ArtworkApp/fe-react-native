import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import ArtworkListingScreen from '../src/app/artworks';
import { getArtworks } from '../src/api/artworks';
import { getArtists } from '../src/api/artists';
import { getArtworkTypes, getMaterials } from '../src/api/taxonomy';

jest.mock('../src/api/artists', () => ({ getArtists: jest.fn() }));
jest.mock('../src/api/taxonomy', () => ({ getArtworkTypes: jest.fn(), getMaterials: jest.fn() }));

jest.mock('../src/api/artworks', () => ({
  getArtworks: jest.fn(),
  resolveArtworkImageUrl: jest.fn(() => null),
}));

const mockedGetArtworks = jest.mocked(getArtworks);
const mockedGetArtists = jest.mocked(getArtists);
const mockedGetArtworkTypes = jest.mocked(getArtworkTypes);
const mockedGetMaterials = jest.mocked(getMaterials);

beforeEach(() => {
  mockedGetArtworkTypes.mockImplementation(() => new Promise(() => {}));
  mockedGetMaterials.mockImplementation(() => new Promise(() => {}));
});

afterEach(() => {
  jest.useRealTimers();
  jest.resetAllMocks();
});

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
  await render(<ArtworkListingScreen />);
  await act(async () => { await Promise.resolve(); });
  expect(await screen.findByText('Blue Garden')).toBeTruthy();
  expect(screen.getByText('Red Garden')).toBeTruthy();
  expect(screen.getAllByTestId('artwork-column')).toHaveLength(2);
});

test('shows an empty catalog state', async () => {
  mockedGetArtworks.mockResolvedValue({ data: [], pagination: {
    page: 1, limit: 21, total: 0, totalPages: 0,
  } });
  await render(<ArtworkListingScreen />);
  await act(async () => { await Promise.resolve(); });
  expect(await screen.findByText('No artworks available yet.')).toBeTruthy();
});

test('retries an initial request failure', async () => {
  mockedGetArtworks.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({
    data: [], pagination: { page: 1, limit: 21, total: 0, totalPages: 0 },
  });
  await render(<ArtworkListingScreen />);
  await act(async () => { await Promise.resolve(); });
  await act(async () => { await fireEvent.press(await screen.findByText('Retry')); });
  await waitFor(() => expect(mockedGetArtworks).toHaveBeenCalledTimes(2));
  expect(await screen.findByText('No artworks available yet.')).toBeTruthy();
});

test('changes sort and requests a fresh first page', async () => {
  mockedGetArtworks.mockResolvedValue({ data: [], pagination: {
    page: 1, limit: 21, total: 0, totalPages: 0,
  } });
  await render(<ArtworkListingScreen />);
  await screen.findByText('No artworks available yet.');

  await fireEvent.press(screen.getByRole('button', { name: 'Sort artworks' }));
  await fireEvent.press(screen.getByRole('radio', { name: 'Price: Lowest First' }));

  await waitFor(() => expect(mockedGetArtworks).toHaveBeenCalledTimes(2));
  expect(mockedGetArtworks).toHaveBeenLastCalledWith(expect.objectContaining({
    sort: 'price_asc', signal: expect.any(AbortSignal),
  }));
});

test('applies year filters and clears a filtered empty state', async () => {
  mockedGetArtworks.mockResolvedValue({ data: [], pagination: {
    page: 1, limit: 21, total: 0, totalPages: 0,
  } });
  await render(<ArtworkListingScreen />);
  await screen.findByText('No artworks available yet.');

  await fireEvent.press(screen.getByRole('button', { name: 'Filter artworks' }));
  await fireEvent.changeText(screen.getByLabelText('From'), '1900');
  await fireEvent.press(screen.getByRole('button', { name: 'Apply Filters' }));

  expect(await screen.findByText('No artworks found.')).toBeTruthy();
  expect(mockedGetArtworks).toHaveBeenLastCalledWith(expect.objectContaining({
    filters: { yearStart: 1900 }, sort: 'year_desc',
  }));
  await fireEvent.press(screen.getByRole('button', { name: 'Clear Filters' }));
  await waitFor(() => expect(mockedGetArtworks).toHaveBeenCalledTimes(3));
  expect(await screen.findByText('No artworks available yet.')).toBeTruthy();
});

test('applies a selected artist ID to the listing request', async () => {
  mockedGetArtworks.mockResolvedValue({ data: [], pagination: {
    page: 1, limit: 21, total: 0, totalPages: 0,
  } });
  mockedGetArtists.mockResolvedValue([{ id: '42', name: 'Claude Monet', country: 'France' }]);
  await render(<ArtworkListingScreen />);
  await screen.findByText('No artworks available yet.');

  jest.useFakeTimers();
  await fireEvent.press(screen.getByRole('button', { name: 'Filter artworks' }));
  await fireEvent.changeText(screen.getByLabelText('Artist'), 'Mon');
  await act(async () => { jest.advanceTimersByTime(300); await Promise.resolve(); });
  await fireEvent.press(screen.getByRole('button', { name: /Claude Monet/ }));
  await act(async () => {
    await fireEvent.press(screen.getByRole('button', { name: 'Apply Filters' }));
    await Promise.resolve();
  });

  expect(mockedGetArtworks).toHaveBeenLastCalledWith(expect.objectContaining({
    filters: { artistId: '42' }, sort: 'year_desc',
  }));
});

test('applies selected artwork type and materials to the listing request', async () => {
  mockedGetArtworks.mockResolvedValue({ data: [], pagination: {
    page: 1, limit: 21, total: 0, totalPages: 0,
  } });
  mockedGetArtworkTypes.mockResolvedValue([{ id: '1', name: 'Painting', active: true }]);
  mockedGetMaterials.mockResolvedValue([{ id: '2', name: 'Oil', active: true,
    artworkTypeId: '1', artworkType: null }]);
  await render(<ArtworkListingScreen />);
  await screen.findByText('No artworks available yet.');

  await fireEvent.press(screen.getByRole('button', { name: 'Filter artworks' }));
  await fireEvent.press(await screen.findByRole('radio', { name: 'Artwork type: Painting' }));
  await fireEvent.press(screen.getByRole('checkbox', { name: 'Material: Oil' }));
  await act(async () => {
    await fireEvent.press(screen.getByRole('button', { name: 'Apply Filters' }));
    await Promise.resolve();
  });

  expect(mockedGetArtworks).toHaveBeenLastCalledWith(expect.objectContaining({
    filters: { artworkTypeId: '1', materialIds: ['2'] }, sort: 'year_desc',
  }));
});

test('applies a selected country to the listing request', async () => {
  mockedGetArtworks.mockResolvedValue({ data: [], pagination: {
    page: 1, limit: 21, total: 0, totalPages: 0,
  } });
  await render(<ArtworkListingScreen />);
  await screen.findByText('No artworks available yet.');

  await fireEvent.press(screen.getByRole('button', { name: 'Filter artworks' }));
  await fireEvent.changeText(screen.getByLabelText('Artist country'), 'fra');
  await fireEvent.press(screen.getByRole('button', { name: 'France' }));
  await act(async () => {
    await fireEvent.press(screen.getByRole('button', { name: 'Apply Filters' }));
    await Promise.resolve();
  });

  expect(mockedGetArtworks).toHaveBeenLastCalledWith(expect.objectContaining({
    filters: { country: 'France' }, sort: 'year_desc',
  }));
});
