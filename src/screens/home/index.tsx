import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { DailySummaryCard } from '@/components/daily-summary-card';
import { EmptyState } from '@/components/empty-state';
import { IconButton } from '@/components/icon-button';
import { MemoryImage } from '@/components/memory-image';
import { PressableScale } from '@/components/pressable-scale';
import { SkeletonCard } from '@/components/skeleton-card';
import { StatCard } from '@/components/stat-card';
import { ThemedText } from '@/components/themed-text';
import { getMonthlyReview } from '@/services/discovery-service';
import { useAppStore } from '@/store/app-store';
import { radius, shadow, spacing, useTraceTheme } from '@/theme';

export function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { colors } = useTraceTheme();
  const [today] = useState(() => new Date());
  const [loading] = useState(false);
  const visits = useAppStore((state) => state.visits);
  const memories = useAppStore((state) => state.memories);
  const places = useAppStore((state) => state.places);
  const dayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const todayVisits = useMemo(() => visits.filter((visit) => visit.startedAt.slice(0, 10) === dayKey), [dayKey, visits]);
  const todayMemories = useMemo(() => memories.filter((memory) => memory.startedAt.slice(0, 10) === dayKey), [dayKey, memories]);
  const todayPlaceCount = new Set(todayVisits.map((visit) => visit.placeId)).size;
  const photoCount = new Set(todayMemories.flatMap((memory) => memory.photos.map((photo) => photo.id))).size;
  const duration = todayVisits.reduce((total, visit) => total + (visit.durationMinutes ?? 0), 0);
  const monthly = getMonthlyReview(places, visits, memories, today.getFullYear(), today.getMonth() + 1);
  const hasMonthlyData = monthly.placeCount > 0 || monthly.memoryCount > 0 || monthly.photoCount > 0;
  const recent = [...memories].sort((a, b) => +new Date(b.startedAt) - +new Date(a.startedAt)).slice(0, 5);
  const cardWidth = Math.min(184, Math.max(148, (width - spacing.ml * 2) * 0.4));
  const yearAgoTarget = new Date(today);
  yearAgoTarget.setFullYear(yearAgoTarget.getFullYear() - 1);
  const yearAgo = memories.find((memory) => new Date(memory.startedAt).toDateString() === yearAgoTarget.toDateString());
  const yearAgoPlace = places.find((place) => place.id === yearAgo?.placeId);

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={[styles.content, { backgroundColor: colors.background }]}>
      <View pointerEvents="none" style={[styles.ambientTop, { backgroundColor: colors.accentSoft }]} />
      <View style={styles.header}>
        <PressableScale onPress={() => router.push('/timeline')} style={styles.headerCopy} accessibilityRole="button" accessibilityLabel="오늘의 기록 보기">
          <View style={styles.headerTitle}><ThemedText variant="title">오늘의 Trace</ThemedText><Ionicons name="chevron-down" size={17} color={colors.secondaryText} /></View>
          <ThemedText variant="caption" style={{ color: colors.secondaryText }}>{today.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}</ThemedText>
        </PressableScale>
        <IconButton name="notifications-outline" label="알림" onPress={() => router.push('/notifications')} filled />
      </View>

      {loading ? <SkeletonCard /> : <>
        <View style={styles.stats}>
          <StatCard value={todayPlaceCount} label="방문 장소" icon="location" />
          <StatCard value={photoCount} label="찍은 사진" icon="camera" />
          <StatCard value={duration} label="머문 시간" icon="time" />
        </View>
        <DailySummaryCard date={dayKey} />
      </>}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View><ThemedText variant="headline">최근 Memory</ThemedText><ThemedText variant="caption">다시 열어보고 싶은 순간들</ThemedText></View>
          <PressableScale onPress={() => router.push('/timeline')} accessibilityRole="button" accessibilityLabel="모든 기억 보기"><ThemedText variant="caption" style={{ color: colors.accent }}>더보기</ThemedText></PressableScale>
        </View>
        {recent.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.memoryRow}>
          {recent.map((memory) => {
            const place = places.find((item) => item.id === memory.placeId);
            return <PressableScale key={memory.id} onPress={() => router.push(`/memory/${memory.id}`)} accessibilityRole="button" accessibilityLabel={`${place?.name ?? memory.title} 기억 보기`} style={[styles.memoryCard, { width: cardWidth, backgroundColor: colors.surface, borderColor: colors.border, boxShadow: shadow.soft }]}>
              <MemoryImage uri={memory.photos[0]?.uri ?? place?.coverPhoto ?? ''} style={styles.memoryPhoto} accessibilityLabel={place?.name ?? memory.title} />
              <View style={styles.memoryCopy}><ThemedText variant="caption" numberOfLines={1} style={styles.memoryName}>{place?.name ?? memory.title}</ThemedText><ThemedText variant="caption" style={{ color: colors.secondaryText }}>사진 {memory.photos.length}장</ThemedText></View>
            </PressableScale>;
          })}
        </ScrollView> : <EmptyState title="아직 오늘의 기억이 없어요" description="Trace가 새로운 하루를 조용히 기록하고 있어요." />}
      </View>

      {yearAgo && yearAgoPlace ? <View style={styles.section}>
        <View style={styles.sectionHeader}><View><ThemedText variant="headline">1년 전 오늘</ThemedText><ThemedText variant="caption">그날의 순간을 다시 만나보세요</ThemedText></View></View>
        <PressableScale onPress={() => router.push(`/memory/${yearAgo.id}`)} accessibilityRole="button" accessibilityLabel={`${yearAgoPlace.name} 1년 전 기억 보기`} style={[styles.yearCard, { backgroundColor: colors.surfaceGlass, borderColor: colors.border, boxShadow: shadow.soft }]}>
          <View style={[styles.yearIcon, { backgroundColor: colors.accentSoft }]}><Ionicons name="time-outline" size={18} color={colors.accent} /></View>
          <View style={styles.yearCopy}><ThemedText variant="headline">{yearAgoPlace.name}</ThemedText><ThemedText variant="caption">{new Date(yearAgo.startedAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</ThemedText></View>
          <MemoryImage uri={yearAgo.photos[0]?.uri ?? yearAgoPlace.coverPhoto ?? ''} style={styles.yearPhoto} accessibilityLabel={yearAgoPlace.name} />
        </PressableScale>
      </View> : null}

      <View style={styles.section}>
        <View style={styles.sectionHeader}><View><ThemedText variant="headline">이번 달 Trace</ThemedText><ThemedText variant="caption">{today.getMonth() + 1}월에 남긴 발자취</ThemedText></View><PressableScale onPress={() => router.push({ pathname: '/review/[year]', params: { year: String(today.getFullYear()) } })}><ThemedText variant="caption" style={{ color: colors.accent }}>돌아보기</ThemedText></PressableScale></View>
        {hasMonthlyData ? <View style={styles.stats}><StatCard value={monthly.placeCount} label="장소" icon="location" /><StatCard value={monthly.memoryCount} label="기억" icon="sparkles" /><StatCard value={monthly.photoCount} label="사진" icon="images" /></View> : <View style={[styles.monthlyEmpty, { backgroundColor: colors.surfaceGlass, borderColor: colors.border }]}><ThemedText variant="subhead">{today.getMonth() + 1}월의 Trace</ThemedText><ThemedText variant="caption" style={{ color: colors.secondaryText }}>아직 이번 달 기록이 없어요.</ThemedText></View>}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.ml, paddingTop: spacing.sm, paddingBottom: 124, gap: spacing.lg, overflow: 'hidden' },
  ambientTop: { width: 220, height: 220, borderRadius: radius.full, position: 'absolute', top: -118, right: -104, opacity: 0.34 },
  header: { minHeight: 68, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  headerCopy: { gap: spacing.xxs },
  headerTitle: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs },
  stats: { flexDirection: 'row', gap: spacing.xs },
  section: { gap: spacing.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  memoryRow: { gap: spacing.xs, paddingRight: spacing.ml },
  memoryCard: { borderRadius: radius.md, borderCurve: 'continuous', borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  memoryPhoto: { width: '100%', aspectRatio: 1.28 },
  memoryCopy: { padding: spacing.xs, gap: 1 },
  memoryName: { fontWeight: '700' },
  yearCard: { minHeight: 86, borderRadius: radius.card, borderCurve: 'continuous', borderWidth: StyleSheet.hairlineWidth, padding: spacing.sm, alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  yearIcon: { width: 38, height: 38, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  yearCopy: { flex: 1, gap: spacing.xxs },
  yearPhoto: { width: 62, height: 62, borderRadius: radius.sm },
  monthlyEmpty: { minHeight: 64, borderRadius: radius.card, borderWidth: StyleSheet.hairlineWidth, justifyContent: 'center', paddingHorizontal: spacing.md },
});
