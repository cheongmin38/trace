import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { BrandLogo } from '@/components/brand-logo';
import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { radius, shadow, spacing, useTraceTheme } from '@/theme';

export default function PermissionIntro() {
  const router = useRouter();
  const { colors } = useTraceTheme();
  return <ScrollView contentContainerStyle={[styles.content, { backgroundColor: colors.background }]}><View style={styles.hero}><BrandLogo size={92} /><ThemedText variant="screenTitle">자동으로 남는 나의 하루</ThemedText><ThemedText variant="body" style={{ color: colors.secondaryText }}>Trace가 장소와 사진을 연결해 조용히 기억을 만들어드려요.</ThemedText><View style={[styles.equation, { backgroundColor: colors.surfaceMuted }]}><ThemedText variant="headline">위치</ThemedText><ThemedText variant="title">＋</ThemedText><ThemedText variant="headline">시간</ThemedText><ThemedText variant="title">＋</ThemedText><ThemedText variant="headline">사진</ThemedText><ThemedText variant="title">＝</ThemedText><ThemedText variant="headline">Memory</ThemedText></View></View><PressableScale onPress={() => router.push('/onboarding/location')} style={[styles.cta, { backgroundColor: colors.accent, boxShadow: shadow.cta }]}><ThemedText variant="headline" style={{ color: colors.onAccent }}>시작하기</ThemedText></PressableScale></ScrollView>;
}
const styles = StyleSheet.create({ content: { flexGrow: 1, justifyContent: 'space-between', padding: spacing.ml, paddingTop: 96, paddingBottom: spacing.xxl, gap: spacing.xxl }, hero: { gap: spacing.md }, equation: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, borderRadius: radius.md }, cta: { minHeight: 56, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' } });
