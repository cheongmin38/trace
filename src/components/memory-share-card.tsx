import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { MemoryImage } from '@/components/memory-image';
import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { formatFullDate } from '@/services/mock-archive';
import { radius, shadow, spacing, useTraceTheme } from '@/theme';
import type { Memory, Place } from '@/types/trace';

export function MemoryShareCard({ memory, place }: { memory: Memory; place: Place }) {
  const { colors } = useTraceTheme();
  return <View style={[styles.card, { backgroundColor: colors.surface, boxShadow: shadow.raised }]}><View style={styles.brand}><ThemedText variant="title">Trace</ThemedText><ThemedText variant="caption">PRIVATE MEMORY</ThemedText></View><MemoryImage uri={memory.photos[0]?.uri ?? place.coverPhoto ?? ''} accessibilityLabel={`${place.name} 공유 카드`} style={styles.hero} /><View style={styles.copy}><ThemedText variant="title">{place.name}</ThemedText><ThemedText variant="headline">{memory.visitNumber}번째 방문</ThemedText><ThemedText variant="caption">{formatFullDate(memory.startedAt)}</ThemedText></View></View>;
}

export function MemoryShareSheet({ visible, memory, place, onClose }: { visible: boolean; memory: Memory; place: Place; onClose: () => void }) {
  const { colors } = useTraceTheme();
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}><View style={[styles.scrim, { backgroundColor: colors.scrim }]}><Pressable accessibilityLabel="공유 카드 닫기" style={StyleSheet.absoluteFill} onPress={onClose} /><View style={styles.preview}><ThemedText variant="title" style={{ color: '#FFFFFF' }}>공유 카드 미리보기</ThemedText><MemoryShareCard memory={memory} place={place} /><PressableScale accessibilityRole="button" onPress={onClose} style={[styles.done, { backgroundColor: colors.surface }]}><ThemedText variant="headline">완료</ThemedText></PressableScale></View></View></Modal>;
}

const styles = StyleSheet.create({
  scrim: { flex: 1, justifyContent: 'center', padding: spacing.ml },
  preview: { gap: spacing.md },
  card: { borderRadius: radius.lg, borderCurve: 'continuous', padding: spacing.md, gap: spacing.md },
  brand: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  hero: { width: '100%', aspectRatio: 1.1, borderRadius: radius.card, borderCurve: 'continuous' },
  copy: { gap: spacing.xs },
  done: { minHeight: 52, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
});
