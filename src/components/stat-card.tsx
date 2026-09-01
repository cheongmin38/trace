import { StyleSheet, View } from 'react-native';
import { CountUpText } from '@/components/count-up-text';
import { ThemedText } from '@/components/themed-text';
import { radius, shadow, spacing, useTraceTheme } from '@/theme';

export function StatCard({ value, label }: { value: number; label: string }) {
  const { colors } = useTraceTheme();
  return (
    <View style={[styles.root, { backgroundColor: colors.surfaceGlass, borderColor: colors.border, boxShadow: shadow.soft }]}> 
      <CountUpText value={value} style={[styles.number, { color: colors.text }]} />
      <ThemedText variant="caption" numberOfLines={1}>{label}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, minHeight: 94, padding: spacing.md, justifyContent: 'space-between', gap: spacing.xxs, borderRadius: radius.card, borderCurve: 'continuous', borderWidth: StyleSheet.hairlineWidth },
  number: { fontSize: 27, lineHeight: 32, fontVariant: ['tabular-nums'], letterSpacing: -0.6 },
});
