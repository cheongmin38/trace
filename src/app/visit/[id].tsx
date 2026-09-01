import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { deleteVisitWithRelations, updateVisitDetails } from '@/services/visit-editor-service';
import { useAppStore } from '@/store/app-store';
import { radius, shadow, spacing, useTraceTheme } from '@/theme';

export default function VisitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTraceTheme();
  const visit = useAppStore((state) => state.visits.find((item) => item.id === id));
  const places = useAppStore((state) => state.places);
  const memory = useAppStore((state) => state.memories.find((item) => item.visitId === id));
  const [placeId, setPlaceId] = useState(visit?.placeId ?? '');
  const [start, setStart] = useState(visit?.startedAt?.slice(0, 16).replace('T', ' ') ?? '');
  const [end, setEnd] = useState(visit?.endedAt?.slice(0, 16).replace('T', ' ') ?? '');
  const [placeOpen, setPlaceOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!visit) return <View style={[styles.center, { backgroundColor: colors.background }]}><ThemedText variant="title">방문 기록을 찾을 수 없어요.</ThemedText></View>;
  const place = places.find((item) => item.id === placeId) ?? places.find((item) => item.id === visit.placeId);

  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await updateVisitDetails(id, { placeId, startedAt: start.replace(' ', 'T'), endedAt: end.replace(' ', 'T') });
      Alert.alert('저장했어요', '변경한 기록이 Timeline과 지도에 바로 반영됐어요.');
    } catch (error) {
      console.error('Visit update failed', error);
      Alert.alert('저장하지 못했어요', error instanceof Error ? error.message : '잠시 후 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    try {
      await deleteVisitWithRelations(id);
      router.back();
    } catch (error) {
      console.error('Visit deletion failed', error);
      Alert.alert('삭제하지 못했어요', '잠시 후 다시 시도해주세요.');
    }
  };

  return <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={[styles.content, { backgroundColor: colors.background }]}>
    <Stack.Screen options={{ title: '방문 편집' }} />
    <View style={styles.heading}><ThemedText variant="largeTitle">방문 편집</ThemedText><ThemedText variant="subhead" style={{ color: colors.secondaryText }}>자동 기록은 간단하게 바로잡을 수 있어요.</ThemedText></View>

    <View style={[styles.placeCard, { backgroundColor: colors.surfaceGlass, borderColor: colors.border, boxShadow: shadow.card }]}>
      <View style={[styles.placeIcon, { backgroundColor: colors.accentSoft }]}><Ionicons name="location" size={20} color={colors.accent} /></View>
      <View style={styles.placeCopy}><ThemedText variant="headline">{place?.name ?? '장소 없음'}</ThemedText><ThemedText variant="caption" style={{ color: colors.secondaryText }}>{place?.address ?? '장소를 선택해주세요.'}</ThemedText></View>
      <PressableScale accessibilityLabel="장소 변경" onPress={() => setPlaceOpen(true)} style={[styles.changeButton, { backgroundColor: colors.surfaceMuted }]}><ThemedText variant="caption">변경</ThemedText></PressableScale>
    </View>

    <View style={[styles.editorCard, { backgroundColor: colors.surfaceGlass, borderColor: colors.border, boxShadow: shadow.soft }]}>
      <Field icon="calendar-outline" label="시작 시간" value={start} onChangeText={setStart} placeholder="2026-08-24 15:30" />
      <View style={[styles.divider, { backgroundColor: colors.border }]} />
      <Field icon="time-outline" label="종료 시간" value={end} onChangeText={setEnd} placeholder="2026-08-24 17:00" />
    </View>

    {memory ? <PressableScale onPress={() => router.push({ pathname: '/memory/[id]', params: { id: memory.id } })} style={[styles.memoryLink, { backgroundColor: colors.lavender, borderColor: colors.accentSoft }]}><Ionicons name="images-outline" size={20} color={colors.accent} /><View style={{ flex: 1 }}><ThemedText variant="headline">연결된 사진 {memory.photos.length}장</ThemedText><ThemedText variant="caption" style={{ color: colors.secondaryText }}>사진을 제거하거나 대표 사진을 바꿀 수 있어요.</ThemedText></View><Ionicons name="chevron-forward" size={18} color={colors.accent} /></PressableScale> : null}

    <PressableScale disabled={saving} onPress={() => void save()} style={[styles.save, { backgroundColor: colors.accent, boxShadow: shadow.cta, opacity: saving ? 0.6 : 1 }]}><ThemedText variant="headline" style={{ color: colors.onAccent }}>{saving ? '저장 중…' : '변경사항 저장'}</ThemedText></PressableScale>
    <PressableScale onPress={() => Alert.alert('방문 기록을 삭제할까요?', '연결된 Memory도 휴지통으로 이동합니다.', [{ text: '취소', style: 'cancel' }, { text: '삭제', style: 'destructive', onPress: () => void remove() }])} style={styles.delete}><ThemedText variant="headline" style={{ color: colors.warm }}>방문 기록 삭제</ThemedText></PressableScale>

    <Modal visible={placeOpen} transparent animationType="slide" onRequestClose={() => setPlaceOpen(false)}>
      <View style={[styles.overlay, { backgroundColor: colors.scrim }]}><Pressable style={StyleSheet.absoluteFill} onPress={() => setPlaceOpen(false)} /><View style={[styles.sheet, { backgroundColor: colors.surface, boxShadow: shadow.raised }]}><View style={[styles.grabber, { backgroundColor: colors.border }]} /><ThemedText variant="title">장소 변경</ThemedText><ScrollView showsVerticalScrollIndicator={false}>{places.map((item) => <PressableScale key={item.id} onPress={() => { setPlaceId(item.id); setPlaceOpen(false); }} style={[styles.placeOption, item.id === placeId && { backgroundColor: colors.accentSoft }]}><View style={[styles.optionIcon, { backgroundColor: colors.surfaceMuted }]}><Ionicons name="location-outline" size={18} color={colors.accent} /></View><View style={{ flex: 1 }}><ThemedText variant="headline">{item.name}</ThemedText><ThemedText variant="caption" style={{ color: colors.secondaryText }}>{item.address ?? ''}</ThemedText></View>{item.id === placeId ? <Ionicons name="checkmark-circle" size={20} color={colors.accent} /> : null}</PressableScale>)}</ScrollView></View></View>
    </Modal>
  </ScrollView>;
}

