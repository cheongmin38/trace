import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { EmptyState } from '@/components/empty-state';
import { MemoryImage } from '@/components/memory-image';
import { PhotoGrid } from '@/components/photo-grid';
import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { formatFullDate } from '@/services/mock-archive';
import { renamePlace } from '@/services/place-editor-service';
import { useAppStore } from '@/store/app-store';
import { radius, shadow, spacing, useTraceTheme } from '@/theme';

export default function PlaceDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTraceTheme();
  const place = useAppStore((state) => state.places.find((item) => item.id === id));
  const allVisits = useAppStore((state) => state.visits);
  const allMemories = useAppStore((state) => state.memories);
  const [editOpen, setEditOpen] = useState(false);
  const [draftName, setDraftName] = useState(place?.name ?? '');
  const [isSavingName, setIsSavingName] = useState(false);

  const visits = useMemo(() => allVisits
    .filter((visit) => visit.placeId === id)
    .sort((left, right) => new Date(right.startedAt).getTime() - new Date(left.startedAt).getTime()), [allVisits, id]);
  const memories = useMemo(() => allMemories
    .filter((memory) => memory.placeId === id)
    .sort((left, right) => new Date(right.startedAt).getTime() - new Date(left.startedAt).getTime()), [allMemories, id]);
  const photos = useMemo(() => memories.flatMap((memory) => memory.photos)
    .filter((photo, index, items) => items.findIndex((candidate) => candidate.id === photo.id) === index), [memories]);
  const totalStayMinutes = useMemo(() => visits.reduce((total, visit) => total + (visit.durationMinutes ?? 0), 0), [visits]);

  if (!place) {
    return <View style={[styles.missing, { backgroundColor: colors.background }]}><EmptyState title="장소를 찾을 수 없어요" description="삭제되었거나 아직 동기화되지 않은 장소예요." /><PressableScale onPress={() => router.back()}><ThemedText variant="headline">돌아가기</ThemedText></PressableScale></View>;
  }

  const savePlaceName = async () => {
    const normalizedName = draftName.trim();
    if (!normalizedName || isSavingName) return;
    setIsSavingName(true);
    try {
      await renamePlace(place.id, normalizedName);
      setEditOpen(false);
    } catch (error) {
      console.error('Place name could not be updated', error);
      Alert.alert('이름을 바꾸지 못했어요', '잠시 후 다시 시도해주세요.');
    } finally {
      setIsSavingName(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{
        title: '',
        headerTransparent: true,
        headerTintColor: '#FFFFFF',
        headerRight: () => (
          <PressableScale
            accessibilityLabel="장소 이름 수정"
            hitSlop={10}
            onPress={() => { setDraftName(place.name); setEditOpen(true); }}
          >
            <Ionicons name="create-outline" size={23} color="#FFFFFF" />
          </PressableScale>
        ),
      }} />
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={[styles.content, { backgroundColor: colors.background }]}>
        <View style={styles.hero}>
          <MemoryImage uri={place.coverPhoto ?? photos[0]?.uri ?? ''} accessibilityLabel={place.name} style={StyleSheet.absoluteFill} />
          <View style={styles.heroScrim} />
          <View style={styles.heroCopy}>
            <View style={styles.categoryBadge}><ThemedText variant="caption" style={styles.white}>{categoryLabel(place.category)}</ThemedText></View>
            <ThemedText variant="largeTitle" style={styles.white}>{place.name}</ThemedText>
            <View style={styles.addressRow}><Ionicons name="location-outline" size={16} color="#FFFFFF" /><ThemedText variant="subhead" style={styles.white}>{place.address ?? '주소 정보 없음'}</ThemedText></View>
          </View>
        </View>

        <View style={styles.body}>
          <View style={[styles.stats, { backgroundColor: colors.surface, boxShadow: shadow.soft }]}>
            <PlaceStat value={`${visits.length}회`} label="방문 횟수" />
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <PlaceStat value={formatDuration(totalStayMinutes)} label="함께한 시간" />
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <PlaceStat value={visits[0] ? relativeDate(visits[0].startedAt) : '-'} label="최근 방문" />
          </View>

          <PressableScale onPress={() => router.push({ pathname: '/map', params: { placeId: place.id } })} style={[styles.mapPreview, { backgroundColor: colors.map }]}>
            <View style={[styles.mapPin, { backgroundColor: colors.traceInk }]}><Ionicons name="location" size={20} color={colors.aiAccent} /></View>
            <View style={styles.mapCopy}><ThemedText variant="headline">지도에서 보기</ThemedText><ThemedText variant="caption" style={{ color: colors.secondaryText }}>이 장소의 위치와 주변 기억을 살펴보세요.</ThemedText></View>
            <Ionicons name="chevron-forward" size={18} color={colors.secondaryText} />
          </PressableScale>

          {memories.length ? (
            <View style={styles.section}>
              <View style={styles.sectionHeader}><ThemedText variant="title">최고의 기억</ThemedText><ThemedText variant="caption" style={{ color: colors.secondaryText }}>{memories.length}개의 기억</ThemedText></View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.memoryStrip}>
                {memories.slice(0, 5).map((memory) => (
                  <PressableScale key={memory.id} onPress={() => router.push({ pathname: '/memory/[id]', params: { id: memory.id } })} style={styles.memoryCard}>
                    <MemoryImage uri={memory.photos[0]?.uri ?? place.coverPhoto ?? ''} accessibilityLabel={place.name} style={styles.memoryPhoto} />
                    <ThemedText variant="caption" numberOfLines={1}>{formatFullDate(memory.startedAt)}</ThemedText>
                  </PressableScale>
                ))}
              </ScrollView>
            </View>
          ) : null}

          <View style={styles.section}>
            <View style={styles.sectionHeader}><ThemedText variant="title">방문 기록</ThemedText><ThemedText variant="caption" style={{ color: colors.secondaryText }}>최근 순</ThemedText></View>
            <View style={[styles.visitGroup, { backgroundColor: colors.surface }]}>
              {visits.length ? visits.map((visit, index) => (
                <PressableScale
                  key={visit.id}
                  onPress={() => router.push({ pathname: '/visit/[id]', params: { id: visit.id } })}
                  style={[styles.visitRow, index < visits.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}
                >
                  <View style={[styles.timelineDot, { backgroundColor: index === 0 ? colors.traceLavender : colors.border }]} />
                  <View style={styles.visitCopy}><ThemedText variant="headline">{index === 0 ? '최근 방문' : `${visit.visitNumber}번째 방문`}</ThemedText><ThemedText variant="caption" style={{ color: colors.secondaryText }}>{formatFullDate(visit.startedAt)} · {formatDuration(visit.durationMinutes ?? 0)}</ThemedText></View>
                  <Ionicons name="chevron-forward" size={17} color={colors.tertiaryText} />
                </PressableScale>
              )) : <ThemedText variant="body" style={{ color: colors.secondaryText, padding: spacing.md }}>아직 방문 기록이 없어요.</ThemedText>}
            </View>
          </View>

          {photos.length ? <View style={styles.section}><View style={styles.sectionHeader}><ThemedText variant="title">이곳에서의 사진</ThemedText><ThemedText variant="caption" style={{ color: colors.secondaryText }}>전체 {photos.length}장</ThemedText></View><PhotoGrid photos={photos} label={place.name} /></View> : null}
        </View>
      </ScrollView>

      <Modal visible={editOpen} transparent animationType="fade" onRequestClose={() => setEditOpen(false)}>
        <View style={[styles.modalScrim, { backgroundColor: colors.scrim }]}>
          <Pressable accessibilityLabel="장소 이름 수정 취소" style={StyleSheet.absoluteFill} onPress={() => setEditOpen(false)} />
          <View style={[styles.editor, { backgroundColor: colors.surface, boxShadow: shadow.raised }]}>
            <View style={styles.editorCopy}><ThemedText variant="title">장소 이름 바꾸기</ThemedText><ThemedText variant="subhead" style={{ color: colors.secondaryText }}>직접 정한 이름은 자동 장소 인식이 덮어쓰지 않아요.</ThemedText></View>
            <TextInput autoFocus value={draftName} onChangeText={setDraftName} onSubmitEditing={() => void savePlaceName()} returnKeyType="done" maxLength={60} placeholder="장소 이름" placeholderTextColor={colors.tertiaryText} selectionColor={colors.traceLavender} style={[styles.nameInput, { color: colors.text, backgroundColor: colors.surfaceMuted }]} />
            <View style={styles.editorActions}>
              <PressableScale onPress={() => setEditOpen(false)} style={[styles.editorButton, { backgroundColor: colors.surfaceMuted }]}><ThemedText variant="headline">취소</ThemedText></PressableScale>
              <PressableScale onPress={() => void savePlaceName()} style={[styles.editorButton, { backgroundColor: colors.text }]}><ThemedText variant="headline" style={{ color: colors.onAccent }}>{isSavingName ? '저장 중' : '저장'}</ThemedText></PressableScale>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

function PlaceStat({ value, label }: { value: string; label: string }) {
  const { colors } = useTraceTheme();
  return <View style={styles.stat}><ThemedText variant="headline" style={styles.tabular}>{value}</ThemedText><ThemedText variant="caption" style={{ color: colors.secondaryText }}>{label}</ThemedText></View>;
}

function formatDuration(minutes: number) {
  if (!minutes) return '-';
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours ? `${hours}시간 ${rest ? `${rest}분` : ''}`.trim() : `${rest}분`;
}

function relativeDate(value: string) {
  const days = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000));
  if (days === 0) return '오늘';
  if (days === 1) return '어제';
  if (days < 30) return `${days}일 전`;
  return new Date(value).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

function categoryLabel(category: string) {
  const labels: Record<string, string> = { HOME: '집', WORK: '직장', CAFE: '카페', FOOD: '음식점', PARK: '공원', SHOPPING: '쇼핑', TRAVEL: '여행', CULTURE: '문화', SCHOOL: '학교', HOTEL: '숙소', TRANSIT: '교통' };
  return labels[category] ?? '장소';
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: spacing.xl },
  hero: { height: 420, justifyContent: 'flex-end', position: 'relative' },
  heroScrim: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(4,7,12,0.32)' },
  heroCopy: { padding: spacing.ml, gap: spacing.xs },
  categoryBadge: { alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radius.full, backgroundColor: 'rgba(12,16,24,0.68)' },
  white: { color: '#FFFFFF' },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  body: { padding: spacing.ml, gap: spacing.lg },
  stats: { minHeight: 96, borderRadius: radius.card, borderCurve: 'continuous', flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.sm },
  stat: { flex: 1, alignItems: 'center', gap: 4 },
  statDivider: { width: StyleSheet.hairlineWidth, height: 42 },
  tabular: { fontVariant: ['tabular-nums'], textAlign: 'center' },
  mapPreview: { minHeight: 88, borderRadius: radius.card, borderCurve: 'continuous', padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  mapPin: { width: 44, height: 44, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  mapCopy: { flex: 1, gap: 2 },
  section: { gap: spacing.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  memoryStrip: { gap: spacing.sm, paddingRight: spacing.ml },
  memoryCard: { width: 150, gap: spacing.xs },
  memoryPhoto: { width: 150, height: 108, borderRadius: radius.md },
  visitGroup: { borderRadius: radius.card, borderCurve: 'continuous', paddingHorizontal: spacing.md, overflow: 'hidden' },
  visitRow: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  timelineDot: { width: 9, height: 9, borderRadius: radius.full },
  visitCopy: { flex: 1, gap: 2 },
  modalScrim: { flex: 1, justifyContent: 'center', padding: spacing.ml },
  editor: { borderRadius: radius.card, borderCurve: 'continuous', padding: spacing.ml, gap: spacing.md },
  editorCopy: { gap: spacing.xs },
  nameInput: { minHeight: 54, borderRadius: radius.md, paddingHorizontal: spacing.md, fontSize: 17, fontWeight: '600' },
  editorActions: { flexDirection: 'row', gap: spacing.xs },
  editorButton: { flex: 1, minHeight: 50, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.ml },
});
