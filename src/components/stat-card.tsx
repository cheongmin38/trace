import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import { CountUpText } from '@/components/count-up-text';
import { ThemedText } from '@/components/themed-text';
import { radius, shadow, spacing, useTraceTheme } from '@/theme';

type StatIcon = ComponentProps<typeof Ionicons>['name'];

export function StatCard({ value, label, icon }: { value: number; label: string; icon?: StatIcon }) {
  const { colors } = useTraceTheme();
  return (
    <View style={[styles.root, { backgroundColor: colors.surfaceGlass, borderColor: colors.border, boxShadow: shadow.soft }]}> 
      <View style={styles.topLine}>{icon ? <View style={[styles.iconBubble, { backgroundColor: colors.accentSoft }]}><Ionicons name={icon} size={14} color={colors.accent} /></View> : <View />}</View>
      <View style={styles.copy}><ThemedText variant="caption" numberOfLines={1} style={{ color: colors.secondaryText }}>{label}</ThemedText><CountUpText value={value} style={[styles.number, { color: colors.text }]} /></View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, minHeight: 88, padding: spacing.sm, justifyContent: 'space-between', gap: spacing.xxs, borderRadius: radius.card, borderCurve: 'continuous', borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  topLine: { minHeight: 28, flexDirection: 'row', justifyContent: 'space-between' },
  iconBubble: { width: 28, height: 28, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  copy: { gap: 1 },
  number: { fontSize: 21, lineHeight: 25, fontVariant: ['tabular-nums'], letterSpacing: -0.45 },
});
