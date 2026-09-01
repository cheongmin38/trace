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
      {icon ? <View style={[styles.iconBubble, { backgroundColor: colors.accentSoft }]}><Ionicons name={icon} size={14} color={colors.accent} /></View> : null}
      <CountUpText value={value} style={[styles.number, { color: colors.text }]} />
      <ThemedText variant="caption" numberOfLines={1}>{label}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, minHeight: 94, padding: spacing.md, justifyContent: 'space-between', gap: spacing.xxs, borderRadius: radius.card, borderCurve: 'continuous', borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', position: 'relative' },
  iconBubble: { position: 'absolute', right: spacing.sm, top: spacing.sm, width: 28, height: 28, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  number: { fontSize: 27, lineHeight: 32, fontVariant: ['tabular-nums'], letterSpacing: -0.6 },
});
