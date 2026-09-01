import { useEffect, useState } from 'react';
import type { ComponentProps } from 'react';
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

  useEffect(() => {
    let active = true;
    const dayVisits = visits.filter((visit) => visit.startedAt.slice(0, 10) === date);
    void generateDailySummary({
      sourceDate: date,
      visits: dayVisits,
      places,
      photoCount: memories.filter((memory) => memory.startedAt.slice(0, 10) === date).reduce((total, memory) => total + memory.photos.length, 0),
    }).then((result) => { if (active) setText(result.summary); });
    return () => { active = false; };
  }, [date, memories, places, visits]);

  return <View style={[styles.card, { backgroundColor: colors.surfaceGlass, borderColor: colors.border, boxShadow: shadow.soft }, style]}>
    <View style={[styles.accent, { backgroundColor: colors.traceLavender }]} />
    <ThemedText variant="caption" style={{ color: colors.traceLavender }}>오늘의 Trace</ThemedText>
    {text ? <ThemedText variant="body">{text}</ThemedText> : <ActivityIndicator color={colors.traceLavender} />}
  </View>;
}

const styles = StyleSheet.create({
  card: { padding: spacing.md, borderRadius: radius.card, borderWidth: StyleSheet.hairlineWidth, gap: spacing.xs, overflow: 'hidden', position: 'relative' },
  accent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },
});
