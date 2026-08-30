import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { useAuthStore } from '@/store/auth-store';
import { radius, shadow, spacing, useTraceTheme } from '@/theme';

export default function WelcomeScreen() {
  const router = useRouter();
  const { colors } = useTraceTheme();
  const markWelcomeSeen = useAuthStore((state) => state.markWelcomeSeen);
  const continueToAuth = async () => { await markWelcomeSeen(); router.replace('/auth'); };
  return <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={[styles.content, { backgroundColor: colors.background }]}><View style={styles.hero}><View style={[styles.mark, { backgroundColor: colors.accent }]}><Ionicons name="map" size={28} color={colors.onAccent} /></View><ThemedText variant="screenTitle">Trace</ThemedText><ThemedText variant="largeTitle">{'기록하지 않아도\n남는 순간들'}</ThemedText><ThemedText variant="body" style={{ color: colors.secondaryText }}>방문한 장소와 그때의 사진을 연결해 당신만의 프라이빗 아카이브를 만들어요.</ThemedText></View><PressableScale accessibilityRole="button" onPress={() => void continueToAuth()} style={[styles.cta, { backgroundColor: colors.accent, boxShadow: shadow.cta }]}><ThemedText variant="headline" style={{ color: colors.onAccent }}>시작하기</ThemedText><Ionicons name="arrow-forward" size={17} color={colors.onAccent} /></PressableScale></ScrollView>;
}
const styles = StyleSheet.create({ content: { flexGrow: 1, justifyContent: 'space-between', padding: spacing.ml, paddingTop: 96, paddingBottom: spacing.xxl, gap: spacing.xxl }, hero: { gap: spacing.md }, mark: { width: 60, height: 60, borderRadius: radius.card, borderCurve: 'continuous', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm }, cta: { minHeight: 56, borderRadius: 18, borderCurve: 'continuous', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs } });
