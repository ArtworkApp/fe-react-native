import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { ArtworkCard } from './ArtworkCard';

const artwork = {
  id: '1',
  title: 'Blue Garden',
  artist: [{ name: 'Ada' }, { name: 'Lee' }],
  price: 1200,
  currency: 'USD',
  primaryImage: { url: 'https://example.com/art.jpg', altText: 'A blue painting' },
};

test('shows artwork details and meaningful image text', async () => {
  await render(<ArtworkCard artwork={artwork} />);
  expect(screen.getByText('Blue Garden')).toBeTruthy();
  expect(screen.getByText('Ada, Lee')).toBeTruthy();
  expect(screen.getByText('$1,200')).toBeTruthy();
  expect(screen.getByLabelText('A blue painting')).toBeTruthy();
});

test('shows placeholders when metadata or the image is missing', async () => {
  await render(<ArtworkCard artwork={{ ...artwork, artist: [], price: null, primaryImage: null }} />);
  expect(screen.getByText('Unknown artist')).toBeTruthy();
  expect(screen.getByText('Price on Request')).toBeTruthy();
  expect(screen.getByLabelText('Artwork image unavailable')).toBeTruthy();
});

test('falls back when an image fails', async () => {
  await render(<ArtworkCard artwork={artwork} />);
  fireEvent(screen.getByLabelText('A blue painting'), 'error');
  await waitFor(() => expect(screen.getByLabelText('Artwork image unavailable')).toBeTruthy());
});
