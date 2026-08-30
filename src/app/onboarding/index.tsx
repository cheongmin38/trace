import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { BrandLogo } from '@/components/brand-logo';
import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { useAuthStore } from '@/store/auth-store';
import { radius, shadow, spacing, useTraceTheme } from '@/theme';

export default function WelcomeScreen() {
  const router = useRouter();
  const { colors } = useTraceTheme();
  const markWelcomeSeen = useAuthStore((state) => state.markWelcomeSeen);
  const continueToAuth = async () => { await markWelcomeSeen(); router.replace('/auth'); };
  return <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={[styles.content, { backgroundColor: colors.background }]}>
    <View style={styles.top}><View style={styles.brandRow}><BrandLogo size={58} /><ThemedText variant="title">Trace</ThemedText></View><ThemedText variant="caption" style={{ color: colors.tertiaryText }}>PRIVATE MEMORY ARCHIVE</ThemedText></View>
    <View style={styles.visual}><View style={[styles.backCard, { backgroundColor: colors.warmSoft, transform: [{ rotate: '-7deg' }] }]}><Ionicons name="time-outline" size={25} color={colors.warm} /><ThemedText variant="caption">시간</ThemedText></View><View style={[styles.backCard, { backgroundColor: colors.lavender, transform: [{ rotate: '7deg' }] }]}><Ionicons name="location-outline" size={25} color={colors.success} /><ThemedText variant="caption">장소</ThemedText></View><View style={[styles.centerCard, { backgroundColor: colors.surface, boxShadow: shadow.raised }]}><BrandLogo size={72} /><ThemedText variant="headline">당신의 하루를</ThemedText><ThemedText variant="headline">기억으로 바꿔요</ThemedText><View style={[styles.divider, { backgroundColor: colors.border }]} /><View style={styles.formula}><ThemedText variant="caption">위치</ThemedText><ThemedText variant="caption">+</ThemedText><ThemedText variant="caption">시간</ThemedText><ThemedText variant="caption">+</ThemedText><ThemedText variant="caption">사진</ThemedText><ThemedText variant="caption">=</ThemedText><ThemedText variant="caption" style={{ color: colors.warm }}>Memory</ThemedText></View></View></View>
    <View style={styles.copy}><ThemedText variant="largeTitle">기록하지 않아도,{"\n"}남는 순간들</ThemedText><ThemedText variant="body" style={{ color: colors.secondaryText }}>방문한 장소와 그날의 사진을 연결해{ "\n" }당신만의 시간을 조용히 기록합니다.</ThemedText></View>
    <PressableScale accessibilityRole="button" onPress={() => void continueToAuth()} style={[styles.cta, { backgroundColor: colors.accent, boxShadow: shadow.cta }]}><ThemedText variant="headline" style={{ color: colors.onAccent }}>시작하기</ThemedText><Ionicons name="arrow-forward" size={18} color={colors.onAccent} /></PressableScale>
  </ScrollView>;
}

const styles = StyleSheet.create({ content: { flexGrow: 1, padding: spacing.ml, paddingTop: spacing.lg, paddingBottom: spacing.xxl, justifyContent: 'space-between', gap: spacing.xl }, top: { gap: spacing.xs }, brandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm }, visual: { height: 280, alignItems: 'center', justifyContent: 'center' }, backCard: { position: 'absolute', width: 150, height: 188, borderRadius: radius.card, alignItems: 'center', justifyContent: 'center', gap: spacing.xs }, centerCard: { width: 220, height: 226, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', gap: spacing.xxs, padding: spacing.md }, divider: { height: 1, width: 130, marginVertical: spacing.sm }, formula: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs }, copy: { gap: spacing.md }, cta: { minHeight: 56, borderRadius: radius.md, borderCurve: 'continuous', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs } });
