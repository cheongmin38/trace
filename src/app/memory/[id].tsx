import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { EmptyState } from '@/components/empty-state';
import { MemoryImage } from '@/components/memory-image';
import { MemoryShareSheet } from '@/components/memory-share-card';
import { PhotoGrid } from '@/components/photo-grid';
import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { formatFullDate, formatVisitTime } from '@/services/mock-archive';
import { useAppStore } from '@/store/app-store';
import { radius, shadow, spacing, useTraceTheme } from '@/theme';

export default function MemoryDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTraceTheme();
  const memory = useAppStore((state) => state.memories.find((item) => item.id === id));
  const place = useAppStore((state) => state.places.find((item) => item.id === memory?.placeId));
  const toggleFavorite = useAppStore((state) => state.toggleFavorite);
  const [shareOpen, setShareOpen] = useState(false);

  if (!memory || !place) {
    return <View style={[styles.missing, { backgroundColor: colors.background }]}><EmptyState title="기억을 찾을 수 없어요" description="삭제되었거나 아직 동기화되지 않은 기록이에요." /><PressableScale onPress={() => router.back()}><ThemedText variant="headline">돌아가기</ThemedText></PressableScale></View>;
  }

  return (
    <>
      <Stack.Screen options={{
        title: '',
        headerTransparent: true,
        headerTintColor: '#FFFFFF',
        headerRight: () => (
          <View style={styles.headerActions}>
            <PressableScale accessibilityLabel="기억 공유" hitSlop={10} onPress={() => setShareOpen(true)}><Ionicons name="share-outline" size={24} color="#FFFFFF" /></PressableScale>
            <PressableScale accessibilityLabel={memory.isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'} hitSlop={10} onPress={() => toggleFavorite(memory.id)}><Ionicons name={memory.isFavorite ? 'heart' : 'heart-outline'} size={26} color="#FFFFFF" /></PressableScale>
          </View>
        ),
      }} />
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={[styles.content, { backgroundColor: colors.background }]}>
        <View style={styles.heroWrap}>
          <MemoryImage uri={memory.photos[0]?.uri ?? place.coverPhoto ?? ''} accessibilityLabel={place.name} style={styles.hero} />
          <View pointerEvents="none" style={styles.topScrim} />
        </View>

        <View style={[styles.sheet, { backgroundColor: colors.background }]}>
          <PressableScale onPress={() => router.push({ pathname: '/place/[id]', params: { id: memory.placeId } })}>
            <ThemedText variant="largeTitle">{place.name}</ThemedText>
          </PressableScale>
          <View style={styles.metaRow}>
            <View style={[styles.visitBadge, { backgroundColor: colors.lavender }]}><ThemedText variant="caption" style={{ color: colors.traceLavender }}>{memory.visitNumber}번째 방문</ThemedText></View>
            <ThemedText variant="caption" style={{ color: colors.secondaryText }}>{memory.photos.length}장의 사진</ThemedText>
          </View>
          <View style={styles.infoRows}>
            <InfoRow icon="location-outline" text={place.address ?? '주소 정보 없음'} />
            <InfoRow icon="calendar-outline" text={`${formatFullDate(memory.startedAt)} · ${formatVisitTime(memory.startedAt)}`} />
          </View>

          {memory.summary ? (
            <View style={[styles.memo, { backgroundColor: colors.surface }]}>
              <ThemedText variant="caption" style={{ color: colors.secondaryText }}>메모</ThemedText>
              <ThemedText variant="body">{memory.summary}</ThemedText>
            </View>
          ) : null}

          <View style={styles.galleryHeader}><ThemedText variant="title">그날의 사진</ThemedText><ThemedText variant="caption" style={{ color: colors.secondaryText }}>전체 {memory.photos.length}장</ThemedText></View>
          <PhotoGrid photos={memory.photos} label={place.name} />

          <View style={styles.bottomActions}>
            <ActionButton icon="share-outline" label="공유" onPress={() => setShareOpen(true)} />
            <ActionButton icon="map-outline" label="지도에서 보기" onPress={() => router.push({ pathname: '/map', params: { placeId: place.id } })} />
            <ActionButton icon="ellipsis-horizontal" label="추가 작업" onPress={() => router.push({ pathname: '/visit/[id]', params: { id: memory.visitId } })} />
          </View>
        </View>
      </ScrollView>
      <MemoryShareSheet visible={shareOpen} memory={memory} place={place} onClose={() => setShareOpen(false)} />
    </>
  );
}

function InfoRow({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  const { colors } = useTraceTheme();
  return <View style={styles.infoRow}><Ionicons name={icon} size={17} color={colors.secondaryText} /><ThemedText selectable variant="subhead" style={{ color: colors.secondaryText }}>{text}</ThemedText></View>;
}

function ActionButton({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  const { colors } = useTraceTheme();
  return <PressableScale onPress={onPress} style={[styles.actionButton, { backgroundColor: colors.surface, boxShadow: shadow.soft }]}><Ionicons name={icon} size={19} color={colors.text} /><ThemedText variant="caption">{label}</ThemedText></PressableScale>;
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: spacing.xl },
  heroWrap: { position: 'relative' },
  hero: { width: '100%', height: 510 },
  topScrim: { position: 'absolute', top: 0, left: 0, right: 0, height: 120, backgroundColor: 'rgba(0,0,0,0.18)' },
  sheet: { borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, borderCurve: 'continuous', padding: spacing.ml, gap: spacing.md, marginTop: -28 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  visitBadge: { paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radius.full },
  infoRows: { gap: spacing.xs },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  memo: { borderRadius: radius.card, borderCurve: 'continuous', padding: spacing.md, gap: spacing.xs },
  galleryHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: spacing.sm },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  bottomActions: { flexDirection: 'row', gap: spacing.xs, paddingTop: spacing.md },
  actionButton: { flex: 1, minHeight: 62, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', gap: 4 },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.ml },
});
