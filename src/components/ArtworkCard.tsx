import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Artwork, resolveArtworkImageUrl } from '../api/artworks';

interface Props {
  artwork: Artwork;
}

function formatPrice(price: number | null, currency: string | null): string {
  if (price === null) return 'Price on Request';
  try {
    return new Intl.NumberFormat('en-US', currency ? {
      style: 'currency', currency, maximumFractionDigits: 0,
    } : { maximumFractionDigits: 0 }).format(price);
  } catch {
    return `${price.toLocaleString('en-US')} ${currency ?? ''}`.trim();
  }
}

export function ArtworkCard({ artwork }: Props) {
  const [imageFailed, setImageFailed] = useState(false);
  const artistNames = artwork.artist.map((artist) => artist.name).join(', ') || 'Unknown artist';
  const imageUrl = resolveArtworkImageUrl(artwork.primaryImage?.url);
  const imageLabel = artwork.primaryImage?.altText?.trim() || `${artwork.title} by ${artistNames}`;

  return (
    <View style={styles.card}>
      <View style={styles.imageContainer}>
        {imageUrl && !imageFailed ? (
          <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover"
            accessibilityLabel={imageLabel} onError={() => setImageFailed(true)} />
        ) : (
          <View style={styles.placeholder} accessibilityLabel="Artwork image unavailable">
            <Text style={styles.placeholderText}>ARTWORK</Text>
          </View>
        )}
      </View>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>{artwork.title}</Text>
        <Text style={styles.artist} numberOfLines={2}>{artistNames}</Text>
        <Text style={styles.price} numberOfLines={1}>{formatPrice(artwork.price, artwork.currency)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, backgroundColor: '#fff', borderColor: '#e7e5e4', borderWidth: 1,
    borderRadius: 20, overflow: 'hidden', margin: 5 },
  imageContainer: { width: '100%', aspectRatio: 4 / 3, backgroundColor: '#f5f5f4' },
  image: { width: '100%', height: '100%' },
  placeholder: { width: '100%', height: '100%', backgroundColor: '#e7e5e4',
    justifyContent: 'center', alignItems: 'center' },
  placeholderText: { color: '#78716c', fontSize: 11, fontWeight: '600', letterSpacing: 2 },
  content: { padding: 12, gap: 6 },
  title: { color: '#1c1917', fontSize: 16, fontWeight: '600' },
  artist: { color: '#57534e', fontSize: 13 },
  price: { color: '#1c1917', fontSize: 15, fontWeight: '600' },
});
