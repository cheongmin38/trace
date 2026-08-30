import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { spacing } from '@/theme';

export function AppHeader({ title, subtitle, actions }: { title: string; subtitle: string; actions?: ReactNode }) {
  return <View style={styles.root}><View style={styles.copy}><ThemedText variant="largeTitle">{title}</ThemedText><ThemedText variant="subhead">{subtitle}</ThemedText></View>{actions ? <View style={styles.actions}>{actions}</View> : null}</View>;
}
const styles = StyleSheet.create({ root: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, minHeight: 68 }, copy: { flex: 1, gap: spacing.xxs }, actions: { flexDirection: 'row', gap: spacing.xxs } });
