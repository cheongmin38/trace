import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
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
  const [editOpen, setEditOpen] = useState(false);
  const [draftName, setDraftName] = useState(place?.name ?? '');
  const [isSavingName, setIsSavingName] = useState(false);
  const allVisits = useAppStore((state) => state.visits);
  const allMemories = useAppStore((state) => state.memories);
  const visits = useMemo(() => allVisits.filter((visit) => visit.placeId === id).sort((left, right) => new Date(right.startedAt).getTime() - new Date(left.startedAt).getTime()), [allVisits, id]);
  const memories = useMemo(() => allMemories.filter((memory) => memory.placeId === id), [allMemories, id]);
  const photos = useMemo(() => memories.flatMap((memory) => memory.photos), [memories]);
  const monthlyVisits = useMemo(() => {
    const counts = new Map<string, number>();
    visits.forEach((visit) => {
      const date = new Date(visit.startedAt);
      const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return [...counts.entries()].sort(([left], [right]) => left.localeCompare(right)).slice(-6);
  }, [visits]);

  if (!place) {
    return <View style={[styles.missing, { backgroundColor: colors.background }]}><ThemedText variant="title">장소를 찾을 수 없어요</ThemedText><PressableScale accessibilityRole="button" onPress={() => router.back()}><ThemedText variant="headline">돌아가기</ThemedText></PressableScale></View>;
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
      <Stack.Screen options={{ title: place.name, headerTransparent: true, headerTintColor: '#FFFFFF', headerRight: () => <PressableScale accessibilityRole="button" accessibilityLabel="장소 이름 수정" hitSlop={10} onPress={() => { setDraftName(place.name); setEditOpen(true); }}><Ionicons name="pencil" size={21} color="#FFFFFF" /></PressableScale> }} />
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={[styles.content, { backgroundColor: colors.background }]}>
        <View style={styles.hero}>
          <MemoryImage uri={place.coverPhoto ?? photos[0]?.uri ?? ''} accessibilityLabel={place.name} style={StyleSheet.absoluteFill} />
          <View style={styles.overlay}><ThemedText variant="largeTitle" style={styles.white}>{place.name}</ThemedText><ThemedText variant="headline" style={styles.white}>{visits.length}번 방문 · {photos.length}장 사진</ThemedText></View>
        </View>
        <View style={styles.body}>
          <View style={[styles.mapPreview, { backgroundColor: colors.map, boxShadow: shadow.soft }]}>
            <View style={[styles.locationIcon, { backgroundColor: colors.surface }]}><Ionicons name="location" size={21} color={colors.warm} /></View>
            <View style={styles.addressCopy}><ThemedText variant="caption">장소</ThemedText><ThemedText variant="body">{place.address}</ThemedText></View>
          </View>
          <View style={[styles.placeStats, { backgroundColor: colors.surface }]}><View style={styles.placeStat}><ThemedText variant="caption">첫 방문</ThemedText><ThemedText variant="headline">{place.firstVisitedAt ? formatFullDate(place.firstVisitedAt) : '기록 없음'}</ThemedText></View><View style={styles.placeStat}><ThemedText variant="caption">마지막 방문</ThemedText><ThemedText variant="headline">{place.lastVisitedAt ? formatFullDate(place.lastVisitedAt) : '기록 없음'}</ThemedText></View></View>
          {monthlyVisits.length ? <><ThemedText variant="title">월별 방문</ThemedText><View style={[styles.frequency, { backgroundColor: colors.surface }]}>{monthlyVisits.map(([key, count]) => <View key={key} style={styles.frequencyRow}><ThemedText variant="caption" style={styles.monthLabel}>{Number(key.split('-')[1])}월</ThemedText><View style={styles.dots}>{Array.from({ length: count }, (_, index) => <View key={index} style={[styles.frequencyDot, { backgroundColor: colors.accent }]} />)}</View><ThemedText variant="caption">{count}회</ThemedText></View>)}</View></> : null}
          <ThemedText variant="title">방문 기록</ThemedText>
          <View style={styles.visits}>
            {visits.map((visit, index) => <Pressable key={visit.id} onPress={() => router.push({ pathname: '/visit/[id]', params: { id: visit.id } })} style={styles.visit}><View style={[styles.dot, { backgroundColor: colors.accent }]} /><View><ThemedText variant="headline">{index === 0 ? '최근' : visit.visitNumber === 1 ? '처음' : `${visit.visitNumber}번째`}</ThemedText><ThemedText variant="subhead">{formatFullDate(visit.startedAt)}</ThemedText></View><Ionicons name="chevron-forward" size={18} color={colors.secondaryText} /></Pressable>)}
          </View>
          <View style={styles.galleryHeader}><ThemedText variant="title">이곳에서의 추억</ThemedText><ThemedText variant="caption">{photos.length}장</ThemedText></View>
          <PhotoGrid photos={photos} label={place.name} />
        </View>
      </ScrollView>
      <Modal visible={editOpen} transparent animationType="fade" onRequestClose={() => setEditOpen(false)}>
        <View style={[styles.modalScrim, { backgroundColor: colors.scrim }]}>
          <Pressable accessibilityLabel="장소 이름 수정 취소" style={StyleSheet.absoluteFill} onPress={() => setEditOpen(false)} />
          <View style={[styles.editor, { backgroundColor: colors.surface, boxShadow: shadow.raised }]}>
            <View style={styles.editorCopy}>
              <ThemedText variant="title">장소 이름 바꾸기</ThemedText>
              <ThemedText variant="subhead">직접 정한 이름은 자동 장소 인식이 덮어쓰지 않아요.</ThemedText>
            </View>
            <TextInput
              autoFocus
              accessibilityLabel="새 장소 이름"
              value={draftName}
              onChangeText={setDraftName}
              onSubmitEditing={() => void savePlaceName()}
              returnKeyType="done"
              maxLength={60}
              placeholder="장소 이름"
              placeholderTextColor={colors.tertiaryText}
              selectionColor={colors.accent}
              style={[styles.nameInput, { color: colors.text, backgroundColor: colors.surfaceMuted }]}
            />
            <View style={styles.editorActions}>
              <PressableScale accessibilityRole="button" onPress={() => setEditOpen(false)} style={[styles.editorButton, { backgroundColor: colors.surfaceMuted }]}><ThemedText variant="headline">취소</ThemedText></PressableScale>
              <PressableScale accessibilityRole="button" onPress={() => void savePlaceName()} style={[styles.editorButton, { backgroundColor: colors.accent }]}><ThemedText variant="headline" style={{ color: colors.onAccent }}>{isSavingName ? '저장 중' : '저장'}</ThemedText></PressableScale>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: spacing.xl },
  hero: { height: 350, justifyContent: 'flex-end' },
  overlay: { padding: spacing.ml, paddingTop: 110, backgroundColor: 'rgba(0,0,0,0.28)', gap: spacing.xxs },
  white: { color: '#FFFFFF' },
  body: { padding: spacing.ml, gap: spacing.ml },
  mapPreview: { minHeight: 100, borderRadius: radius.card, borderCurve: 'continuous', padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  locationIcon: { width: 44, height: 44, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  addressCopy: { flex: 1, gap: spacing.xxs },
  placeStats: { borderRadius: radius.card, padding: spacing.md, flexDirection: 'row', gap: spacing.md },
  placeStat: { flex: 1, gap: spacing.xxs },
  frequency: { borderRadius: radius.card, padding: spacing.md, gap: spacing.sm },
  frequencyRow: { minHeight: 28, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  monthLabel: { width: 30 },
  dots: { flex: 1, flexDirection: 'row', gap: spacing.xs },
  frequencyDot: { width: 9, height: 9, borderRadius: radius.full },
  visits: { gap: spacing.xs },
  visit: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 58 },
  dot: { width: 9, height: 9, borderRadius: radius.full },
  galleryHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: spacing.sm },
  modalScrim: { flex: 1, justifyContent: 'center', padding: spacing.ml },
  editor: { borderRadius: radius.card, padding: spacing.ml, gap: spacing.md },
  editorCopy: { gap: spacing.xs },
  nameInput: { minHeight: 54, borderRadius: radius.md, paddingHorizontal: spacing.md, fontSize: 17, fontWeight: '600' },
  editorActions: { flexDirection: 'row', gap: spacing.xs },
  editorButton: { flex: 1, minHeight: 50, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.ml },
});
