import { Stack, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { MemoryImage } from '@/components/memory-image';
import { ThemedText } from '@/components/themed-text';
import { getYearlyReview } from '@/services/discovery-service';
import { SEOUL_FALLBACK } from '@/services/location-service';
import { detectTrips } from '@/services/trip-detector';
import { useAppStore } from '@/store/app-store';
import { radius, shadow, spacing, useTraceTheme } from '@/theme';

export default function YearlyReviewScreen() {
  const { year: yearParam } = useLocalSearchParams<{ year: string }>();
  const year = Number(yearParam);
  const safeYear = Number.isInteger(year) && year >= 2000 && year <= 2100 ? year : 2026;
  const { colors } = useTraceTheme();
  const places = useAppStore((state) => state.places);
  const visits = useAppStore((state) => state.visits);
  const memories = useAppStore((state) => state.memories);
  const currentLocation = useAppStore((state) => state.currentLocation);
  const review = useMemo(() => getYearlyReview(places, visits, memories, safeYear, currentLocation ?? SEOUL_FALLBACK), [currentLocation, memories, places, safeYear, visits]);
  const trips = useMemo(() => detectTrips(visits, places, memories).filter((trip) => new Date(trip.startedAt).getFullYear() === safeYear), [memories, places, safeYear, visits]);
  const maxMemories = Math.max(...review.months.map((month) => month.memoryCount), 1);
  const stats = [[review.placeCount, '장소'], [review.memoryCount, '추억'], [review.photoCount, '사진'], [review.regionCount, '지역']] as const;
  return <><Stack.Screen options={{ title: `${safeYear} 돌아보기` }} /><ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={[styles.content, { backgroundColor: colors.background }]}><View style={styles.hero}><ThemedText variant="screenTitle">{safeYear}</ThemedText><ThemedText variant="largeTitle">나의 Trace</ThemedText><ThemedText variant="subhead">한 해 동안 머문 장소와 사진이 하나의 기록이 되었어요.</ThemedText></View><View style={[styles.stats, { backgroundColor: colors.journey, boxShadow: shadow.raised }]}>{stats.map(([value, label]) => <View key={label} style={styles.stat}><ThemedText variant="title" style={{ color: colors.journeyText }}>{value}</ThemedText><ThemedText variant="caption" style={{ color: colors.journeyText, opacity: 0.66 }}>{label}</ThemedText></View>)}</View><View style={styles.section}><ThemedText variant="title">이 해의 장면</ThemedText><View style={[styles.highlights, { backgroundColor: colors.surface }]}><View style={styles.highlight}><ThemedText variant="caption">가장 많이 방문한 장소</ThemedText><ThemedText variant="headline">{review.mostVisitedPlace?.name ?? '기록 없음'}{review.mostVisitedCount ? ` · ${review.mostVisitedCount}회` : ''}</ThemedText></View><View style={styles.highlight}><ThemedText variant="caption">가장 멀리 간 곳</ThemedText><ThemedText variant="headline">{review.farthestPlace?.name ?? '기록 없음'}</ThemedText></View><View style={styles.highlight}><ThemedText variant="caption">가장 많이 기록한 달</ThemedText><ThemedText variant="headline">{review.mostActiveMonth ? `${review.mostActiveMonth}월` : '기록 없음'}</ThemedText></View><View style={styles.highlight}><ThemedText variant="caption">여행으로 이어진 기록</ThemedText><ThemedText variant="headline">{trips.length ? `${trips.map((trip) => trip.title).join(' · ')}` : '기록 없음'}</ThemedText></View></View></View><View style={styles.section}><ThemedText variant="title">월별 기록</ThemedText><View style={styles.chart}>{review.months.map((month) => <View key={month.month} style={styles.month}><View style={[styles.barTrack, { backgroundColor: colors.surfaceMuted }]}><View style={[styles.bar, { backgroundColor: colors.accent, height: `${Math.max(8, month.memoryCount / maxMemories * 100)}%` }]} /></View><ThemedText variant="caption">{month.month}</ThemedText></View>)}</View></View>{review.farthestPlace ? <View style={styles.section}><ThemedText variant="title">가장 멀리 남은 기억</ThemedText><View style={[styles.farthest, { backgroundColor: colors.surface, boxShadow: shadow.soft }]}><MemoryImage uri={review.farthestPlace.coverPhoto ?? ''} accessibilityLabel={review.farthestPlace.name} style={styles.farthestPhoto} /><View style={styles.farthestCopy}><ThemedText variant="title">{review.farthestPlace.name}</ThemedText><ThemedText variant="subhead">{review.farthestPlace.address}</ThemedText></View></View></View> : null}</ScrollView></>;
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, padding: spacing.ml, paddingBottom: spacing.xxl, gap: spacing.xl },
  hero: { paddingTop: spacing.lg, gap: spacing.xs },
  stats: { minHeight: 118, borderRadius: radius.card, padding: spacing.md, flexDirection: 'row', alignItems: 'center' },
  stat: { flex: 1, alignItems: 'center', gap: spacing.xxs },
  section: { gap: spacing.md },
  highlights: { borderRadius: radius.card, paddingHorizontal: spacing.md },
  highlight: { minHeight: 70, justifyContent: 'center', gap: spacing.xxs },
  chart: { height: 164, flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs },
  month: { flex: 1, height: '100%', alignItems: 'center', justifyContent: 'flex-end', gap: spacing.xs },
  barTrack: { width: '100%', flex: 1, borderRadius: radius.sm, overflow: 'hidden', justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: radius.sm },
  farthest: { borderRadius: radius.card, overflow: 'hidden' },
  farthestPhoto: { width: '100%', aspectRatio: 1.8 },
  farthestCopy: { padding: spacing.md, gap: spacing.xxs },
});
