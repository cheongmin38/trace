import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import type { ColorValue } from 'react-native';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { cancelAnimation, ReduceMotion, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { DailySummaryCard } from '@/components/daily-summary-card';
import { EmptyState } from '@/components/empty-state';
import { IconButton } from '@/components/icon-button';
import { MemoryImage } from '@/components/memory-image';
import { PressableScale } from '@/components/pressable-scale';
import { SkeletonCard } from '@/components/skeleton-card';
import { ThemedText } from '@/components/themed-text';
import { useAppStore } from '@/store/app-store';
import { useLocationStore } from '@/store/location-store';
import { radius, shadow, spacing, useTraceTheme } from '@/theme';
import { buildHomeInsights, visitDurationMinutes } from './home-insights';

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes}분`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours}시간 ${remainder}분` : `${hours}시간`;
}

function relativeDate(value: string, now: Date) {
  const delta = Math.floor((new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() - new Date(new Date(value).getFullYear(), new Date(value).getMonth(), new Date(value).getDate()).getTime()) / 86_400_000);
  if (delta === 0) return '오늘';
  if (delta === 1) return '어제';
  if (delta < 7) return `${delta}일 전`;
  return new Date(value).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
}

function LivePulse({ color }: { color: ColorValue }) {
  const reducedMotion = useReducedMotion();
  const opacity = useSharedValue(1);
  useEffect(() => {
    if (reducedMotion) return;
    opacity.set(withRepeat(withTiming(0.38, { duration: 900, reduceMotion: ReduceMotion.System }), -1, true));
    return () => cancelAnimation(opacity);
  }, [opacity, reducedMotion]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.get() }));
  return <Animated.View style={[styles.livePulse, { backgroundColor: color }, style]} />;
}

