import { fireEvent, render, screen } from '@testing-library/react-native';
import { CountryAutocomplete } from './CountryAutocomplete';

test('finds and selects one country from the full list', async () => {
  const onSelect = jest.fn();
  await render(<CountryAutocomplete selected={undefined} onSelect={onSelect} />);

  await fireEvent.changeText(screen.getByLabelText('Artist country'), 'fra');
  expect(screen.getByTestId('country-results').props.style).toEqual(
    expect.objectContaining({ width: '100%' }),
  );
  await fireEvent.press(screen.getByRole('button', { name: 'France' }));
  expect(onSelect).toHaveBeenCalledWith('France');
});

test('clears a selected country and shows no-results feedback', async () => {
  const onSelect = jest.fn();
  const { rerender } = await render(<CountryAutocomplete selected="France" onSelect={onSelect} />);
  await fireEvent.press(screen.getByRole('button', { name: 'Clear country' }));
  expect(onSelect).toHaveBeenCalledWith(undefined);

  await rerender(<CountryAutocomplete selected={undefined} onSelect={onSelect} />);
  await fireEvent.changeText(screen.getByLabelText('Artist country'), 'zzz');
  expect(screen.getByText('No countries found')).toBeTruthy();
});
