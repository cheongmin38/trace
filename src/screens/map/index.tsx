import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { AppHeader } from '@/components/app-header';
import { IconButton } from '@/components/icon-button';
import { MemoryBottomSheet } from '@/components/memory-bottom-sheet';
import { MemoryImage } from '@/components/memory-image';
import { PressableScale } from '@/components/pressable-scale';
import { SearchBar } from '@/components/search-bar';
import { ThemedText } from '@/components/themed-text';
import { CrossPlatformMap } from '@/components/map/cross-platform-map';
import { VisitBottomSheet } from '@/components/visit-bottom-sheet';
import { startLocationTracking } from '@/services/location-service';
import { useAppStore } from '@/store/app-store';
import { radius, shadow, spacing, useTraceTheme } from '@/theme';
import type { MapVisitPin } from '@/types/location';
import type { RoutePoint } from '@/types/location';
import { getRoutePoints, simplifyRoute } from '@/services/route-recording-service';
import { summarizeExploration } from '@/services/exploration-service';
import { getLatestMemoryForPlace } from '@/utils/trace-selectors';

export function MapScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const { colors } = useTraceTheme();
  const places = useAppStore((state) => state.places);
  const memories = useAppStore((state) => state.memories);
  const visits = useAppStore((state) => state.visits);
  const selectedMemoryId = useAppStore((state) => state.selectedMemoryId);
  const selectedPlaceId = useAppStore((state) => state.selectedPlaceId);
  const selectMemoryId = useAppStore((state) => state.selectMemory);
  const selectPlace = useAppStore((state) => state.selectPlace);
  const currentLocation = useAppStore((state) => state.currentLocation);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(true);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'frequent' | 'travel'>('all');
  const [fitKey, setFitKey] = useState(0);
  const [mapMode, setMapMode] = useState<'memory' | 'exploration'>('memory');
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
  useEffect(() => { let active = true; void getRoutePoints().then((points) => { if (active) setRoutePoints(simplifyRoute(points)); }).catch((error) => console.error('Trace route could not be loaded', error)); return () => { active = false; }; }, []);
  const mapPins = useMemo<MapVisitPin[]>(() => places
    .filter((place) => place.visitCount > 0)
    .map((place) => {
      const memory = getLatestMemoryForPlace(memories, place.id);
      const latestVisit = visits.filter((visit) => visit.placeId === place.id).sort((left, right) => new Date(right.startedAt).getTime() - new Date(left.startedAt).getTime())[0];
      return {
        id: `pin-${place.id}`,
        placeId: place.id,
        title: place.name,
        latitude: place.location.latitude,
        longitude: place.location.longitude,
        imageUri: memory?.photos[0]?.uri ?? place.coverPhoto ?? '',
        visitCount: place.visitCount,
        lastVisitedAt: latestVisit?.startedAt ?? place.lastVisitedAt,
        memoryId: memory?.id,
      };
    })
    .sort((left, right) => new Date(right.lastVisitedAt ?? 0).getTime() - new Date(left.lastVisitedAt ?? 0).getTime()), [memories, places, visits]);
  const visiblePins = mapPins.filter((pin) => {
    const matchesQuery = !query.trim() || `${pin.title}`.toLocaleLowerCase('ko-KR').includes(query.trim().toLocaleLowerCase('ko-KR'));
    const place = places.find((item) => item.id === pin.placeId);
    const matchesFilter = filter === 'all' || filter === 'frequent' && (place?.visitCount ?? 0) >= 2 || filter === 'travel' && (place?.resolvedCategory === 'travel' || place?.category === 'TRAVEL');
    return matchesQuery && matchesFilter;
  }).slice(0, showAll ? mapPins.length : 6);
  const selected = memories.find((memory) => memory.id === selectedMemoryId) ?? null;
  const selectedPlace = places.find((place) => place.id === (selected?.placeId ?? selectedPlaceId)) ?? null;
  const selectedVisit = selectedPlace ? visits.filter((visit) => visit.placeId === selectedPlace.id).sort((left, right) => new Date(right.startedAt).getTime() - new Date(left.startedAt).getTime())[0] ?? null : null;
  const recentCardWidth = Math.max(158, Math.min(214, (Math.min(width, 480) - spacing.ml * 2 - spacing.sm) / 2));
  const explorationSummary = useMemo(() => summarizeExploration(places, visits, routePoints), [places, visits, routePoints]);

  const selectPin = (pin: MapVisitPin) => {
    selectMemoryId(null);
    selectPlace(pin.placeId);
    if (pin.memoryId) selectMemoryId(pin.memoryId);
  };

  const locate = async () => {
    try {
      await startLocationTracking();
      setLocationError(null);
      setFitKey((value) => value + 1);
    } catch (error) {
      console.error('Unable to update current location', error);
      setLocationError('현재 위치를 확인하지 못했어요. 서울 지도로 계속 둘러볼 수 있어요.');
    }
  };

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={[styles.content, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <AppHeader
          title="지도"
          subtitle="어디에서 시간을 보냈는지 살펴보세요"
          actions={<IconButton name="person-circle-outline" label="프로필로 이동" onPress={() => router.push('/profile')} />}
        />
      </View>

      {searching ? <SearchBar value={query} onChangeText={setQuery} onClose={() => { setSearching(false); setQuery(''); }} /> : <PressableScale onPress={() => setSearching(true)} style={[styles.searchButton,{backgroundColor:colors.surfaceMuted}]}><Ionicons name="search" size={18} color={colors.secondaryText}/><ThemedText variant="subhead" style={{color:colors.tertiaryText}}>장소 또는 추억 검색</ThemedText></PressableScale>}
      <View style={[styles.modeSwitch, { backgroundColor: colors.surfaceMuted }]}>
        {([['memory', '기억'], ['exploration', '탐험']] as const).map(([key, label]) => <PressableScale key={key} onPress={() => setMapMode(key)} style={[styles.modeItem, mapMode === key && { backgroundColor: colors.surface }]}><ThemedText variant="caption" style={{ color: mapMode === key ? colors.text : colors.secondaryText }}>{label}</ThemedText></PressableScale>)}
      </View>
      <View style={styles.filters}>{[['all','전체'],['frequent','자주 간 곳'],['travel','여행']].map(([key,label])=><PressableScale key={key} onPress={()=>setFilter(key as typeof filter)} style={[styles.filter,{backgroundColor:filter===key?colors.text:colors.surfaceMuted}]}><ThemedText variant="caption" style={{color:filter===key?colors.onAccent:colors.secondaryText}}>{label}</ThemedText></PressableScale>)}</View>


      <View style={[styles.mapCard, { backgroundColor: colors.surface, boxShadow: shadow.card, height: Math.max(420, Math.min(680, height * 0.64)) }]}>
        <CrossPlatformMap pins={visiblePins} selectedId={selectedPlaceId ?? undefined} onSelect={selectPin} fitKey={fitKey} currentLocation={currentLocation} routePoints={routePoints} exploration={mapMode === 'exploration'} />
        <View style={styles.mapControls}>
          <IconButton name="locate" label="현재 위치" onPress={() => void locate()} filled />
          <IconButton name="expand-outline" label="모든 추억 보기" onPress={() => { setShowAll(true); setFitKey((value) => value + 1); }} filled />
          <IconButton name="layers-outline" label="지도 표시 범위 전환" onPress={() => setShowAll((value) => !value)} filled />
        </View>
        {selected && selectedPlace ? <MemoryBottomSheet memory={selected} place={selectedPlace} onClose={() => { selectMemoryId(null); selectPlace(null); }} /> : selectedVisit && selectedPlace ? <VisitBottomSheet visit={selectedVisit} place={selectedPlace} onClose={() => selectPlace(null)} /> : null}
      </View>

      {mapMode === 'exploration' ? <View style={[styles.explorationCard, { backgroundColor: colors.surface, boxShadow: shadow.soft }]}><View style={styles.explorationHeader}><View><ThemedText variant="title">나의 탐험</ThemedText><ThemedText variant="subhead">기록된 발자취로 채워진 지도</ThemedText></View><Ionicons name="compass-outline" size={27} color={colors.accent} /></View><View style={styles.explorationStats}><View><ThemedText variant="headline">{explorationSummary.visitedRegions}</ThemedText><ThemedText variant="caption">방문 지역</ThemedText></View><View><ThemedText variant="headline">{explorationSummary.visitedPlaces}</ThemedText><ThemedText variant="caption">기록 장소</ThemedText></View><View><ThemedText variant="headline">{Math.round(explorationSummary.routeDistanceMeters / 1000)} km</ThemedText><ThemedText variant="caption">이동 거리</ThemedText></View></View>{explorationSummary.newRegions.length ? <ThemedText variant="caption" style={{ color: colors.accent }}>올해 새롭게 발견한 지역 {explorationSummary.newRegions.length}곳</ThemedText> : null}</View> : null}

      {locationError ? <ThemedText selectable variant="caption" style={[styles.locationError, { color: colors.warm }]}>{locationError}</ThemedText> : null}

      <View style={styles.sectionHeader}>
        <View style={styles.sectionCopy}>
          <ThemedText variant="title">최근 추억</ThemedText>
          <ThemedText variant="subhead">다시 보고 싶은 가까운 순간들</ThemedText>
        </View>
        <PressableScale onPress={() => router.push('/timeline')} hitSlop={8} accessibilityRole="button">
          <ThemedText variant="caption" style={{ color: colors.text }}>모두 보기</ThemedText>
        </PressableScale>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recentRow}>
        {memories.slice(0, 6).map((memory) => (
          (() => {
            const place = places.find((item) => item.id === memory.placeId);
            const placeName = place?.name ?? memory.title;
            return (
          <PressableScale
            key={memory.id}
            onPress={() => router.push({ pathname: '/memory/[id]', params: { id: memory.id } })}
            accessibilityRole="button"
            accessibilityLabel={`${placeName} 추억 보기`}
            style={[styles.recentCard, { width: recentCardWidth, backgroundColor: colors.surface, boxShadow: shadow.soft }]}
          >
            <MemoryImage uri={memory.photos[0]?.uri ?? place?.coverPhoto ?? ''} accessibilityLabel={placeName} style={styles.recentPhoto} />
            <View style={styles.recentCopy}>
              <ThemedText numberOfLines={1} variant="headline" style={styles.recentTitle}>{placeName}</ThemedText>
              <ThemedText numberOfLines={1} variant="caption">{memory.visitNumber}번째 방문 · 사진 {memory.photos.length}장</ThemedText>
            </View>
          </PressableScale>
            );
          })()
        ))}
      </ScrollView>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: 124, gap: spacing.lg },
  header: { paddingHorizontal: spacing.ml, paddingTop: spacing.lg },
  discovery: { paddingHorizontal: spacing.ml },
  mapCard: { marginHorizontal: spacing.ml, borderRadius: radius.lg, borderCurve: 'continuous', overflow: 'hidden', position: 'relative' },
  mapControls: { position: 'absolute', top: spacing.sm, right: spacing.sm, gap: spacing.xs },
  locationError: { paddingHorizontal: spacing.ml, marginTop: -spacing.sm },
  sectionHeader: { paddingHorizontal: spacing.ml, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: spacing.md },
  sectionCopy: { flex: 1, gap: spacing.xxs },
  recentRow: { paddingHorizontal: spacing.ml, gap: spacing.sm },
  recentCard: { borderRadius: radius.card, borderCurve: 'continuous', overflow: 'hidden' },
  recentPhoto: { width: '100%', aspectRatio: 1 },
  recentCopy: { paddingHorizontal: spacing.sm, paddingVertical: spacing.sm, gap: spacing.xxs },
  recentTitle: { fontSize: 16, lineHeight: 21 },
  searchButton: { marginHorizontal: spacing.ml, minHeight: 48, borderRadius: radius.md, paddingHorizontal: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  filters: { paddingHorizontal: spacing.ml, flexDirection: 'row', gap: spacing.xs },
  filter: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.full },
  modeSwitch: { marginHorizontal: spacing.ml, padding: 4, borderRadius: radius.md, flexDirection: 'row', alignSelf: 'flex-start', gap: 2 },
  modeItem: { paddingHorizontal: spacing.lg, paddingVertical: spacing.xs, borderRadius: radius.sm },
  explorationCard: { marginHorizontal: spacing.ml, padding: spacing.ml, borderRadius: radius.card, gap: spacing.md },
  explorationHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  explorationStats: { flexDirection: 'row', justifyContent: 'space-between' },
});
