import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { spacing, useTraceTheme } from '@/theme';
export function EmptyState({ title, description }: { title: string; description: string }) { const { colors } = useTraceTheme(); return <View style={styles.root}><Ionicons name="images-outline" size={34} color={colors.tertiaryText} /><ThemedText variant="title">{title}</ThemedText><ThemedText variant="body" style={styles.copy}>{description}</ThemedText></View>; }
const styles = StyleSheet.create({ root: { alignItems: 'center', padding: spacing.xxl, gap: spacing.sm }, copy: { textAlign: 'center' } });
