import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { ScrollView, StyleSheet, View } from 'react-native';
import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { useAppStore } from '@/store/app-store';
import { radius, shadow, spacing, useTraceTheme } from '@/theme';

const features = ['무제한 추억 저장', '고화질 사진 보관', '안전한 자동 백업', '장소별 전체 기록', 'AI 일일 요약'];

export default function PremiumScreen() {
  const { colors } = useTraceTheme();
  const isPremium = useAppStore((state) => state.isPremium);
  const setPremium = useAppStore((state) => state.setPremium);
  const subscribe = () => {
    setPremium(true);
    if (process.env.EXPO_OS === 'ios') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={[styles.content, { backgroundColor: colors.background }]}>
      <View style={[styles.hero, { backgroundColor: colors.lavender, boxShadow: shadow.soft }]}>
        <View style={[styles.glow, { backgroundColor: colors.ivory }]} />
        <Ionicons name="diamond-outline" size={30} color={colors.warm} />
        <ThemedText variant="largeTitle">Trace Premium</ThemedText>
        <ThemedText variant="title">{'당신의 모든 시간을\n안전하게 간직하세요.'}</ThemedText>
        <ThemedText variant="subhead">광고 없이, 오직 당신의 기억만을 위한 공간이에요.</ThemedText>
      </View>

      <View style={styles.list}>
        {features.map((feature) => <View key={feature} style={styles.feature}><View style={[styles.check, { backgroundColor: colors.accentSoft }]}><Ionicons name="checkmark" size={15} color={colors.success} /></View><ThemedText variant="body">{feature}</ThemedText></View>)}
      </View>

      <View style={styles.price}><ThemedText variant="largeTitle">₩2,900</ThemedText><ThemedText variant="subhead">월 구독 · 언제든지 취소 가능</ThemedText></View>

      <PressableScale disabled={isPremium} accessibilityRole="button" onPress={subscribe} style={[styles.cta, { backgroundColor: isPremium ? colors.success : colors.accent, boxShadow: shadow.cta }]}>
        <ThemedText variant="headline" style={{ color: colors.onAccent }}>{isPremium ? 'Premium이 활성화되었어요' : 'Premium 시작하기'}</ThemedText>
      </PressableScale>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, padding: spacing.ml, paddingBottom: spacing.xxl, gap: spacing.xl },
  hero: { padding: spacing.xl, borderRadius: radius.lg, borderCurve: 'continuous', gap: spacing.sm, overflow: 'hidden' },
  glow: { position: 'absolute', width: 220, height: 220, borderRadius: radius.full, right: -100, top: -100, opacity: 0.74 },
  list: { gap: spacing.md, paddingHorizontal: spacing.xs },
  feature: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  check: { width: 28, height: 28, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  price: { gap: spacing.xxs },
  cta: { minHeight: 56, alignItems: 'center', justifyContent: 'center', borderRadius: 18, borderCurve: 'continuous' },
});
