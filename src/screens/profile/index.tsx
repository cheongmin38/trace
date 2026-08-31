import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { CountUpText } from '@/components/count-up-text';
import { MemoryImage } from '@/components/memory-image';
import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { profileSummary } from '@/services/mock-archive';
import { useAppStore } from '@/store/app-store';
import { useAuthStore } from '@/store/auth-store';
import { radius, shadow, spacing, useTraceTheme } from '@/theme';

const menuRows = [
  { label: '활동 통계', icon: 'stats-chart-outline', route: '/review/[year]' },
  { label: '나의 장소', icon: 'location-outline', route: '/places' },
  { label: '보관함', icon: 'archive-outline', route: '/archive' },
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
  const year = new Date().getFullYear();

  const topPlaces = useMemo(() => places
    .map((place) => ({ ...place, actualVisits: visits.filter((visit) => visit.placeId === place.id).length }))
    .filter((place) => place.actualVisits > 0)
    .sort((left, right) => right.actualVisits - left.actualVisits)
    .slice(0, 3), [places, visits]);

  const avatarUri = user?.avatarUrl ?? memories[0]?.photos[0]?.uri ?? places[0]?.coverPhoto ?? '';
  const displayName = user?.name ?? profileSummary.name;
  const handle = user?.email ? `@${user.email.split('@')[0]}` : profileSummary.handle;
  const joinedYear = user?.createdAt ? new Date(user.createdAt).getFullYear() : 2024;

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
    >
      <View style={styles.topBar}>
        <ThemedText variant="headline" style={{ color: colors.text }}>Trace</ThemedText>
        <PressableScale onPress={() => router.push('/settings')} style={[styles.iconButton, { backgroundColor: colors.surface, borderColor: colors.border }]} accessibilityLabel="설정 열기">
          <Ionicons name="settings-outline" size={21} color={colors.text} />
        </PressableScale>
      </View>

      <View style={styles.identity}>
        <MemoryImage uri={avatarUri} accessibilityLabel={`${displayName} 프로필 사진`} style={styles.avatar} />
        <View style={styles.identityCopy}>
          <ThemedText variant="title" style={{ color: colors.text }}>{displayName}</ThemedText>
          <ThemedText variant="caption" style={{ color: colors.secondaryText }}>{handle}</ThemedText>
          <ThemedText variant="caption" style={{ color: colors.secondaryText }}>Trace와 함께한 지 {Math.max(1, year - joinedYear + 1)}년</ThemedText>
        </View>
        <PressableScale onPress={() => router.push('/notifications')} style={styles.iconButton} accessibilityLabel="알림 열기">
          <Ionicons name="notifications-outline" size={21} color={colors.text} />
        </PressableScale>
      </View>

      <View style={[styles.stats, { backgroundColor: colors.surface, borderColor: colors.border, boxShadow: shadow.soft }]}>
        <ProfileStat value={userStats.placeCount} label="기록한 장소" colors={colors} />
        <View style={styles.divider} />
        <ProfileStat value={userStats.photoCount} label="기록한 사진" colors={colors} />
        <View style={styles.divider} />
        <ProfileStat value={userStats.visitCount} label="방문 기록" colors={colors} />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <ThemedText variant="headline" style={{ color: colors.text }}>나의 Top 장소</ThemedText>
          <PressableScale onPress={() => router.push('/places')}><ThemedText variant="caption" style={{ color: colors.traceLavender }}>전체 보기</ThemedText></PressableScale>
        </View>
        <View style={[styles.topPlaces, { backgroundColor: colors.surface, borderColor: colors.border, boxShadow: shadow.soft }]}>
          {topPlaces.length ? topPlaces.map((place, index) => (
            <PressableScale
              key={place.id}
              onPress={() => router.push({ pathname: '/place/[id]', params: { id: place.id } })}
              style={styles.placeRow}
            >
              <ThemedText variant="headline" style={styles.rank}>{index + 1}</ThemedText>
              <MemoryImage uri={place.coverPhoto ?? ''} accessibilityLabel={place.name} style={styles.placePhoto} />
              <View style={styles.placeCopy}>
              <ThemedText variant="headline" style={{ color: colors.text }} numberOfLines={1}>{place.name}</ThemedText>
                <ThemedText variant="caption" style={{ color: colors.secondaryText }}>{place.address ?? '주소 정보 없음'}</ThemedText>
              </View>
              <ThemedText variant="caption" style={{ color: colors.traceLavender }}>{place.actualVisits}회</ThemedText>
            </PressableScale>
          )) : <ThemedText variant="body" style={styles.muted}>방문 기록이 쌓이면 자주 간 장소를 보여드릴게요.</ThemedText>}
        </View>
      </View>

      <View style={[styles.menuGroup, { backgroundColor: colors.surface, borderColor: colors.border, boxShadow: shadow.soft }]}>
        {menuRows.map((item, index) => (
          <PressableScale
            key={item.label}
            onPress={() => item.route === '/review/[year]'
              ? router.push({ pathname: '/review/[year]', params: { year: String(year) } })
              : router.push(item.route)}
            style={[styles.menuRow, index < menuRows.length - 1 && styles.menuBorder]}
          >
            <View style={styles.menuLabel}>
              <Ionicons name={item.icon} size={19} color={colors.text} />
              <ThemedText variant="body" style={{ color: colors.text }}>{item.label}</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={17} color={colors.tertiaryText} />
          </PressableScale>
        ))}
      </View>

      <PressableScale onPress={() => router.push('/premium')} style={[styles.plusCard, { backgroundColor: colors.lavender, borderColor: colors.traceLavender, boxShadow: shadow.soft }]}>
        <View style={styles.plusCopy}>
          <View style={styles.plusTitle}>
            <Ionicons name="sparkles" size={17} color={colors.aiAccent} />
            <ThemedText variant="headline" style={{ color: colors.text }}>{isPremium ? 'Trace Premium 이용 중' : 'Trace Premium'}</ThemedText>
          </View>
          <ThemedText variant="body" style={{ color: colors.text }}>모든 순간을 오래, 안전하게 간직하세요.</ThemedText>
          <View style={styles.plusFeatures}><View style={[styles.feature, { backgroundColor: colors.surface }]}><ThemedText variant="caption">자동 백업</ThemedText></View><View style={[styles.feature, { backgroundColor: colors.surface }]}><ThemedText variant="caption">고화질 보관</ThemedText></View><View style={[styles.feature, { backgroundColor: colors.surface }]}><ThemedText variant="caption">무제한 추억</ThemedText></View></View>
        </View>
        <View style={[styles.plusArrow, { backgroundColor: colors.text }]}><Ionicons name="arrow-forward" size={17} color={colors.onAccent} /></View>
      </PressableScale>
    </ScrollView>
  );
}

function ProfileStat({ value, label, colors }: { value: number; label: string; colors: ReturnType<typeof useTraceTheme>['colors'] }) {
  return (
    <View style={styles.stat}>
      <CountUpText value={value} variant="title" style={[styles.statValue, { color: colors.text }]} />
      <ThemedText variant="caption" style={{ color: colors.secondaryText }}>{label}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingHorizontal: spacing.ml, paddingTop: spacing.md, paddingBottom: 124, gap: spacing.lg },
  topBar: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { fontFamily: 'serif' },
  iconButton: { width: 44, height: 44, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth },
  identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: { width: 76, height: 76, borderRadius: radius.full, borderWidth: 2, borderColor: '#343944' },
  identityCopy: { flex: 1, gap: 2 },
  white: {},
  muted: {},
  lavender: {},
  stats: { minHeight: 92, flexDirection: 'row', alignItems: 'center', borderRadius: radius.card, borderCurve: 'continuous', borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: spacing.sm },
  stat: { flex: 1, alignItems: 'center', gap: 3 },
  statValue: { color: '#F8F7F3', fontVariant: ['tabular-nums'] },
  divider: { width: StyleSheet.hairlineWidth, height: 38, backgroundColor: '#303541' },
  section: { gap: spacing.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topPlaces: { borderRadius: radius.card, borderCurve: 'continuous', borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  placeRow: { minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rank: { width: 22, color: '#777B85', textAlign: 'center', fontVariant: ['tabular-nums'] },
  placePhoto: { width: 46, height: 46, borderRadius: radius.md },
  placeCopy: { flex: 1, gap: 2 },
  menuGroup: { borderRadius: radius.card, borderCurve: 'continuous', borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: spacing.md, overflow: 'hidden' },
  menuRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  menuBorder: { borderBottomWidth: StyleSheet.hairlineWidth },
  menuLabel: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  plusCard: { minHeight: 156, flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, borderRadius: radius.lg, borderCurve: 'continuous', padding: spacing.lg, borderWidth: StyleSheet.hairlineWidth },
  plusCopy: { flex: 1, gap: spacing.sm },
  plusTitle: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  plusFeatures: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
  feature: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.full, borderCurve: 'continuous' },
  plusArrow: { width: 36, height: 36, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  plusBody: {},
});
