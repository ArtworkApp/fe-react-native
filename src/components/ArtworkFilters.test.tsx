import { fireEvent, render, screen } from '@testing-library/react-native';
import { ArtworkFilters } from './ArtworkFilters';

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
