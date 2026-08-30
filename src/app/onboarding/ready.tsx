import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { useAuthStore } from '@/store/auth-store';
import { radius, shadow, spacing, useTraceTheme } from '@/theme';

export default function ReadyScreen() {
  const router = useRouter();
  const { colors } = useTraceTheme();
  const completeOnboarding = useAuthStore((state) => state.completeOnboarding);
  const finish = async () => { await completeOnboarding(); router.replace('/(tabs)/home'); };
  return <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={[styles.content, { backgroundColor: colors.background }]}><View style={styles.hero}><View style={[styles.mark, { backgroundColor: colors.lavender }]}><Ionicons name="sparkles" size={30} color={colors.warm} /></View><ThemedText variant="screenTitle">준비가 끝났어요</ThemedText><ThemedText variant="body" style={{ color: colors.secondaryText }}>이제 Trace가 당신의 이동을 방해하지 않고, 기억할 만한 순간만 조용히 모아드릴게요.</ThemedText></View><PressableScale accessibilityRole="button" onPress={() => void finish()} style={[styles.cta, { backgroundColor: colors.accent, boxShadow: shadow.cta }]}><ThemedText variant="headline" style={{ color: colors.onAccent }}>Trace 시작하기</ThemedText><Ionicons name="arrow-forward" size={17} color={colors.onAccent} /></PressableScale></ScrollView>;
}
const styles = StyleSheet.create({ content: { flexGrow: 1, justifyContent: 'space-between', padding: spacing.ml, paddingTop: 120, paddingBottom: spacing.xxl, gap: spacing.xxl }, hero: { gap: spacing.md }, mark: { width: 64, height: 64, borderRadius: radius.card, borderCurve: 'continuous', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm }, cta: { minHeight: 56, borderRadius: 18, borderCurve: 'continuous', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs } });
