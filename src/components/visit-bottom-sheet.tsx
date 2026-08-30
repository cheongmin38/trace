import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown, ReduceMotion } from 'react-native-reanimated';
import { MemoryImage } from '@/components/memory-image';
import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { formatFullDate, formatVisitTime } from '@/services/mock-archive';
import { radius, shadow, spacing, useTraceTheme } from '@/theme';
import type { Place, Visit } from '@/types/trace';

export function VisitBottomSheet({ visit, place, onClose }: { visit: Visit; place: Place; onClose: () => void }) {
  const router = useRouter();
  const { colors } = useTraceTheme();
  return <Animated.View entering={FadeInDown.springify().damping(22).stiffness(220).reduceMotion(ReduceMotion.System)} exiting={FadeOutDown.duration(160).reduceMotion(ReduceMotion.System)} style={[styles.root, { backgroundColor: colors.surface, boxShadow: shadow.raised }]}><View style={[styles.grabber, { backgroundColor: colors.border }]} /><View style={styles.top}><MemoryImage uri={place.coverPhoto ?? ''} accessibilityLabel={place.name} style={styles.photo} /><View style={styles.copy}><View style={styles.titleRow}><ThemedText variant="headline" numberOfLines={2} style={styles.title}>{place.name}</ThemedText><PressableScale onPress={onClose} accessibilityRole="button" accessibilityLabel="방문 미리보기 닫기" hitSlop={10} style={styles.close}><Ionicons name="close" size={19} color={colors.secondaryText} /></PressableScale></View><View style={[styles.badge, { backgroundColor: colors.accentSoft }]}><Ionicons name="location" size={12} color={colors.text} /><ThemedText variant="caption">자동 기록 · {visit.visitNumber}번째 방문</ThemedText></View><ThemedText variant="subhead" numberOfLines={1}>{place.address}</ThemedText><ThemedText variant="caption">{formatFullDate(visit.startedAt)} · {formatVisitTime(visit.startedAt)} · {visit.durationMinutes ?? 0}분</ThemedText></View></View><PressableScale onPress={() => router.push({ pathname: '/place/[id]', params: { id: place.id } })} style={[styles.cta, { backgroundColor: colors.accent }]} accessibilityRole="button"><ThemedText variant="headline" style={{ color: colors.onAccent }}>장소 기록 보기</ThemedText><Ionicons name="arrow-forward" size={17} color={colors.onAccent} /></PressableScale></Animated.View>;
}

const styles = StyleSheet.create({ root: { position: 'absolute', left: spacing.sm, right: spacing.sm, bottom: spacing.sm, padding: spacing.ml, borderRadius: radius.card, borderCurve: 'continuous', gap: spacing.sm }, grabber: { width: 36, height: 4, borderRadius: radius.full, alignSelf: 'center', marginBottom: spacing.xxs }, top: { flexDirection: 'row', gap: spacing.md }, photo: { width: 104, height: 122, borderRadius: radius.md, borderCurve: 'continuous' }, copy: { flex: 1, minWidth: 0, gap: spacing.xxs }, titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xxs }, title: { flex: 1, fontSize: 19, lineHeight: 24 }, close: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }, badge: { alignSelf: 'flex-start', borderRadius: radius.sm, paddingHorizontal: spacing.xs, paddingVertical: spacing.xxs, flexDirection: 'row', alignItems: 'center', gap: 3 }, cta: { minHeight: 50, borderRadius: radius.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs } });
