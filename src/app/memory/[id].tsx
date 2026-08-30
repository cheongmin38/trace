import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { MemoryImage } from '@/components/memory-image';
import { MemoryShareSheet } from '@/components/memory-share-card';
import { PhotoGrid } from '@/components/photo-grid';
import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { formatFullDate, formatVisitTime } from '@/services/mock-archive';
import { useAppStore } from '@/store/app-store';
import { radius, spacing, useTraceTheme } from '@/theme';

export default function MemoryDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTraceTheme();
  const memory = useAppStore((state) => state.memories.find((item) => item.id === id));
  const place = useAppStore((state) => state.places.find((item) => item.id === memory?.placeId));
  const toggleFavorite = useAppStore((state) => state.toggleFavorite);
  const [shareOpen, setShareOpen] = useState(false);

  if (!memory || !place) {
    return <View style={[styles.missing, { backgroundColor: colors.background }]}><ThemedText variant="title">추억을 찾을 수 없어요</ThemedText><PressableScale accessibilityRole="button" onPress={() => router.back()}><ThemedText variant="headline">돌아가기</ThemedText></PressableScale></View>;
  }

  return (
    <>
      <Stack.Screen options={{ title: '', headerTransparent: true, headerTintColor: '#FFFFFF', headerRight: () => <View style={styles.headerActions}><PressableScale accessibilityRole="button" accessibilityLabel="공유 카드 보기" hitSlop={10} onPress={() => setShareOpen(true)}><Ionicons name="share-outline" size={25} color="#FFFFFF" /></PressableScale><PressableScale accessibilityRole="button" accessibilityLabel={memory.isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'} hitSlop={10} onPress={() => toggleFavorite(memory.id)}><Ionicons name={memory.isFavorite ? 'heart' : 'heart-outline'} size={27} color="#FFFFFF" /></PressableScale></View> }} />
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={[styles.content, { backgroundColor: colors.background }]}>
        <View style={styles.heroWrap}>
          <MemoryImage uri={memory.photos[0]?.uri ?? place.coverPhoto ?? ''} accessibilityLabel={place.name} style={styles.hero} />
          <View pointerEvents="none" style={styles.topScrim} />
        </View>
        <View style={styles.body}>
          <PressableScale onPress={() => router.push({ pathname: '/place/[id]', params: { id: memory.placeId } })} accessibilityRole="button">
            <ThemedText variant="largeTitle">{place.name}</ThemedText>
          </PressableScale>
          <View style={[styles.visitBadge, { backgroundColor: colors.accentSoft }]}><ThemedText variant="caption">{memory.visitNumber}번째 방문</ThemedText></View>
          <ThemedText selectable variant="subhead">{place.address ?? '주소 정보 없음'}{'\n'}{formatFullDate(memory.startedAt)} · {formatVisitTime(memory.startedAt)}</ThemedText>
          {memory.summary ? <ThemedText variant="body" style={{ color: colors.secondaryText }}>{memory.summary}</ThemedText> : null}
          <PressableScale accessibilityRole="button" accessibilityLabel="공유 카드 미리보기 열기" onPress={() => setShareOpen(true)} style={[styles.shareAction, { backgroundColor: colors.surface }]}><Ionicons name="share-outline" size={18} color={colors.text} /><ThemedText variant="headline">공유 카드 만들기</ThemedText></PressableScale>
          <View style={styles.galleryHeader}><ThemedText variant="title">이날의 사진</ThemedText><ThemedText variant="caption">{memory.photos.length}장</ThemedText></View>
          <PhotoGrid photos={memory.photos} label={place.name} />
        </View>
      </ScrollView>
      <MemoryShareSheet visible={shareOpen} memory={memory} place={place} onClose={() => setShareOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: spacing.xl },
  heroWrap: { position: 'relative' },
  hero: { width: '100%', height: 510 },
  topScrim: { position: 'absolute', top: 0, left: 0, right: 0, height: 110, backgroundColor: 'rgba(0,0,0,0.16)' },
  body: { padding: spacing.ml, gap: spacing.md },
  visitBadge: { alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.sm, borderCurve: 'continuous' },
  galleryHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: spacing.md },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  shareAction: { minHeight: 50, borderRadius: radius.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.ml },
});
