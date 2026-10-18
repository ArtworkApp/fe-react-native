import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { getArtists } from '../api/artists';
import { ArtistAutocomplete } from './ArtistAutocomplete';

jest.mock('../api/artists', () => ({ getArtists: jest.fn() }));
const mockedGetArtists = jest.mocked(getArtists);

afterEach(() => {
  jest.useRealTimers();
  jest.resetAllMocks();
});

test('searches names after a delay, selects an ID, and clears it', async () => {
  jest.useFakeTimers();
  mockedGetArtists.mockResolvedValue([{ id: '42', name: 'Claude Monet', country: 'France' }]);
  const onSelect = jest.fn();
  render(<ArtistAutocomplete selected={null} onSelect={onSelect} />);

  fireEvent.changeText(screen.getByLabelText('Artist'), 'Mon');
  expect(mockedGetArtists).not.toHaveBeenCalled();
  expect(screen.getByText('Searching artists...')).toBeTruthy();
  expect(screen.queryByText('No artists found')).toBeNull();
  await act(async () => { jest.advanceTimersByTime(300); await Promise.resolve(); });
  expect(mockedGetArtists).toHaveBeenCalledWith(expect.objectContaining({ search: 'Mon' }));
  expect(screen.getByTestId('artist-results-scroll')).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: /Claude Monet/ }));
  expect(onSelect).toHaveBeenCalledWith({ id: '42', name: 'Claude Monet', country: 'France' });
});

test('shows a clear action for the selected artist', () => {
  const onSelect = jest.fn();
  render(<ArtistAutocomplete selected={{ id: '42', name: 'Claude Monet', country: 'France' }}
    onSelect={onSelect} />);
  fireEvent.press(screen.getByRole('button', { name: 'Clear artist' }));
  expect(onSelect).toHaveBeenCalledWith(null);
});

test('shows no results and a recoverable lookup failure', async () => {
  jest.useFakeTimers();
  mockedGetArtists.mockResolvedValueOnce([]).mockRejectedValueOnce(new Error('offline'));
  render(<ArtistAutocomplete selected={null} onSelect={jest.fn()} />);

  fireEvent.changeText(screen.getByLabelText('Artist'), 'ZZ');
  await act(async () => { jest.advanceTimersByTime(300); await Promise.resolve(); });
  expect(screen.getByText('No artists found')).toBeTruthy();

  fireEvent.changeText(screen.getByLabelText('Artist'), 'Mon');
  await act(async () => { jest.advanceTimersByTime(300); await Promise.resolve(); });
  expect(screen.getByText('Artist search failed.')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Retry artist search' })).toBeTruthy();
});

test('ignores a stale artist search response', async () => {
  jest.useFakeTimers();
  let finishFirstSearch: (artists: Awaited<ReturnType<typeof getArtists>>) => void = () => {};
  mockedGetArtists.mockImplementationOnce(() => new Promise((resolve) => {
    finishFirstSearch = resolve;
  })).mockResolvedValueOnce([{ id: '2', name: 'Pablo Picasso', country: 'Spain' }]);
  render(<ArtistAutocomplete selected={null} onSelect={jest.fn()} />);

  fireEvent.changeText(screen.getByLabelText('Artist'), 'Mon');
  await act(async () => { jest.advanceTimersByTime(300); });
  fireEvent.changeText(screen.getByLabelText('Artist'), 'Pic');
  await act(async () => { jest.advanceTimersByTime(300); await Promise.resolve(); });
  await act(async () => {
    finishFirstSearch([{ id: '1', name: 'Claude Monet', country: 'France' }]);
    await Promise.resolve();
  });

  expect(screen.getByRole('button', { name: /Pablo Picasso/ })).toBeTruthy();
  expect(screen.queryByRole('button', { name: /Claude Monet/ })).toBeNull();
});
