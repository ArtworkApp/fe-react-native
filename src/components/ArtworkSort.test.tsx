import { fireEvent, render, screen } from '@testing-library/react-native';
import { ArtworkSort } from './ArtworkSort';

test('shows the four backend sort options and applies a selection', () => {
  const onChange = jest.fn();
  render(<ArtworkSort sort="year_desc" onChange={onChange} />);

  fireEvent.press(screen.getByRole('button', { name: 'Sort artworks' }));

  expect(screen.getByRole('radio', { name: 'Year: Oldest First' })).toBeTruthy();
  expect(screen.getByRole('radio', { name: 'Year: Newest First' })).toBeTruthy();
  expect(screen.getByRole('radio', { name: 'Price: Lowest First' })).toBeTruthy();
  expect(screen.getByRole('radio', { name: 'Price: Highest First' })).toBeTruthy();

  fireEvent.press(screen.getByRole('radio', { name: 'Price: Lowest First' }));

  expect(onChange).toHaveBeenCalledWith('price_asc');
  expect(screen.queryByRole('radio', { name: 'Price: Lowest First' })).toBeNull();
});

test('closes without changing sort', () => {
  const onChange = jest.fn();
  render(<ArtworkSort sort="year_desc" onChange={onChange} />);

  fireEvent.press(screen.getByRole('button', { name: 'Sort artworks' }));
  fireEvent.press(screen.getByRole('button', { name: 'Close sorting' }));

  expect(onChange).not.toHaveBeenCalled();
  expect(screen.queryByRole('radio', { name: 'Year: Newest First' })).toBeNull();
});