export function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { colors } = useTraceTheme();
  const [now, setNow] = useState(() => new Date());
  const places = useAppStore((state) => state.places);
  const visits = useAppStore((state) => state.visits);
  const memories = useAppStore((state) => state.memories);
  const dataHydrated = useAppStore((state) => state.dataHydrated);
  const detection = useLocationStore((state) => state.detection);
  const insights = useMemo(() => buildHomeInsights({ places, visits, memories, now }), [memories, now, places, visits]);
  const activeVisit = detection?.status === 'confirmed' && detection.confirmedVisitId
    ? visits.find((visit) => visit.id === detection.confirmedVisitId) ?? null
    : null;
  const activePlace = activeVisit ? places.find((place) => place.id === activeVisit.placeId) ?? null : null;
  const cardWidth = Math.min(188, Math.max(152, (width - spacing.ml * 2) * 0.4));
  const hasMonth = insights.monthly.placeCount > 0 || insights.monthly.memoryCount > 0 || insights.monthly.photoCount > 0;

  useEffect(() => {
    if (!activeVisit) return;
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, [activeVisit]);

  return <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={[styles.content, { backgroundColor: colors.background }]}>
    <View pointerEvents="none" style={[styles.ambientTop, { backgroundColor: colors.accentSoft }]} />
    <View style={styles.header}>
      <PressableScale onPress={() => router.push('/timeline')} style={styles.headerCopy} accessibilityRole="button" accessibilityLabel="오늘 기록 보기">
        <View style={styles.headerTitle}><ThemedText variant="title">오늘의 Trace</ThemedText><Ionicons name="chevron-down" size={17} color={colors.secondaryText} /></View>
        <ThemedText variant="caption" style={{ color: colors.secondaryText }}>{now.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}</ThemedText>
      </PressableScale>
      <IconButton name="notifications-outline" label="알림" onPress={() => router.push('/notifications')} filled />
    </View>

    {!dataHydrated ? <SkeletonCard /> : <>
      <View style={[styles.hero, { backgroundColor: colors.surface, borderColor: colors.border, boxShadow: shadow.card }]}>
        <View pointerEvents="none" style={[styles.heroGlow, { backgroundColor: colors.accentSoft }]} />
        <View style={styles.heroTopLine}><View style={[styles.heroEyebrow, { backgroundColor: colors.accentSoft }]}><Ionicons name="sparkles" color={colors.accent} size={14} /><ThemedText variant="caption" style={{ color: colors.accent }}>오늘의 Trace</ThemedText></View><Ionicons name="arrow-forward" size={18} color={colors.tertiaryText} /></View>
        {insights.todayVisits.length ? <>
          <View style={styles.heroMetrics}>
            <HeroMetric value={`${insights.todayPlaceCount}`} label="방문 장소" />
            <HeroMetric value={`${insights.todayPhotoCount}`} label="사진" />
            <HeroMetric value={formatDuration(insights.todayDurationMinutes)} label="머문 시간" />
          </View>
          <DailySummaryCard date={insights.todayKey} inline style={{ borderColor: colors.border }} />
        </> : <View style={styles.emptyHeroCopy}><ThemedText variant="title">오늘의 Trace가 아직 비어 있어요.</ThemedText><ThemedText variant="subhead" style={{ color: colors.secondaryText }}>하루를 보내면 방문과 사진을 자동으로 정리해드릴게요.</ThemedText></View>}
      </View>

      {activeVisit && activePlace ? <PressableScale onPress={() => router.push(`/place/${activePlace.id}`)} accessibilityRole="button" accessibilityLabel={`${activePlace.name} 장소 기록 보기`} style={[styles.liveCard, { backgroundColor: colors.surfaceGlass, borderColor: colors.border, boxShadow: shadow.soft }]}>
        <View style={styles.liveHeader}><View style={styles.liveStatus}><LivePulse color={colors.accent} /><ThemedText variant="caption" style={{ color: colors.accent }}>지금 기록 중</ThemedText></View><Ionicons name="navigate-outline" size={18} color={colors.accent} /></View>
        <ThemedText variant="headline">{activePlace.name}</ThemedText>
        <ThemedText variant="subhead" style={{ color: colors.secondaryText }}>{formatDuration(visitDurationMinutes(activeVisit, now))}째 머무는 중</ThemedText>
      </PressableScale> : null}

      {insights.todayVisits.length >= 2 ? <View style={styles.section}>
        <View style={styles.sectionHeader}><View><ThemedText variant="headline">오늘의 동선</ThemedText><ThemedText variant="caption">시간순으로 이어진 하루</ThemedText></View><PressableScale onPress={() => router.push('/map')} accessibilityRole="button"><ThemedText variant="caption" style={{ color: colors.accent }}>지도 보기</ThemedText></PressableScale></View>
        <PressableScale onPress={() => router.push('/map')} style={[styles.journeyCard, { backgroundColor: colors.surfaceGlass, borderColor: colors.border }]} accessibilityRole="button" accessibilityLabel="오늘의 동선 지도 보기">
          {insights.todayVisits.slice(0, 4).map((visit, index) => {
            const place = places.find((item) => item.id === visit.placeId);
            return <View key={visit.id} style={styles.journeyRow}><View style={styles.journeyRail}><View style={[styles.journeyDot, { backgroundColor: index === 0 ? colors.accent : colors.accentSoft }]} />{index < Math.min(insights.todayVisits.length, 4) - 1 ? <View style={[styles.journeyLine, { backgroundColor: colors.border }]} /> : null}</View><View style={styles.journeyCopy}><ThemedText variant="caption" style={{ color: colors.secondaryText }}>{new Date(visit.startedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</ThemedText><ThemedText variant="subhead">{place?.name ?? '기록된 장소'}</ThemedText></View></View>;
          })}
        </PressableScale>
      </View> : null}

      <View style={styles.section}>
        <View style={styles.sectionHeader}><View><ThemedText variant="headline">최근 Memory</ThemedText><ThemedText variant="caption">다시 꺼내보고 싶은 순간들</ThemedText></View><PressableScale onPress={() => router.push('/timeline')} accessibilityRole="button"><ThemedText variant="caption" style={{ color: colors.accent }}>전체 보기</ThemedText></PressableScale></View>
        {insights.recentMemories.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.memoryRow}>
          {insights.recentMemories.map((memory) => {
            const place = places.find((item) => item.id === memory.placeId);
            return <PressableScale key={memory.id} onPress={() => router.push(`/memory/${memory.id}`)} accessibilityRole="button" accessibilityLabel={`${place?.name ?? memory.title} 기억 보기`} style={[styles.memoryCard, { width: cardWidth, backgroundColor: colors.surface, borderColor: colors.border, boxShadow: shadow.soft }]}>
              <MemoryImage uri={memory.photos[0]?.uri ?? place?.coverPhoto ?? ''} style={styles.memoryPhoto} accessibilityLabel={place?.name ?? memory.title} />
              <View style={styles.memoryCopy}><ThemedText variant="subhead" numberOfLines={1} style={styles.memoryName}>{place?.name ?? memory.title}</ThemedText><ThemedText variant="caption" style={{ color: colors.secondaryText }}>{relativeDate(memory.startedAt, now)} · 사진 {memory.photos.length}장</ThemedText></View>
            </PressableScale>;
          })}
        </ScrollView> : <EmptyState title="아직 만들어진 추억이 없어요." description={'첫 방문을 기록하면\n사진과 함께 저장해 드려요.'} />}
      </View>

      {insights.discovery ? (() => {
        const place = places.find((item) => item.id === insights.discovery?.memory.placeId);
        if (!place) return null;
        const memory = insights.discovery.memory;
        return <View style={styles.section}><View style={styles.sectionHeader}><View><ThemedText variant="headline">오늘의 발견</ThemedText><ThemedText variant="caption">지금 다시 만나보는 기억</ThemedText></View></View><PressableScale onPress={() => router.push(`/memory/${memory.id}`)} accessibilityRole="button" style={[styles.discoveryCard, { backgroundColor: colors.surface, borderColor: colors.border, boxShadow: shadow.soft }]}><MemoryImage uri={memory.photos[0]?.uri ?? place.coverPhoto ?? ''} style={styles.discoveryPhoto} accessibilityLabel={place.name} /><View style={styles.discoveryOverlay}><View style={[styles.discoveryBadge, { backgroundColor: colors.surfaceGlass }]}><Ionicons name="time-outline" color={colors.accent} size={14} /><ThemedText variant="caption" style={{ color: colors.accent }}>{insights.discovery.label}</ThemedText></View><ThemedText variant="title" style={{ color: '#FFFFFF' }}>{place.name}</ThemedText><ThemedText variant="caption" style={{ color: 'rgba(255,255,255,0.88)' }}>사진 {memory.photos.length}장 · 다시 보기</ThemedText></View></PressableScale></View>;
      })() : null}

      <View style={styles.section}>
        <View style={styles.sectionHeader}><View><ThemedText variant="headline">나의 지도</ThemedText><ThemedText variant="caption">기록한 발자취로 채워지는 공간</ThemedText></View><PressableScale onPress={() => router.push('/map')} accessibilityRole="button"><ThemedText variant="caption" style={{ color: colors.accent }}>지도 보기</ThemedText></PressableScale></View>
        {insights.exploration.length ? <PressableScale onPress={() => router.push('/map')} accessibilityRole="button" style={[styles.explorationCard, { backgroundColor: colors.lavender, borderColor: colors.border }]}><View style={styles.explorationIcon}><Ionicons name="compass" color={colors.accent} size={22} /></View><View style={styles.explorationCopy}><ThemedText variant="title">{insights.exploration.length}개 지역</ThemedText><ThemedText variant="caption" style={{ color: colors.secondaryText }}>방문 장소 {insights.exploredPlaceCount}곳 · 새로 발견한 지역 {insights.newlyExploredRegionCount}곳</ThemedText></View><Ionicons name="arrow-forward" color={colors.accent} size={18} /></PressableScale> : <PressableScale onPress={() => router.push('/map')} accessibilityRole="button" style={[styles.explorationEmpty, { backgroundColor: colors.surfaceGlass, borderColor: colors.border }]}><Ionicons name="map-outline" color={colors.accent} size={20} /><ThemedText variant="subhead">첫 지역을 발견해보세요.</ThemedText></PressableScale>}
      </View>

      {insights.weekly.visitCount ? <View style={styles.section}>
        <View style={styles.sectionHeader}><View><ThemedText variant="headline">이번 주 Trace</ThemedText><ThemedText variant="caption">이번 주에 쌓인 기록</ThemedText></View></View>
        <View style={[styles.weeklyCard, { backgroundColor: colors.surfaceGlass, borderColor: colors.border, boxShadow: shadow.soft }]}><View style={styles.weekStats}><MiniMetric value={`${insights.weekly.placeCount}곳`} label="방문 장소" /><MiniMetric value={`${insights.weekly.photoCount}장`} label="사진" /><MiniMetric value={formatDuration(insights.weekly.durationMinutes)} label="머문 시간" /></View>{insights.weekly.newPlaceCount ? <View style={[styles.weekFoot, { borderTopColor: colors.border }]}><Ionicons name="sparkles-outline" size={15} color={colors.accent} /><ThemedText variant="caption" style={{ color: colors.secondaryText }}>새롭게 발견한 장소 {insights.weekly.newPlaceCount}곳</ThemedText></View> : null}{insights.weekly.longestVisit ? <View style={styles.weekFoot}><Ionicons name="time-outline" size={15} color={colors.accent} /><ThemedText variant="caption" style={{ color: colors.secondaryText }}>가장 오래 머문 곳 · {places.find((place) => place.id === insights.weekly.longestVisit?.placeId)?.name ?? '기록된 장소'} {formatDuration(visitDurationMinutes(insights.weekly.longestVisit, now))}</ThemedText></View> : null}</View>
      </View> : null}

      <View style={styles.section}>
        <View style={styles.sectionHeader}><View><ThemedText variant="headline">{now.getMonth() + 1}월의 Trace</ThemedText><ThemedText variant="caption">이번 달에 남긴 발자취</ThemedText></View>{hasMonth ? <PressableScale onPress={() => router.push({ pathname: '/review/[year]', params: { year: String(now.getFullYear()) } })} accessibilityRole="button"><ThemedText variant="caption" style={{ color: colors.accent }}>돌아보기</ThemedText></PressableScale> : null}</View>
        {hasMonth ? <View style={[styles.monthlyCard, { backgroundColor: colors.surfaceGlass, borderColor: colors.border }]}><MiniMetric value={`${insights.monthly.placeCount}`} label="장소" /><MiniMetric value={`${insights.monthly.memoryCount}`} label="Memory" /><MiniMetric value={`${insights.monthly.photoCount}`} label="사진" /></View> : <View style={[styles.monthlyEmpty, { backgroundColor: colors.surfaceGlass, borderColor: colors.border }]}><ThemedText variant="subhead">아직 이번 달 기록이 없어요.</ThemedText></View>}
      </View>
    </>}
  </ScrollView>;
}

function HeroMetric({ value, label }: { value: string; label: string }) {
  return <View style={styles.heroMetric}><ThemedText variant="title" style={styles.metricValue}>{value}</ThemedText><ThemedText variant="caption" style={styles.metricLabel}>{label}</ThemedText></View>;
}

function MiniMetric({ value, label }: { value: string; label: string }) {
  return <View style={styles.miniMetric}><ThemedText variant="headline" style={{ fontVariant: ['tabular-nums'] }}>{value}</ThemedText><ThemedText variant="caption">{label}</ThemedText></View>;
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.ml, paddingTop: spacing.sm, paddingBottom: 124, gap: spacing.lg, overflow: 'hidden' },
  ambientTop: { width: 230, height: 230, borderRadius: radius.full, position: 'absolute', top: -132, right: -106, opacity: 0.34 },
  header: { minHeight: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  headerCopy: { gap: spacing.xxs },
  headerTitle: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs },
  hero: { padding: spacing.md, borderRadius: radius.lg, borderCurve: 'continuous', borderWidth: StyleSheet.hairlineWidth, gap: spacing.md, overflow: 'hidden' },
  heroGlow: { position: 'absolute', width: 166, height: 166, borderRadius: radius.full, right: -82, top: -78, opacity: 0.8 },
  heroTopLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroEyebrow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs, paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radius.full },
  heroMetrics: { flexDirection: 'row', gap: spacing.xs },
  heroMetric: { flex: 1, gap: 2 },
  metricValue: { fontVariant: ['tabular-nums'] },
  metricLabel: { color: '#777780' },
  emptyHeroCopy: { gap: spacing.xs, paddingVertical: spacing.xs },
  liveCard: { padding: spacing.md, borderRadius: radius.card, borderCurve: 'continuous', borderWidth: StyleSheet.hairlineWidth, gap: spacing.xxs },
  liveHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  liveStatus: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  livePulse: { width: 8, height: 8, borderRadius: radius.full },
  section: { gap: spacing.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: spacing.sm },
  journeyCard: { padding: spacing.md, borderRadius: radius.card, borderCurve: 'continuous', borderWidth: StyleSheet.hairlineWidth, gap: spacing.xs },
  journeyRow: { minHeight: 40, flexDirection: 'row', gap: spacing.sm },
  journeyRail: { width: 16, alignItems: 'center', position: 'relative' },
  journeyDot: { width: 10, height: 10, borderRadius: radius.full, marginTop: 4 },
  journeyLine: { width: 1, flex: 1, minHeight: 26, marginTop: 4 },
  journeyCopy: { flex: 1, gap: 1, paddingBottom: spacing.xs },
  memoryRow: { gap: spacing.sm, paddingRight: spacing.ml },
  memoryCard: { borderRadius: radius.md, borderCurve: 'continuous', borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  memoryPhoto: { width: '100%', aspectRatio: 1.28 },
  memoryCopy: { padding: spacing.sm, gap: 2 },
  memoryName: { fontWeight: '700' },
  discoveryCard: { height: 184, borderRadius: radius.card, borderCurve: 'continuous', borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', position: 'relative' },
  discoveryPhoto: { width: '100%', height: '100%' },
  discoveryOverlay: { position: 'absolute', inset: 0, padding: spacing.md, justifyContent: 'flex-end', gap: spacing.xxs, backgroundColor: 'rgba(16, 13, 29, 0.28)' },
  discoveryBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: spacing.xxs, paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radius.full, marginBottom: 'auto' },
  explorationCard: { minHeight: 102, padding: spacing.md, borderRadius: radius.card, borderCurve: 'continuous', borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  explorationIcon: { width: 42, height: 42, borderRadius: radius.md, backgroundColor: 'rgba(255,255,255,0.68)', alignItems: 'center', justifyContent: 'center' },
  explorationCopy: { flex: 1, gap: spacing.xxs },
  explorationEmpty: { minHeight: 58, borderRadius: radius.card, borderCurve: 'continuous', borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  weeklyCard: { borderRadius: radius.card, borderCurve: 'continuous', borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  weekStats: { flexDirection: 'row', padding: spacing.md, gap: spacing.sm },
  miniMetric: { flex: 1, gap: 2 },
  weekFoot: { flexDirection: 'row', gap: spacing.xs, alignItems: 'center', paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  monthlyCard: { flexDirection: 'row', padding: spacing.md, borderRadius: radius.card, borderCurve: 'continuous', borderWidth: StyleSheet.hairlineWidth, gap: spacing.sm },
  monthlyEmpty: { minHeight: 60, paddingHorizontal: spacing.md, justifyContent: 'center', borderRadius: radius.card, borderCurve: 'continuous', borderWidth: StyleSheet.hairlineWidth },
});
