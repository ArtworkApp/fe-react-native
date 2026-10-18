import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { ArtworkFilters } from './ArtworkFilters';
import { getArtists } from '../api/artists';
import { getArtworkTypes, getMaterials } from '../api/taxonomy';

jest.mock('../api/artists', () => ({ getArtists: jest.fn() }));
jest.mock('../api/taxonomy', () => ({ getArtworkTypes: jest.fn(), getMaterials: jest.fn() }));
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

test('applies a valid year range', () => {
  const onApply = jest.fn();
  render(<ArtworkFilters filters={{}} onApply={onApply} />);

  fireEvent.press(screen.getByRole('button', { name: 'Filter artworks' }));
  fireEvent.changeText(screen.getByLabelText('From'), '1900');
  fireEvent.changeText(screen.getByLabelText('To'), '1950');
  fireEvent.press(screen.getByRole('button', { name: 'Apply Filters' }));

  expect(onApply).toHaveBeenCalledWith({ yearStart: 1900, yearEnd: 1950 });
  expect(screen.queryByLabelText('From')).toBeNull();
});

test('discards edits on Cancel and restores applied values when reopened', () => {
  const onApply = jest.fn();
  render(<ArtworkFilters filters={{ yearStart: 1900 }} onApply={onApply} />);

  fireEvent.press(screen.getByRole('button', { name: 'Filter artworks' }));
  fireEvent.changeText(screen.getByLabelText('From'), '1950');
  fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));
  fireEvent.press(screen.getByRole('button', { name: 'Filter artworks' }));

  expect(screen.getByLabelText('From').props.value).toBe('1900');
  expect(onApply).not.toHaveBeenCalled();
});

test('keeps the sheet open and explains an invalid range', () => {
  const onApply = jest.fn();
  render(<ArtworkFilters filters={{}} onApply={onApply} />);

  fireEvent.press(screen.getByRole('button', { name: 'Filter artworks' }));
  fireEvent.changeText(screen.getByLabelText('From'), '1950');
  fireEvent.changeText(screen.getByLabelText('To'), '1900');
  fireEvent.press(screen.getByRole('button', { name: 'Apply Filters' }));

  expect(screen.getByText('From year must not exceed To year.')).toBeTruthy();
  expect(onApply).not.toHaveBeenCalled();
});

test('keeps the year fields reachable when the keyboard opens', () => {
  render(<ArtworkFilters filters={{}} onApply={jest.fn()} />);
  fireEvent.press(screen.getByRole('button', { name: 'Filter artworks' }));

  expect(screen.getByTestId('filter-keyboard-avoiding-view')).toBeTruthy();
  expect(screen.getByTestId('filter-sheet-scroll').props.keyboardShouldPersistTaps).toBe('handled');
  expect(screen.getByLabelText('From')).toBeTruthy();
  expect(screen.getByLabelText('To')).toBeTruthy();
});

test('applies a selected artist with the existing year filter', async () => {
  jest.useFakeTimers();
  mockedGetArtists.mockResolvedValue([{ id: '42', name: 'Claude Monet', country: 'France' }]);
  const onApply = jest.fn();
  render(<ArtworkFilters filters={{ yearStart: 1900 }} onApply={onApply} />);

  fireEvent.press(screen.getByRole('button', { name: 'Filter artworks' }));
  fireEvent.changeText(screen.getByLabelText('Artist'), 'Mon');
  await act(async () => { jest.advanceTimersByTime(300); await Promise.resolve(); });
  fireEvent.press(screen.getByRole('button', { name: /Claude Monet/ }));
  fireEvent.press(screen.getByRole('button', { name: 'Apply Filters' }));

  expect(onApply).toHaveBeenCalledWith({ artistId: '42', yearStart: 1900 });
  jest.useRealTimers();
});

test('cancelling a new artist selection restores the applied artist', async () => {
  jest.useFakeTimers();
  mockedGetArtists.mockResolvedValue([{ id: '42', name: 'Claude Monet', country: 'France' }]);
  const onApply = jest.fn();
  const { rerender } = render(<ArtworkFilters filters={{}} onApply={onApply} />);

  fireEvent.press(screen.getByRole('button', { name: 'Filter artworks' }));
  fireEvent.changeText(screen.getByLabelText('Artist'), 'Mon');
  await act(async () => { jest.advanceTimersByTime(300); await Promise.resolve(); });
  fireEvent.press(screen.getByRole('button', { name: /Claude Monet/ }));
  fireEvent.press(screen.getByRole('button', { name: 'Apply Filters' }));
  rerender(<ArtworkFilters filters={{ artistId: '42' }} onApply={onApply} />);

  fireEvent.press(screen.getByRole('button', { name: 'Filter artworks' }));
  fireEvent.press(screen.getByRole('button', { name: 'Clear artist' }));
  fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));
  fireEvent.press(screen.getByRole('button', { name: 'Filter artworks' }));

  expect(screen.getByLabelText('Artist').props.value).toBe('Claude Monet');
  expect(onApply).toHaveBeenCalledTimes(1);
  jest.useRealTimers();
});

