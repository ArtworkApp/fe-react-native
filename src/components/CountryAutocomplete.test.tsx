import { fireEvent, render, screen } from '@testing-library/react-native';
import { CountryAutocomplete } from './CountryAutocomplete';

test('finds and selects one country from the full list', () => {
  const onSelect = jest.fn();
  render(<CountryAutocomplete selected={undefined} onSelect={onSelect} />);

  fireEvent.changeText(screen.getByLabelText('Artist country'), 'fra');
  expect(screen.getByTestId('country-results').props.style).toEqual(
    expect.objectContaining({ width: '100%' }),
  );
  fireEvent.press(screen.getByRole('button', { name: 'France' }));
  expect(onSelect).toHaveBeenCalledWith('France');
});

test('clears a selected country and shows no-results feedback', () => {
  const onSelect = jest.fn();
  const { rerender } = render(<CountryAutocomplete selected="France" onSelect={onSelect} />);
  fireEvent.press(screen.getByRole('button', { name: 'Clear country' }));
  expect(onSelect).toHaveBeenCalledWith(undefined);

  rerender(<CountryAutocomplete selected={undefined} onSelect={onSelect} />);
  fireEvent.changeText(screen.getByLabelText('Artist country'), 'zzz');
  expect(screen.getByText('No countries found')).toBeTruthy();
});