function Field({ icon, label, value, onChangeText, placeholder }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; onChangeText: (value: string) => void; placeholder: string }) {
  const { colors } = useTraceTheme();
  return <View style={styles.field}><View style={[styles.fieldIcon, { backgroundColor: colors.surfaceMuted }]}><Ionicons name={icon} size={18} color={colors.accent} /></View><View style={styles.fieldCopy}><ThemedText variant="caption" style={{ color: colors.secondaryText }}>{label}</ThemedText><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.tertiaryText} selectionColor={colors.accent} style={[styles.input, { color: colors.text }]} /></View></View>;
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, padding: spacing.ml, paddingBottom: 48, gap: spacing.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.ml },
  heading: { gap: spacing.xxs, paddingBottom: spacing.sm },
  placeCard: { minHeight: 88, borderRadius: radius.card, borderWidth: StyleSheet.hairlineWidth, padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  placeIcon: { width: 42, height: 42, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  placeCopy: { flex: 1, gap: 3 },
  changeButton: { minWidth: 56, minHeight: 36, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  editorCard: { borderRadius: radius.card, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: spacing.md },
  field: { minHeight: 78, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  fieldIcon: { width: 36, height: 36, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  fieldCopy: { flex: 1, gap: 1 },
  input: { minHeight: 30, padding: 0, fontSize: 16, fontWeight: '600' },
  divider: { height: StyleSheet.hairlineWidth },
  memoryLink: { minHeight: 78, borderRadius: radius.card, borderWidth: StyleSheet.hairlineWidth, padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  save: { minHeight: 54, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginTop: spacing.sm },
  delete: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: { maxHeight: '72%', borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.ml, gap: spacing.md },
  grabber: { width: 38, height: 4, borderRadius: radius.full, alignSelf: 'center' },
  placeOption: { minHeight: 66, padding: spacing.sm, borderRadius: radius.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  optionIcon: { width: 36, height: 36, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
});
