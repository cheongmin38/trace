import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { radius, spacing, useTraceTheme } from '@/theme';
export function SkeletonCard() { const { colors } = useTraceTheme(); return <Animated.View style={styles.root}><View style={[styles.image, { backgroundColor: colors.surfaceMuted }]} /><View style={[styles.line, { backgroundColor: colors.surfaceMuted }]} /><View style={[styles.shortLine, { backgroundColor: colors.surfaceMuted }]} /></Animated.View>; }
const styles = StyleSheet.create({ root: { gap: spacing.sm }, image: { width: '100%', aspectRatio: 1.4, borderRadius: radius.card }, line: { width: '68%', height: 18, borderRadius: radius.sm }, shortLine: { width: '40%', height: 14, borderRadius: radius.sm } });
