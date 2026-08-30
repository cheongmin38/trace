import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Modal, Pressable, RefreshControl, SectionList, StyleSheet, View } from 'react-native';
import { AppHeader } from '@/components/app-header';
import { EmptyState } from '@/components/empty-state';
import { FilterSheet } from '@/components/filter-sheet';
import { IconButton } from '@/components/icon-button';
import { MemoryImage } from '@/components/memory-image';
import { PhotoThumbnail } from '@/components/photo-thumbnail';
import { PressableScale } from '@/components/pressable-scale';
import { SearchBar } from '@/components/search-bar';
import { SkeletonCard } from '@/components/skeleton-card';
import { ThemedText } from '@/components/themed-text';
import { formatVisitTime } from '@/services/mock-archive';
import { useAppStore } from '@/store/app-store';
import { radius, spacing, useTraceTheme } from '@/theme';
import { isMemoryVisible } from '@/utils/trace-selectors';
import type { Memory, TimelineFilter, Visit } from '@/types/trace';

type ContentFilter = 'all' | 'visit' | 'photo' | 'trip';
type TimelineRow = { visit: Visit; memory: Memory | null };
type DaySection = { key: string; title: string; data: TimelineRow[]; placeCount: number; photoCount: number };

const contentFilters: { key: ContentFilter; label: string }[] = [
  { key: 'all', label: '전체' }, { key: 'visit', label: '방문' }, { key: 'photo', label: '사진' }, { key: 'trip', label: '여행' },
];

function localKey(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
function monthKey(key: string) { return key.slice(0, 7); }
function dayTitle(key: string) { return new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' }).format(new Date(`${key}T12:00:00`)); }
function monthTitle(key: string) { return new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long' }).format(new Date(`${key}-01T12:00:00`)); }
function durationLabel(minutes?: number) { if (!minutes) return '체류 시간 기록 중'; if (minutes < 60) return `${minutes}분`; return `${Math.floor(minutes / 60)}시간 ${minutes % 60 ? `${minutes % 60}분` : ''}`.trim(); }

export function TimelineScreen() {
  const router = useRouter();
  const { colors } = useTraceTheme();
  const memories = useAppStore((state) => state.memories);
  const places = useAppStore((state) => state.places);
  const visits = useAppStore((state) => state.visits);
  const settings = useAppStore((state) => state.settings);
  const query = useAppStore((state) => state.searchQuery);
  const setQuery = useAppStore((state) => state.setSearchQuery);
  const timelineFilter = useAppStore((state) => state.timelineFilter);
  const setTimelineFilter = useAppStore((state) => state.setTimelineFilter);
  const [contentFilter, setContentFilter] = useState<ContentFilter>('all');
  const [month, setMonth] = useState(() => localKey(new Date()).slice(0, 7));
  const [searching, setSearching] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [monthOpen, setMonthOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading] = useState(false);
  const [now] = useState(() => new Date());
  const listRef = useRef<SectionList<TimelineRow, DaySection>>(null);
  const placesById = useMemo(() => new Map(places.map((place) => [place.id, place])), [places]);
  const memoriesByVisitId = useMemo(() => new Map(memories.map((memory) => [memory.visitId, memory])), [memories]);

  const sections = useMemo<DaySection[]>(() => {
    const normalized = query.trim().toLocaleLowerCase('ko-KR');
    const nowMs = now.getTime();
    const grouped = new Map<string, TimelineRow[]>();
    visits.forEach((visit) => {
      const place = placesById.get(visit.placeId);
      const memory = memoriesByVisitId.get(visit.id) ?? null;
      if (!place || monthKey(visit.startedAt.slice(0, 7)) !== month) return;
      if (visit.source === 'demo') return;
      if (memory && !isMemoryVisible(memory, place, settings)) return;
      const haystack = `${place.name} ${place.address ?? ''} ${memory?.title ?? ''}`.toLocaleLowerCase('ko-KR');
      if (normalized && !haystack.includes(normalized)) return;
      const age = Math.max(0, nowMs - new Date(visit.startedAt).getTime());
      if (timelineFilter === 'RECENT_7_DAYS' && age > 7 * 86400000) return;
      if (timelineFilter === 'RECENT_30_DAYS' && age > 30 * 86400000) return;
      if (timelineFilter === 'WITH_PHOTOS' && !memory?.photos.length) return;
      if (timelineFilter === 'FREQUENT_PLACES' && (place.visitCount ?? 0) < 2) return;
      if (contentFilter === 'photo' && !memory?.photos.length) return;
      if (contentFilter === 'trip' && place.resolvedCategory !== 'travel' && place.category !== 'TRAVEL') return;
      const key = visit.startedAt.slice(0, 10);
      grouped.set(key, [...(grouped.get(key) ?? []), { visit, memory }]);
    });
    return [...grouped.entries()].sort(([a], [b]) => b.localeCompare(a)).map(([key, rows]) => {
      const sorted = rows.sort((a, b) => a.visit.startedAt.localeCompare(b.visit.startedAt));
      return { key, title: dayTitle(key), data: sorted, placeCount: new Set(sorted.map((row) => row.visit.placeId)).size, photoCount: sorted.reduce((sum, row) => sum + (row.memory?.photos.length ?? 0), 0) };
    });
  }, [contentFilter, memoriesByVisitId, month, now, placesById, query, settings, timelineFilter, visits]);

  const availableMonths = useMemo(() => [...new Set(visits.map((visit) => visit.startedAt.slice(0, 7)))].sort((a, b) => b.localeCompare(a)), [visits]);
  const refresh = () => { setRefreshing(true); setTimeout(() => setRefreshing(false), 650); };
  const scrollToDay = (index: number) => listRef.current?.scrollToLocation({ sectionIndex: index, itemIndex: 0, animated: true, viewPosition: 0.12 });

  return <View style={[styles.root, { backgroundColor: colors.background }]}>
    {loading ? <View style={styles.skeleton}><SkeletonCard /><SkeletonCard /></View> : <SectionList
      ref={listRef}
      sections={sections}
      keyExtractor={(item) => item.visit.id}
      stickySectionHeadersEnabled={false}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.text} />}
      ListHeaderComponent={<View style={styles.header}>
        {searching ? <SearchBar value={query} onChangeText={setQuery} onClose={() => { setSearching(false); setQuery(''); }} /> : <AppHeader title="기록" subtitle="시간순으로 쌓인 당신의 기억" actions={<><IconButton name="search" label="검색" onPress={() => setSearching(true)} /><IconButton name="options-outline" label="기록 필터" onPress={() => setFilterOpen(true)} /></>} />}
        <PressableScale onPress={() => setMonthOpen(true)} style={[styles.monthSelector, { backgroundColor: colors.surface }]}><ThemedText variant="headline">{monthTitle(month)}</ThemedText><Ionicons name="chevron-down" size={18} color={colors.secondaryText} /></PressableScale>
        <View style={styles.chips}>{contentFilters.map((item) => <PressableScale key={item.key} onPress={() => setContentFilter(item.key)} style={[styles.chip, { backgroundColor: contentFilter === item.key ? colors.text : colors.surfaceMuted }]}><ThemedText variant="caption" style={{ color: contentFilter === item.key ? colors.onAccent : colors.secondaryText }}>{item.label}</ThemedText></PressableScale>)}</View>
      </View>}
      renderSectionHeader={({ section }) => <PressableScale onPress={() => scrollToDay(sections.indexOf(section))} style={styles.dayHeader}><View><ThemedText variant="headline">{section.title}</ThemedText><ThemedText variant="caption" style={{ color: colors.secondaryText }}>방문 {section.placeCount} · 사진 {section.photoCount}</ThemedText></View><View style={[styles.indicator, { backgroundColor: section.photoCount ? colors.accent : colors.border }]} /></PressableScale>}
      renderItem={({ item, index, section }) => { const place = placesById.get(item.visit.placeId); if (!place) return null; const image = item.memory?.photos[0]?.uri ?? place.coverPhoto ?? ''; return <PressableScale onPress={() => router.push(item.memory ? { pathname: '/memory/[id]', params: { id: item.memory.id } } : { pathname: '/visit/[id]', params: { id: item.visit.id } })} style={styles.row}>
        <View style={styles.timeColumn}><ThemedText variant="caption" style={styles.time}>{formatVisitTime(item.visit.startedAt)}</ThemedText><View style={[styles.line, { backgroundColor: colors.border }]} /></View><View style={[styles.dot, { backgroundColor: colors.text }]} /><View style={[styles.rowCard, { backgroundColor: colors.surface }]}><View style={styles.rowCopy}><View style={styles.placeLine}><ThemedText variant="headline" numberOfLines={1} style={styles.placeName}>{place.name}</ThemedText>{!item.visit.endedAt ? <View style={[styles.badge, { backgroundColor: colors.accentSoft }]}><ThemedText variant="caption">Live</ThemedText></View> : item.visit.source === 'gps' ? <View style={[styles.badge, { backgroundColor: colors.surfaceMuted }]}><ThemedText variant="caption">Auto</ThemedText></View> : null}</View><ThemedText variant="caption" style={{ color: colors.secondaryText }}>{durationLabel(item.visit.durationMinutes)} · 방문 {item.visit.visitNumber}회</ThemedText>{item.memory ? <View style={styles.thumbs}>{item.memory.photos.slice(0, 3).map((photo) => <PhotoThumbnail key={photo.id} uri={photo.uri} label={`${place.name} 사진`} />)}<ThemedText variant="caption" style={{ color: colors.secondaryText }}>사진 {item.memory.photos.length}장</ThemedText></View> : <ThemedText variant="caption" style={{ color: colors.tertiaryText }}>사진 없는 방문 기록</ThemedText>}</View><MemoryImage uri={image} accessibilityLabel={place.name} style={[styles.thumbnail, { backgroundColor: colors.surfaceMuted }]} /></View>
      </PressableScale>; }}
      ListEmptyComponent={<EmptyState title={query ? '찾는 추억이 없어요' : '아직 이 달의 기록이 없어요'} description={query ? '다른 장소 이름으로 검색해보세요.' : '방문 기록이 쌓이면 날짜별로 보여드릴게요.'} />}
    />}
    <FilterSheet visible={filterOpen} selected={timelineFilter} onSelect={(value: TimelineFilter) => setTimelineFilter(value)} onClose={() => setFilterOpen(false)} />
    <Modal visible={monthOpen} transparent animationType="slide" onRequestClose={() => setMonthOpen(false)}><Pressable style={[styles.scrim, { backgroundColor: colors.scrim }]} onPress={() => setMonthOpen(false)}><View style={[styles.sheet, { backgroundColor: colors.surface }]}><View style={[styles.grabber, { backgroundColor: colors.border }]} /><ThemedText variant="title">월 선택</ThemedText>{availableMonths.map((item) => <PressableScale key={item} onPress={() => { setMonth(item); setMonthOpen(false); }} style={styles.monthRow}><ThemedText variant="body">{monthTitle(item)}</ThemedText><View style={styles.monthRight}>{sections.some((section) => monthKey(section.key) === item && section.photoCount > 0) ? <View style={[styles.calendarDot, { backgroundColor: colors.accent }]} /> : null}{month === item ? <Ionicons name="checkmark" size={20} color={colors.text} /> : null}</View></PressableScale>)}</View></Pressable></Modal>
  </View>;
}

const styles = StyleSheet.create({ root: { flex: 1 }, list: { paddingHorizontal: spacing.ml, paddingBottom: 124 }, header: { paddingTop: spacing.lg, paddingBottom: spacing.md, gap: spacing.md }, skeleton: { padding: spacing.ml, gap: spacing.xl }, monthSelector: { minHeight: 52, borderRadius: radius.md, paddingHorizontal: spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, chips: { flexDirection: 'row', gap: spacing.xs }, chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.full }, dayHeader: { marginTop: spacing.lg, marginBottom: spacing.sm, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, indicator: { width: 6, height: 6, borderRadius: radius.full }, row: { flexDirection: 'row', minHeight: 106 }, timeColumn: { width: 54, alignItems: 'flex-end', paddingRight: spacing.sm }, time: { paddingTop: spacing.md }, line: { width: 1, flex: 1, marginTop: spacing.xs }, dot: { width: 9, height: 9, borderRadius: radius.full, marginTop: spacing.lg, marginRight: spacing.sm }, rowCard: { flex: 1, borderRadius: radius.md, padding: spacing.sm, marginBottom: spacing.sm, flexDirection: 'row', gap: spacing.sm }, rowCopy: { flex: 1, gap: spacing.xs, justifyContent: 'center' }, placeLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs }, placeName: { flex: 1 }, badge: { borderRadius: radius.full, paddingHorizontal: spacing.xs, paddingVertical: 2 }, thumbs: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xs }, thumbnail: { width: 72, height: 72, borderRadius: radius.sm }, scrim: { flex: 1, justifyContent: 'flex-end' }, sheet: { paddingHorizontal: spacing.ml, paddingTop: spacing.sm, paddingBottom: spacing.xl, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, gap: spacing.sm }, grabber: { width: 38, height: 4, borderRadius: radius.full, alignSelf: 'center', marginBottom: spacing.sm }, monthRow: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, monthRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm }, calendarDot: { width: 6, height: 6, borderRadius: radius.full } });
