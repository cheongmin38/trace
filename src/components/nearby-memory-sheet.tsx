import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, ReduceMotion, SlideInDown } from 'react-native-reanimated';
import { MemoryImage } from '@/components/memory-image';
import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { radius, shadow, spacing, useTraceTheme } from '@/theme';
import type { NearbyMemory } from '@/types/trace';

function distanceLabel(distanceMeters: number) { return distanceMeters < 1_000 ? `${Math.round(distanceMeters)}m` : `${(distanceMeters / 1_000).toFixed(1)}km`; }

export function NearbyMemorySheet({ visible, items, onClose }: { visible: boolean; items: NearbyMemory[]; onClose: () => void }) {
  const router = useRouter();
  const { colors } = useTraceTheme();
  const openPlace = (placeId: string) => { onClose(); router.push({ pathname: '/place/[id]', params: { id: placeId } }); };
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View entering={FadeIn.duration(150).reduceMotion(ReduceMotion.System)} style={[styles.scrim, { backgroundColor: colors.scrim }]}>
        <Pressable accessibilityLabel="주변 추억 닫기" style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View entering={SlideInDown.springify().damping(22).stiffness(220).reduceMotion(ReduceMotion.System)} style={[styles.sheet, { backgroundColor: colors.surface, boxShadow: shadow.raised }]}>
          <View style={[styles.grabber, { backgroundColor: colors.border }]} />
          <View style={styles.header}><View style={styles.headerCopy}><View style={styles.eyebrow}><Ionicons name="sparkles" size={15} color={colors.warm} /><ThemedText variant="caption" style={{ color: colors.warm }}>주변에서 발견</ThemedText></View><ThemedText variant="title">지금 여기 근처에{`\n`}당신의 추억 {items.length}개가 있어요.</ThemedText></View><PressableScale accessibilityRole="button" accessibilityLabel="주변 추억 닫기 버튼" onPress={onClose} style={styles.close}><Ionicons name="close" size={20} color={colors.secondaryText} /></PressableScale></View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
            {items.length ? items.map(({ place, latestMemory, distanceMeters }) => <PressableScale key={place.id} accessibilityRole="button" accessibilityLabel={`${place.name} 장소 보기`} onPress={() => openPlace(place.id)} style={[styles.row, { backgroundColor: colors.surfaceMuted }]}><MemoryImage uri={latestMemory.photos[0]?.uri ?? place.coverPhoto ?? ''} accessibilityLabel={place.name} style={styles.photo} /><View style={styles.rowCopy}><ThemedText variant="headline" numberOfLines={1}>{place.name}</ThemedText><ThemedText variant="caption">{place.visitCount}회 방문 · 사진 {place.photoCount}장 · {distanceLabel(distanceMeters)}</ThemedText></View><Ionicons name="chevron-forward" size={17} color={colors.tertiaryText} /></PressableScale>) : <View style={styles.empty}><ThemedText variant="headline">근처에 연결된 추억이 없어요</ThemedText><ThemedText variant="subhead">조금 이동한 뒤 다시 발견해보세요.</ThemedText></View>}
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, justifyContent: 'flex-end' },
  sheet: { maxHeight: '72%', paddingHorizontal: spacing.ml, paddingTop: spacing.sm, paddingBottom: spacing.xl, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, gap: spacing.md },
  grabber: { width: 38, height: 4, borderRadius: radius.full, alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  headerCopy: { flex: 1, gap: spacing.xs },
  eyebrow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs },
  close: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  list: { gap: spacing.xs, paddingBottom: spacing.sm },
  row: { minHeight: 78, borderRadius: radius.md, padding: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  photo: { width: 56, height: 56, borderRadius: radius.sm },
  rowCopy: { flex: 1, gap: spacing.xxs },
  empty: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.xs },
});
