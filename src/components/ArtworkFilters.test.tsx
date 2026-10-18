import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { ArtworkFilters } from './ArtworkFilters';
import { getArtists } from '../api/artists';

jest.mock('../api/artists', () => ({ getArtists: jest.fn() }));
const mockedGetArtists = jest.mocked(getArtists);

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
