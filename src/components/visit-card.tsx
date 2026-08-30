import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { MemoryImage } from '@/components/memory-image';
import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { formatVisitDate, formatVisitTime } from '@/services/mock-archive';
import { useAppStore } from '@/store/app-store';
import { radius, spacing, useTraceTheme } from '@/theme';
import type { Visit } from '@/types/trace';

export const VisitCard = memo(function VisitCard({ visit }: { visit: Visit }) {
  const router = useRouter();
  const { colors } = useTraceTheme();
  const place = useAppStore((state) => state.places.find((item) => item.id === visit.placeId));
  if (!place) return null;
  const timeRange = visit.endedAt
    ? `${formatVisitTime(visit.startedAt)} — ${formatVisitTime(visit.endedAt)}`
    : `${formatVisitTime(visit.startedAt)}부터 기록 중`;
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`${place.name} 방문 기록 보기`}
      onPress={() => router.push({ pathname: '/visit/[id]', params: { id: visit.id } })}
      style={styles.root}
    >
      <View style={styles.dateRow}>
        <ThemedText variant="caption" style={{ color: colors.secondaryText }}>{formatVisitDate(visit.startedAt)}</ThemedText>
        <View style={[styles.source, { backgroundColor: colors.accentSoft }]}><Ionicons name="location" size={12} color={colors.text} /><ThemedText variant="caption">자동 기록</ThemedText></View>
      </View>
      <MemoryImage uri={place.coverPhoto ?? ''} accessibilityLabel={place.name} style={[styles.hero, { backgroundColor: colors.surfaceMuted }]} />
      <View style={styles.copy}>
        <View style={styles.titleRow}><ThemedText variant="title" numberOfLines={1} style={styles.title}>{place.name}</ThemedText><ThemedText variant="caption">{visit.visitNumber}번째 방문</ThemedText></View>
        <ThemedText variant="subhead" numberOfLines={1}>{place.address}</ThemedText>
        <View style={styles.time}><Ionicons name="time-outline" size={15} color={colors.secondaryText} /><ThemedText variant="subhead">{timeRange} · {visit.durationMinutes ?? 0}분</ThemedText></View>
      </View>
    </PressableScale>
  );
});

const styles = StyleSheet.create({
  root: { gap: spacing.sm, paddingBottom: spacing.xxxl },
  dateRow: { paddingTop: spacing.xs, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  source: { borderRadius: radius.full, paddingHorizontal: spacing.xs, paddingVertical: spacing.xxs, flexDirection: 'row', alignItems: 'center', gap: 3 },
  hero: { width: '100%', aspectRatio: 1.55, borderRadius: radius.card, borderCurve: 'continuous' },
  copy: { gap: spacing.xs, paddingTop: spacing.xxs },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { flex: 1 },
  time: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});
