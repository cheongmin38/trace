import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { MemoryImage } from '@/components/memory-image';
import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { radius, spacing, useTraceTheme } from '@/theme';
import type { Place } from '@/types/trace';

export function FrequentPlaces({ places }: { places: Place[] }) {
  const router = useRouter();
  const { colors } = useTraceTheme();
  if (!places.length) return null;
  return <View style={styles.root}><View style={styles.header}><ThemedText variant="title">자주 가는 곳</ThemedText><PressableScale accessibilityRole="button" onPress={() => router.push('/places')}><ThemedText variant="caption">나의 장소</ThemedText></PressableScale></View><View style={styles.list}>{places.map((place, index) => <PressableScale key={place.id} accessibilityRole="button" accessibilityLabel={`${place.name} 장소 상세`} onPress={() => router.push({ pathname: '/place/[id]', params: { id: place.id } })} style={styles.row}><ThemedText variant="title" style={[styles.rank, { color: colors.tertiaryText }]}>{index + 1}</ThemedText><MemoryImage uri={place.coverPhoto ?? ''} accessibilityLabel={place.name} style={styles.photo} /><View style={styles.copy}><ThemedText variant="headline" numberOfLines={1}>{place.name}</ThemedText><ThemedText variant="caption">{place.visitCount}회 · 사진 {place.photoCount}장</ThemedText></View></PressableScale>)}</View></View>;
}

const styles = StyleSheet.create({ root: { gap: spacing.md }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, list: { gap: spacing.xs }, row: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: spacing.sm }, rank: { width: 22, textAlign: 'center' }, photo: { width: 52, height: 52, borderRadius: radius.md }, copy: { flex: 1, gap: spacing.xxs } });
