import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { useEffect, useState } from 'react';
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
    <View pointerEvents="none" style={[styles.glow, { backgroundColor: colors.accentSoft }]} />
    <View style={styles.titleLine}>
      <View style={[styles.icon, { backgroundColor: colors.accentSoft }]}><Ionicons name="sparkles" size={14} color={colors.accent} /></View>
      <ThemedText variant="headline">AI Daily Summary</ThemedText>
    </View>
    {text ? <ThemedText variant="subhead" style={{ color: colors.secondaryText }}>{text}</ThemedText> : <ActivityIndicator color={colors.accent} />}
    <ThemedText variant="caption" style={{ color: colors.tertiaryText }}>오늘의 기록을 바탕으로 정리했어요</ThemedText>
  </View>;
}

const styles = StyleSheet.create({
  card: { padding: spacing.md, borderRadius: radius.card, borderWidth: StyleSheet.hairlineWidth, gap: spacing.xs, overflow: 'hidden', position: 'relative' },
  glow: { position: 'absolute', width: 118, height: 118, borderRadius: radius.full, right: -44, bottom: -64, opacity: 0.72 },
  titleLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  icon: { width: 28, height: 28, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
});
