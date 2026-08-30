import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';
import { MemoryImage } from '@/components/memory-image';
import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { formatFullDate } from '@/services/mock-archive';
import { radius, shadow, spacing, useTraceTheme } from '@/theme';
import type { Memory, Place } from '@/types/trace';

export function DiscoveryCard({ eyebrow, message, place, memory, actionLabel, onPress }: { eyebrow: string; message: string; place: Place; memory: Memory | null; actionLabel: string; onPress: () => void }) {
  const { colors } = useTraceTheme();
  const photoUri = memory?.photos[0]?.uri ?? place.coverPhoto ?? '';
  return (
    <PressableScale accessibilityRole="button" accessibilityLabel={`${eyebrow} ${actionLabel}`} onPress={onPress} style={[styles.root, { backgroundColor: colors.surface, boxShadow: shadow.soft }]}>
      <View style={styles.copy}>
        <View style={styles.eyebrow}><Ionicons name="sparkles" size={14} color={colors.warm} /><ThemedText variant="caption" style={{ color: colors.warm }}>{eyebrow}</ThemedText></View>
        <ThemedText variant="headline" numberOfLines={1}>{place.name}</ThemedText>
        <ThemedText variant="subhead" numberOfLines={3}>{message}</ThemedText>
        {memory ? <ThemedText variant="caption">{formatFullDate(memory.startedAt)} · {memory.visitNumber}번째 방문 · 사진 {memory.photos.length}장</ThemedText> : <ThemedText variant="caption">새로운 장소</ThemedText>}
        <View style={styles.action}><ThemedText variant="headline">{actionLabel}</ThemedText><Ionicons name="arrow-forward" size={15} color={colors.text} /></View>
      </View>
      <MemoryImage uri={photoUri} accessibilityLabel={place.name} style={styles.photo} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  root: { minHeight: 172, borderRadius: radius.card, borderCurve: 'continuous', padding: spacing.md, flexDirection: 'row', gap: spacing.md, overflow: 'hidden' },
  copy: { flex: 1, gap: spacing.xs, minWidth: 0 },
  eyebrow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs },
  action: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 'auto' },
  photo: { width: 116, alignSelf: 'stretch', minHeight: 140, borderRadius: radius.md, borderCurve: 'continuous' },
});
