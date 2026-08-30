import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { CountUpText } from '@/components/count-up-text';
import { IconButton } from '@/components/icon-button';
import { MemoryImage } from '@/components/memory-image';
import { FrequentPlaces } from '@/components/frequent-places';
import { MonthlyTraceCard } from '@/components/monthly-trace-card';
import { PremiumCard } from '@/components/premium-card';
import { PressableScale } from '@/components/pressable-scale';
import { StatCard } from '@/components/stat-card';
import { ThemedText } from '@/components/themed-text';
import { profileSummary } from '@/services/mock-archive';
import { getFrequentPlaces, getMonthlyReview } from '@/services/discovery-service';
import { useAppStore } from '@/store/app-store';
import { useAuthStore } from '@/store/auth-store';
import { radius, shadow, spacing, useTraceTheme } from '@/theme';

const menus = [
  { label: '나의 장소', icon: 'map-outline', route: '/places' },
  { label: '2026 돌아보기', icon: 'calendar-outline', route: '/review/2026' },
  { label: '내 보관함', icon: 'archive-outline', route: '/archive' },
  { label: '휴지통', icon: 'trash-outline', route: '/trash' },
] as const;

export function ProfileScreen() {
  const router = useRouter();
  const { colors } = useTraceTheme();
  const memories = useAppStore((state) => state.memories);
  const places = useAppStore((state) => state.places);
  const visits = useAppStore((state) => state.visits);
  const userStats = useAppStore((state) => state.userStats);
  const isPremium = useAppStore((state) => state.isPremium);
  const user = useAuthStore((state) => state.user);
  const [today] = useState(() => new Date());
  const frequentPlaces = useMemo(() => getFrequentPlaces(places, visits, 3), [places, visits]);
  const monthlyReview = useMemo(() => getMonthlyReview(places, visits, memories, today.getFullYear(), today.getMonth() + 1), [memories, places, today, visits]);
  const journeyStats = [
    [userStats.placeCount, '장소'],
    [userStats.visitCount, '방문'],
    [userStats.photoCount, '사진'],
    [userStats.regionCount, '지역'],
  ] as const;
  const yearStats = useMemo(() => {
    const yearMemories = memories.filter((memory) => new Date(memory.startedAt).getFullYear() === 2026);
    const yearVisits = visits.filter((visit) => new Date(visit.startedAt).getFullYear() === 2026);
    return {
      places: new Set(yearVisits.map((visit) => visit.placeId)).size,
      visits: yearVisits.length,
      photos: new Set(yearMemories.flatMap((memory) => memory.photos.map((photo) => photo.id))).size,
    };
  }, [memories, visits]);
  const avatarUri = user?.avatarUrl ?? memories[3]?.photos[0]?.uri ?? places[0]?.coverPhoto ?? '';
  const displayName = user?.name ?? profileSummary.name;
  const handle = user?.email ? `@${user.email.split('@')[0]}` : profileSummary.handle;
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={[styles.content, { backgroundColor: colors.background }]}>
      <View style={styles.actions}>
        <IconButton name="notifications-outline" label="알림" onPress={() => router.push('/notifications')} />
        <IconButton name="settings-outline" label="설정" onPress={() => router.push('/settings')} />
      </View>

      <View style={styles.identity}>
        <MemoryImage uri={avatarUri} accessibilityLabel={`${displayName} 프로필`} style={styles.avatar} />
        <View style={styles.identityCopy}>
          <ThemedText variant="largeTitle">{displayName}</ThemedText>
          <ThemedText variant="subhead">{handle}</ThemedText>
          <PressableScale onPress={() => router.push('/premium')} accessibilityRole="button" style={[styles.plan, { backgroundColor: colors.accent }]}>
            <Ionicons name="diamond" size={11} color={colors.onAccent} />
            <ThemedText variant="caption" style={{ color: colors.onAccent }}>{isPremium ? 'Premium' : 'Free'}</ThemedText>
          </PressableScale>
        </View>
      </View>

      <View style={[styles.journey, { backgroundColor: colors.journey, boxShadow: shadow.raised }]}>
        <View style={styles.journeyIntro}>
          <ThemedText variant="body" style={{ color: colors.journeyText }}>당신의 여정을 기록하고 있어요</ThemedText>
          <Ionicons name="sparkles" size={15} color={colors.warm} />
        </View>
        <View style={styles.journeyStats}>
          {journeyStats.map(([value, label], index) => (
            <View key={label} style={styles.journeyStatWrap}>
              {index > 0 ? <View style={styles.journeyDivider} /> : null}
              <View style={styles.journeyStat}>
                <CountUpText value={value} variant="title" style={[styles.journeyNumber, { color: colors.journeyText }]} />
                <ThemedText variant="caption" style={[styles.journeyLabel, { color: colors.journeyText }]}>{label}</ThemedText>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <ThemedText variant="title">올해의 기록</ThemedText>
          <ThemedText variant="subhead">2026년⌄</ThemedText>
        </View>
        <View style={styles.summary}>
          <StatCard value={yearStats.places} label="방문 장소" />
          <StatCard value={yearStats.visits} label="방문 기록" />
          <StatCard value={yearStats.photos} label="사진" />
        </View>
      </View>

      <FrequentPlaces places={frequentPlaces} />

      <MonthlyTraceCard review={monthlyReview} />

      <PremiumCard />

      <View style={[styles.menu, { backgroundColor: colors.surface, boxShadow: shadow.soft }]}>
        {menus.map((menu, index) => (
          <PressableScale
            key={menu.label}
            accessibilityRole="button"
            onPress={() => menu.route === '/review/2026' ? router.push({ pathname: '/review/[year]', params: { year: '2026' } }) : router.push(menu.route)}
            style={[styles.menuRow, index < menus.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}
          >
            <View style={styles.menuLabel}>
              <Ionicons name={menu.icon} size={20} color={colors.text} />
              <ThemedText variant="body">{menu.label}</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={17} color={colors.tertiaryText} />
          </PressableScale>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingHorizontal: spacing.ml, paddingBottom: 124, gap: spacing.lg },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.xs, paddingTop: spacing.md },
  identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.ml, paddingVertical: spacing.xs },
  avatar: { width: 100, height: 100, borderRadius: radius.full },
  identityCopy: { flex: 1, gap: spacing.xxs },
  plan: { alignSelf: 'flex-start', minHeight: 29, flexDirection: 'row', alignItems: 'center', gap: spacing.xxs, paddingHorizontal: spacing.sm, borderRadius: radius.full },
  journey: { paddingHorizontal: spacing.ml, paddingVertical: spacing.lg, borderRadius: 22, borderCurve: 'continuous', gap: spacing.lg },
  journeyIntro: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  journeyStats: { flexDirection: 'row' },
  journeyStatWrap: { flex: 1, flexDirection: 'row', alignItems: 'stretch' },
  journeyDivider: { width: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.17)' },
  journeyStat: { flex: 1, alignItems: 'center', gap: spacing.xxs },
  journeyNumber: { fontSize: 26, lineHeight: 31, fontVariant: ['tabular-nums'] },
  journeyLabel: { opacity: 0.66, fontSize: 11 },
  section: { gap: spacing.md },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  summary: { flexDirection: 'row', gap: spacing.xs },
  menu: { borderRadius: radius.card, borderCurve: 'continuous', paddingHorizontal: spacing.md, overflow: 'hidden' },
  menuRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  menuLabel: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
