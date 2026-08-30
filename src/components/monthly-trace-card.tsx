import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { MemoryImage } from '@/components/memory-image';
import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { radius, shadow, spacing, useTraceTheme } from '@/theme';
import type { MonthlyTrace } from '@/types/trace';

export function MonthlyTraceCard({ review }: { review: MonthlyTrace }) {
  const router = useRouter();
  const { colors } = useTraceTheme();
  const stats = [[review.placeCount, '장소'], [review.memoryCount, '추억'], [review.photoCount, '사진']] as const;
  return <PressableScale accessibilityRole="button" accessibilityLabel={`${review.month}월 Trace 돌아보기`} onPress={() => router.push({ pathname: '/review/[year]', params: { year: String(review.year) } })} style={[styles.root, { backgroundColor: colors.surface, boxShadow: shadow.soft }]}><View style={styles.header}><View><ThemedText variant="title">{review.month}월의 Trace</ThemedText><ThemedText variant="caption">이번 달의 기억을 한눈에</ThemedText></View><Ionicons name="arrow-forward" size={18} color={colors.text} /></View><View style={styles.body}><View style={styles.stats}>{stats.map(([value, label]) => <View key={label} style={styles.stat}><ThemedText variant="title">{value}</ThemedText><ThemedText variant="caption">{label}</ThemedText></View>)}</View><View style={styles.photos}>{review.representativePhotos.slice(0, 3).map((photo, index) => <MemoryImage key={photo.id} uri={photo.uri} accessibilityLabel={`${review.month}월 대표 사진 ${index + 1}`} style={styles.photo} />)}</View></View><ThemedText variant="subhead">가장 많이 방문한 곳 · {review.mostVisitedPlace?.name ?? '아직 없어요'}{review.mostVisitedCount ? ` ${review.mostVisitedCount}회` : ''}</ThemedText><ThemedText variant="caption">새롭게 발견한 장소 {review.newPlaceCount}곳</ThemedText></PressableScale>;
}

const styles = StyleSheet.create({ root: { borderRadius: radius.card, borderCurve: 'continuous', padding: spacing.md, gap: spacing.sm }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, body: { flexDirection: 'row', alignItems: 'center', gap: spacing.md }, stats: { flex: 1, flexDirection: 'row' }, stat: { flex: 1, gap: spacing.xxs }, photos: { flexDirection: 'row' }, photo: { width: 40, height: 52, borderRadius: radius.sm, marginLeft: -5, borderWidth: 2, borderColor: '#FFFFFF' } });
