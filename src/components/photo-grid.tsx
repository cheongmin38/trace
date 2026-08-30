import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { MemoryImage } from '@/components/memory-image';
import { radius, spacing } from '@/theme';
import type { Photo } from '@/types/trace';
export function PhotoGrid({ photos, label }: { photos: Photo[]; label: string }) { const { width } = useWindowDimensions(); const size = Math.max(88, (Math.min(width, 480) - spacing.ml * 2 - spacing.xs * 2) / 3); return <View style={styles.grid}>{photos.map((photo, index) => <MemoryImage key={photo.id} uri={photo.uri} accessibilityLabel={`${label} ${index + 1}`} style={[styles.image, { width: size, height: size }]} />)}</View>; }
const styles = StyleSheet.create({ grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }, image: { borderRadius: radius.md, borderCurve: 'continuous' } });
