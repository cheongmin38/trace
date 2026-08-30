import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BrandLogo } from '@/components/brand-logo';
import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { radius, shadow, spacing, useTraceTheme } from '@/theme';

export default function PermissionIntro() {
  const router = useRouter();
  const { colors } = useTraceTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={styles.progressRow}>
          <ThemedText variant="caption" style={{ color: colors.secondaryText }}>
            Trace 시작하기
          </ThemedText>
          <ThemedText variant="caption" style={{ color: colors.secondaryText }}>
            1 / 3
          </ThemedText>
        </View>

        <View style={styles.hero}>
          <View style={[styles.logoFrame, { backgroundColor: colors.text }]}>
            <BrandLogo size={62} />
          </View>
          <ThemedText variant="screenTitle" style={styles.title}>
            자동으로 남는
            {'\n'}
            나의 하루
          </ThemedText>
          <ThemedText variant="body" style={{ color: colors.secondaryText }}>
            위치와 사진을 연결해{ '\n' }기록하지 않아도 기억을 남겨드려요.
          </ThemedText>

          <View style={[styles.visual, { backgroundColor: colors.surfaceMuted }]}>
            <View style={[styles.route, { borderColor: colors.accent }]} />
            <View style={[styles.pin, styles.pinOne, { backgroundColor: colors.accentSoft }]}>
              <Ionicons name="location" size={18} color={colors.accent} />
            </View>
            <View style={[styles.pin, styles.pinTwo, { backgroundColor: colors.accentSoft }]}>
              <Ionicons name="camera" size={17} color={colors.accent} />
            </View>
            <View style={[styles.sparkle, { backgroundColor: colors.accent }]}>
              <Ionicons name="sparkles" size={16} color={colors.onAccent} />
            </View>
          </View>

          <View style={[styles.formula, { backgroundColor: colors.surface }]}>
            {['위치', '시간', '사진'].map((label, index) => (
              <View key={label} style={styles.formulaItem}>
                <View style={[styles.formulaIcon, { backgroundColor: colors.surfaceMuted }]}>
                  <Ionicons
                    name={index === 0 ? 'navigate' : index === 1 ? 'time-outline' : 'images-outline'}
                    size={16}
                    color={colors.accent}
                  />
                </View>
                <ThemedText variant="caption">{label}</ThemedText>
              </View>
            ))}
            <ThemedText variant="title" style={{ color: colors.accent }}>＝</ThemedText>
            <ThemedText variant="headline">Memory</ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {[0, 1, 2].map((dot) => (
            <View key={dot} style={[styles.dot, { backgroundColor: dot === 0 ? colors.accent : colors.border }]} />
          ))}
        </View>
        <PressableScale
          onPress={() => router.push('/onboarding/location')}
          style={[styles.cta, { backgroundColor: colors.text, boxShadow: shadow.cta }]}
        >
          <ThemedText variant="headline" style={{ color: colors.onAccent }}>시작하기</ThemedText>
          <Ionicons name="arrow-forward" size={19} color={colors.onAccent} />
        </PressableScale>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: spacing.ml, paddingTop: spacing.xl },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hero: { flex: 1, justifyContent: 'center', gap: spacing.md, paddingBottom: spacing.xl },
  logoFrame: { width: 82, height: 82, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  title: { lineHeight: 40 },
  visual: { height: 190, borderRadius: radius.lg, overflow: 'hidden', position: 'relative', marginTop: spacing.md },
  route: { position: 'absolute', width: 260, height: 105, left: 34, top: 40, borderWidth: 2, borderRadius: 80, borderStyle: 'dashed', transform: [{ rotate: '-8deg' }] },
  pin: { position: 'absolute', width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  pinOne: { left: 46, top: 42 },
  pinTwo: { right: 48, bottom: 38 },
  sparkle: { position: 'absolute', right: 56, top: 28, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  formula: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, borderColor: '#E8E3DA' },
  formulaItem: { alignItems: 'center', gap: 5 },
  formulaIcon: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  footer: { paddingHorizontal: spacing.ml, paddingBottom: spacing.xxl, gap: spacing.md },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  cta: { minHeight: 56, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
});
