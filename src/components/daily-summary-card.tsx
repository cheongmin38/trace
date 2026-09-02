import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { generateDailySummary } from '@/services/daily-summary-service';
import { useAppStore } from '@/store/app-store';
import { radius, shadow, spacing, useTraceTheme } from '@/theme';

export function DailySummaryCard({ date = new Date().toISOString().slice(0, 10), style }: { date?: string; style?: ComponentProps<typeof View>['style'] }) {
  const { colors } = useTraceTheme();
  const visits = useAppStore((state) => state.visits);
  const places = useAppStore((state) => state.places);
  const memories = useAppStore((state) => state.memories);
  const [text, setText] = useState('');
  const dayVisits = useMemo(() => visits.filter((visit) => visit.startedAt.slice(0, 10) === date), [date, visits]);
  const dayPhotos = useMemo(() => new Set(memories.filter((memory) => memory.startedAt.slice(0, 10) === date).flatMap((memory) => memory.photos.map((photo) => photo.id))).size, [date, memories]);

  useEffect(() => {
    let active = true;
    if (dayVisits.length === 0) {
      return () => { active = false; };
    }
    void generateDailySummary({ sourceDate: date, visits: dayVisits, places, photoCount: dayPhotos }).then((result) => {
      if (active) setText(result.summary);
    }).catch((error) => {
      console.error('[Trace] Daily summary failed', error);
    });
    return () => { active = false; };
  }, [date, dayPhotos, dayVisits, places]);

  const empty = dayVisits.length === 0;
  return <View style={[styles.card, { backgroundColor: colors.surfaceGlass, borderColor: colors.border, boxShadow: shadow.soft }, style]}>
    <View pointerEvents="none" style={[styles.glow, { backgroundColor: colors.accentSoft }]} />
    <View style={styles.titleLine}>
      <View style={[styles.icon, { backgroundColor: colors.accentSoft }]}><Ionicons name="sparkles" size={14} color={colors.accent} /></View>
      <ThemedText variant="headline">AI Daily Summary</ThemedText>
    </View>
    {empty ? <>
      <ThemedText variant="subhead">오늘의 Trace가 아직 비어 있어요.</ThemedText>
      <ThemedText variant="caption" style={{ color: colors.secondaryText }}>하루를 보내면 방문과 사진을 자동으로 정리해드릴게요.</ThemedText>
    </> : text ? <ThemedText variant="subhead" style={{ color: colors.secondaryText }}>{text}</ThemedText> : <ActivityIndicator color={colors.accent} />}
    <ThemedText variant="caption" style={{ color: colors.tertiaryText }}>{empty ? '방문 기록이 생기면 요약을 만들어 드려요.' : '오늘의 기록을 바탕으로 정리했어요.'}</ThemedText>
  </View>;
}

const styles = StyleSheet.create({
  card: { padding: spacing.md, borderRadius: radius.card, borderWidth: StyleSheet.hairlineWidth, gap: spacing.xs, overflow: 'hidden', position: 'relative' },
  glow: { position: 'absolute', width: 118, height: 118, borderRadius: radius.full, right: -44, bottom: -64, opacity: 0.72 },
  titleLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  icon: { width: 28, height: 28, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
});