test('filters materials by type and clears incompatible selections', async () => {
  mockedGetArtworkTypes.mockResolvedValue([
    { id: '1', name: 'Painting', active: true },
    { id: '2', name: 'Sculpture', active: true },
  ]);
  mockedGetMaterials.mockResolvedValue([
    { id: '2', name: 'Oil', active: true, artworkTypeId: '1', artworkType: null },
    { id: '3', name: 'Bronze', active: true, artworkTypeId: '2', artworkType: null },
  ]);
  const onApply = jest.fn();
  render(<ArtworkFilters filters={{}} onApply={onApply} />);

  fireEvent.press(screen.getByRole('button', { name: 'Filter artworks' }));
  await screen.findByRole('radio', { name: 'Artwork type: Painting' });
  fireEvent.press(screen.getByRole('checkbox', { name: 'Material: Oil' }));
  fireEvent.press(screen.getByRole('radio', { name: 'Artwork type: Painting' }));
  expect(screen.queryByRole('checkbox', { name: 'Material: Bronze' })).toBeNull();
  fireEvent.press(screen.getByRole('radio', { name: 'Artwork type: Sculpture' }));
  expect(screen.getByRole('checkbox', { name: 'Material: Bronze' })).toBeTruthy();
  fireEvent.press(screen.getByRole('checkbox', { name: 'Material: Bronze' }));
  fireEvent.press(screen.getByRole('button', { name: 'Apply Filters' }));

  expect(onApply).toHaveBeenCalledWith({ artworkTypeId: '2', materialIds: ['3'] });
});

test('reports lookup failures and retries without refetching successful lookups', async () => {
  mockedGetArtworkTypes.mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValueOnce([{ id: '1', name: 'Painting', active: true }]);
  mockedGetMaterials.mockResolvedValue([]);
  const onApply = jest.fn();
  render(<ArtworkFilters filters={{}} onApply={onApply} />);

  fireEvent.press(screen.getByRole('button', { name: 'Filter artworks' }));
  await screen.findByText('Unable to load artwork types.');
  fireEvent.press(screen.getByRole('button', { name: 'Retry artwork types' }));
  await screen.findByRole('radio', { name: 'Artwork type: Painting' });
  fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));
  fireEvent.press(screen.getByRole('button', { name: 'Filter artworks' }));

  await waitFor(() => expect(mockedGetArtworkTypes).toHaveBeenCalledTimes(2));
  expect(mockedGetMaterials).toHaveBeenCalledTimes(1);
});

test('retries a failed materials lookup', async () => {
  mockedGetArtworkTypes.mockResolvedValue([]);
  mockedGetMaterials.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce([
    { id: '2', name: 'Oil', active: true, artworkTypeId: '1', artworkType: null },
  ]);
  render(<ArtworkFilters filters={{}} onApply={jest.fn()} />);

  fireEvent.press(screen.getByRole('button', { name: 'Filter artworks' }));
  await screen.findByText('Unable to load materials.');
  fireEvent.press(screen.getByRole('button', { name: 'Retry materials' }));

  expect(await screen.findByRole('checkbox', { name: 'Material: Oil' })).toBeTruthy();
  expect(mockedGetMaterials).toHaveBeenCalledTimes(2);
});

test('cancelling taxonomy edits restores applied type and materials', async () => {
  mockedGetArtworkTypes.mockResolvedValue([
    { id: '1', name: 'Painting', active: true },
    { id: '2', name: 'Sculpture', active: true },
  ]);
  mockedGetMaterials.mockResolvedValue([
    { id: '2', name: 'Oil', active: true, artworkTypeId: '1', artworkType: null },
    { id: '3', name: 'Bronze', active: true, artworkTypeId: '2', artworkType: null },
  ]);
  const onApply = jest.fn();
  render(<ArtworkFilters filters={{ artworkTypeId: '1', materialIds: ['2'] }}
    onApply={onApply} />);

  fireEvent.press(screen.getByRole('button', { name: 'Filter artworks' }));
  fireEvent.press(await screen.findByRole('radio', { name: 'Artwork type: Sculpture' }));
  fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));
  fireEvent.press(screen.getByRole('button', { name: 'Filter artworks' }));

  expect(screen.getByRole('radio', { name: 'Artwork type: Painting' })
    .props.accessibilityState.selected).toBe(true);
  expect(screen.getByRole('checkbox', { name: 'Material: Oil' })
    .props.accessibilityState.checked).toBe(true);
  expect(onApply).not.toHaveBeenCalled();
});

test('applies a selected country and discards an unsubmitted country edit', () => {
  const onApply = jest.fn();
  const { rerender } = render(<ArtworkFilters filters={{}} onApply={onApply} />);

  fireEvent.press(screen.getByRole('button', { name: 'Filter artworks' }));
  fireEvent.changeText(screen.getByLabelText('Artist country'), 'fra');
  fireEvent.press(screen.getByRole('button', { name: 'France' }));
  fireEvent.press(screen.getByRole('button', { name: 'Apply Filters' }));
  expect(onApply).toHaveBeenCalledWith({ country: 'France' });

  rerender(<ArtworkFilters filters={{ country: 'France' }} onApply={onApply} />);
  fireEvent.press(screen.getByRole('button', { name: 'Filter artworks' }));
  fireEvent.press(screen.getByRole('button', { name: 'Clear country' }));
  fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));
  fireEvent.press(screen.getByRole('button', { name: 'Filter artworks' }));
  expect(screen.getByLabelText('Artist country').props.value).toBe('France');
  expect(onApply).toHaveBeenCalledTimes(1);
});

test('clears an applied country without sending free text as a filter', () => {
  const onApply = jest.fn();
  const { rerender } = render(<ArtworkFilters filters={{ country: 'France' }} onApply={onApply} />);

  fireEvent.press(screen.getByRole('button', { name: 'Filter artworks' }));
  fireEvent.press(screen.getByRole('button', { name: 'Clear country' }));
  fireEvent.changeText(screen.getByLabelText('Artist country'), 'not a country');
  fireEvent.press(screen.getByRole('button', { name: 'Apply Filters' }));
  expect(onApply).toHaveBeenCalledWith({});

  rerender(<ArtworkFilters filters={{}} onApply={onApply} />);
  fireEvent.press(screen.getByRole('button', { name: 'Filter artworks' }));
  expect(screen.getByLabelText('Artist country').props.value).toBe('');
});
