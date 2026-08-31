import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { radius, spacing, useTraceTheme } from '@/theme';

export function AppHeader({ title, subtitle, actions }: { title: string; subtitle: string; actions?: ReactNode }) {
  const { colors } = useTraceTheme();
  return <View style={styles.root}><View style={styles.copy}><View style={styles.titleRow}><View style={[styles.mark, { backgroundColor: colors.traceLavender }]} /><ThemedText variant="largeTitle">{title}</ThemedText></View><ThemedText variant="subhead" numberOfLines={1}>{subtitle}</ThemedText></View>{actions ? <View style={[styles.actions, { backgroundColor: colors.surface, borderColor: colors.border }]}>{actions}</View> : null}</View>;
}
const styles = StyleSheet.create({ root: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, minHeight: 78 }, copy: { flex: 1, gap: spacing.xxs }, titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs }, mark: { width: 6, height: 22, borderRadius: radius.full }, actions: { flexDirection: 'row', gap: 0, borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.full, paddingHorizontal: 2 } });
