import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { radius, shadow, spacing, useTraceTheme } from '@/theme';

export function PremiumCard() {
  const router = useRouter();
  const { colors } = useTraceTheme();
  return (
    <PressableScale
      onPress={() => router.push('/premium')}
      accessibilityRole="button"
      accessibilityLabel="Trace Premium 자세히 보기"
      style={[styles.root, { backgroundColor: colors.lavender, boxShadow: shadow.soft }]}
    >
      <View style={[styles.glow, { backgroundColor: colors.ivory }]} />
      <View style={styles.copy}>
        <ThemedText variant="headline">Trace Premium</ThemedText>
        <ThemedText variant="body">{'당신의 모든 순간을\n안전하게 간직하세요.'}</ThemedText>
        <ThemedText variant="caption">자동 백업 · 고화질 보관 · 무제한 추억</ThemedText>
        <View style={styles.more}>
          <ThemedText variant="headline" style={styles.moreText}>자세히 보기</ThemedText>
          <Ionicons name="arrow-forward" size={16} color={colors.text} />
        </View>
      </View>
      <Ionicons name="sparkles" size={31} color={colors.warm} style={styles.sparkles} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  root: { minHeight: 188, padding: spacing.lg, borderRadius: radius.card, borderCurve: 'continuous', flexDirection: 'row', alignItems: 'center', overflow: 'hidden' },
  glow: { position: 'absolute', width: 180, height: 180, borderRadius: radius.full, right: -68, top: -70, opacity: 0.76 },
  copy: { flex: 1, gap: spacing.xs, zIndex: 1 },
  more: { flexDirection: 'row', gap: spacing.xs, alignItems: 'center', paddingTop: spacing.xs },
  moreText: { fontSize: 15, lineHeight: 20 },
  sparkles: { alignSelf: 'flex-start', opacity: 0.72, zIndex: 1 },
});
