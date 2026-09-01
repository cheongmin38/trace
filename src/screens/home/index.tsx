import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppHeader } from '@/components/app-header';
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
  const { colors } = useTraceTheme();
  const [today] = useState(() => new Date());
  const [loading] = useState(false);
  const visits = useAppStore((state) => state.visits);
  const memories = useAppStore((state) => state.memories);
  const places = useAppStore((state) => state.places);
  const dayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const todayVisits = useMemo(() => visits.filter((visit) => visit.startedAt.slice(0, 10) === dayKey), [dayKey, visits]);
  const todayMemories = useMemo(() => memories.filter((memory) => memory.startedAt.slice(0, 10) === dayKey), [dayKey, memories]);
  const photoCount = todayMemories.reduce((total, memory) => total + memory.photos.length, 0);
  const duration = todayVisits.reduce((total, visit) => total + (visit.durationMinutes ?? 0), 0);
  const monthly = getMonthlyReview(places, visits, memories, today.getFullYear(), today.getMonth() + 1);
  const recent = [...memories].sort((a, b) => +new Date(b.startedAt) - +new Date(a.startedAt)).slice(0, 5);
  const yearAgoTarget = new Date(today); yearAgoTarget.setFullYear(yearAgoTarget.getFullYear() - 1);
  const yearAgo = memories.find((memory) => new Date(memory.startedAt).toDateString() === yearAgoTarget.toDateString());
  const yearAgoPlace = places.find((place) => place.id === yearAgo?.placeId);

  return <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={[styles.content, { backgroundColor: colors.background }]}>
    <AppHeader title="Trace" subtitle={today.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' })} actions={<><IconButton name="notifications-outline" label="알림" onPress={() => router.push('/notifications')} /><IconButton name="person-circle-outline" label="프로필" onPress={() => router.push('/profile')} /></>} />
    {loading ? <SkeletonCard /> : <PressableScale onPress={() => router.push('/timeline')} style={[styles.todayLead, { backgroundColor: colors.surfaceGlass, borderColor: colors.border, boxShadow: shadow.card }]}>
      <View style={[styles.todayLeadIcon, { backgroundColor: colors.accentSoft }]}><Ionicons name="sparkles" size={17} color={colors.accent} /></View>
      <View style={styles.todayLeadCopy}><ThemedText variant="headline">오늘의 Trace</ThemedText><ThemedText variant="subhead" style={{ color: colors.secondaryText }}>{todayVisits.length ? `${todayVisits.length}곳의 방문을 정리했어요.` : '새로운 발자취를 기다리고 있어요.'}</ThemedText></View>
      <Ionicons name="chevron-forward" size={18} color={colors.tertiaryText} />
    </PressableScale>}
    <View style={styles.stats}><StatCard value={todayVisits.length} label="방문 장소" icon="location" /><StatCard value={photoCount} label="찍은 사진" icon="camera" /><StatCard value={duration} label="머문 시간" icon="time" /></View>
    <DailySummaryCard date={dayKey} />
    <View style={styles.section}><View style={styles.sectionHeader}><View><ThemedText variant="title">최근 기억</ThemedText><ThemedText variant="caption">다시 보고 싶은 순간들</ThemedText></View><PressableScale onPress={() => router.push('/timeline')}><ThemedText variant="caption" style={{ color: colors.warm }}>전체 보기</ThemedText></PressableScale></View>{recent.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.memoryRow}>{recent.map((memory, index) => { const place = places.find((item) => item.id === memory.placeId); return <PressableScale key={memory.id} onPress={() => router.push(`/memory/${memory.id}`)} style={[styles.memoryCard, index === 0 && styles.memoryCardLarge, { backgroundColor: colors.surface, boxShadow: shadow.soft }]}><MemoryImage uri={memory.photos[0]?.uri ?? place?.coverPhoto ?? ''} style={styles.memoryPhoto} accessibilityLabel={place?.name ?? memory.title} /><View style={styles.memoryCopy}><ThemedText variant="headline" numberOfLines={1}>{place?.name ?? memory.title}</ThemedText><ThemedText variant="caption">{new Date(memory.startedAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })} · 사진 {memory.photos.length}장</ThemedText></View></PressableScale>; })}</ScrollView> : <EmptyState title="아직 기억이 없어요" description="Trace가 첫 장소와 사진을 연결하면 이곳에서 보여드릴게요." />}</View>
    {yearAgo && yearAgoPlace ? <View style={styles.section}><ThemedText variant="title">1년 전 오늘</ThemedText><PressableScale onPress={() => router.push(`/memory/${yearAgo.id}`)} style={[styles.yearCard, { backgroundColor: colors.surface, boxShadow: shadow.soft }]}><MemoryImage uri={yearAgo.photos[0]?.uri ?? yearAgoPlace.coverPhoto ?? ''} style={styles.yearPhoto} accessibilityLabel={yearAgoPlace.name} /><View style={styles.yearCopy}><ThemedText variant="caption" style={{ color: colors.warm }}>ON THIS DAY</ThemedText><ThemedText variant="headline">{yearAgoPlace.name}</ThemedText><ThemedText variant="subhead">그날의 기억 다시 보기</ThemedText></View><Ionicons name="chevron-forward" size={18} color={colors.tertiaryText} /></PressableScale></View> : null}
    <View style={styles.section}><View style={styles.sectionHeader}><View><ThemedText variant="title">이번 달</ThemedText><ThemedText variant="caption">{today.getMonth() + 1}월의 발자취</ThemedText></View><PressableScale onPress={() => router.push({ pathname: '/review/[year]', params: { year: String(today.getFullYear()) } })}><ThemedText variant="caption" style={{ color: colors.warm }}>월간 리뷰</ThemedText></PressableScale></View><View style={styles.stats}><StatCard value={monthly.placeCount} label="방문 장소" /><StatCard value={monthly.memoryCount} label="기억" /><StatCard value={monthly.photoCount} label="사진" /></View></View>
  </ScrollView>;
}

const styles = StyleSheet.create({ content: { paddingHorizontal: spacing.ml, paddingTop: spacing.sm, paddingBottom: 124, gap: spacing.lg }, todayLead: { minHeight: 76, borderRadius: radius.card, borderCurve: 'continuous', borderWidth: StyleSheet.hairlineWidth, padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm }, todayLeadIcon: { width: 38, height: 38, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' }, todayLeadCopy: { flex: 1, gap: 2 }, stats: { flexDirection: 'row', gap: spacing.xs }, section: { gap: spacing.md }, sectionHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }, memoryRow: { gap: spacing.sm, paddingRight: spacing.ml }, memoryCard: { width: 166, borderRadius: radius.card, borderCurve: 'continuous', overflow: 'hidden' }, memoryCardLarge: { width: 218 }, memoryPhoto: { width: '100%', aspectRatio: 1.06 }, memoryCopy: { padding: spacing.sm, gap: spacing.xxs }, yearCard: { minHeight: 112, borderRadius: radius.card, borderCurve: 'continuous', padding: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.sm }, yearPhoto: { width: 88, height: 88, borderRadius: radius.md }, yearCopy: { flex: 1, gap: spacing.xxs } });
