import { StyleSheet, View } from 'react-native';
import { CountUpText } from '@/components/count-up-text';
import { ThemedText } from '@/components/themed-text';
import { radius, spacing, useTraceTheme } from '@/theme';

export function StatCard({ value, label }: { value: number; label: string }) {
  const { colors } = useTraceTheme();
  return (
    <View style={[styles.root, { backgroundColor: colors.surfaceMuted }]}>
      <CountUpText value={value} style={styles.number} />
      <ThemedText variant="caption">{label}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, minHeight: 112, padding: spacing.md, justifyContent: 'flex-end', gap: spacing.xxs, borderRadius: radius.md, borderCurve: 'continuous' },
  number: { fontSize: 25, lineHeight: 30, fontVariant: ['tabular-nums'] },
});
