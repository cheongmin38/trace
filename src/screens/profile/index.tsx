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
      style={{ backgroundColor: colors.traceInk }}
      contentContainerStyle={styles.content}
    >
      <View style={styles.topBar}>
        <ThemedText variant="headline" style={styles.brand}>Trace</ThemedText>
        <PressableScale onPress={() => router.push('/settings')} style={styles.iconButton} accessibilityLabel="설정 열기">
          <Ionicons name="settings-outline" size={21} color="#F8F7F3" />
        </PressableScale>
      </View>

      <View style={styles.identity}>
        <MemoryImage uri={avatarUri} accessibilityLabel={`${displayName} 프로필 사진`} style={styles.avatar} />
        <View style={styles.identityCopy}>
          <ThemedText variant="title" style={styles.white}>{displayName}</ThemedText>
          <ThemedText variant="caption" style={styles.muted}>{handle}</ThemedText>
          <ThemedText variant="caption" style={styles.muted}>Trace와 함께한 지 {Math.max(1, year - joinedYear + 1)}년</ThemedText>
        </View>
        <PressableScale onPress={() => router.push('/notifications')} style={styles.iconButton} accessibilityLabel="알림 열기">
          <Ionicons name="notifications-outline" size={21} color="#F8F7F3" />
        </PressableScale>
      </View>

      <View style={styles.stats}>
        <ProfileStat value={userStats.placeCount} label="기록한 장소" />
        <View style={styles.divider} />
        <ProfileStat value={userStats.photoCount} label="기록한 사진" />
        <View style={styles.divider} />
        <ProfileStat value={userStats.visitCount} label="방문 기록" />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <ThemedText variant="headline" style={styles.white}>나의 Top 장소</ThemedText>
          <PressableScale onPress={() => router.push('/places')}><ThemedText variant="caption" style={styles.lavender}>전체 보기</ThemedText></PressableScale>
        </View>
        <View style={styles.topPlaces}>
          {topPlaces.length ? topPlaces.map((place, index) => (
            <PressableScale
              key={place.id}
              onPress={() => router.push({ pathname: '/place/[id]', params: { id: place.id } })}
              style={styles.placeRow}
            >
              <ThemedText variant="headline" style={styles.rank}>{index + 1}</ThemedText>
              <MemoryImage uri={place.coverPhoto ?? ''} accessibilityLabel={place.name} style={styles.placePhoto} />
              <View style={styles.placeCopy}>
                <ThemedText variant="headline" style={styles.white} numberOfLines={1}>{place.name}</ThemedText>
                <ThemedText variant="caption" style={styles.muted}>{place.address ?? '주소 정보 없음'}</ThemedText>
              </View>
              <ThemedText variant="caption" style={styles.lavender}>{place.actualVisits}회</ThemedText>
            </PressableScale>
          )) : <ThemedText variant="body" style={styles.muted}>방문 기록이 쌓이면 자주 간 장소를 보여드릴게요.</ThemedText>}
        </View>
      </View>

      <View style={styles.menuGroup}>
        {menuRows.map((item, index) => (
          <PressableScale
            key={item.label}
            onPress={() => item.route === '/review/[year]'
              ? router.push({ pathname: '/review/[year]', params: { year: String(year) } })
              : router.push(item.route)}
            style={[styles.menuRow, index < menuRows.length - 1 && styles.menuBorder]}
          >
            <View style={styles.menuLabel}>
              <Ionicons name={item.icon} size={19} color="#E9E7E2" />
              <ThemedText variant="body" style={styles.white}>{item.label}</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={17} color="#6F7178" />
          </PressableScale>
        ))}
      </View>

      <PressableScale onPress={() => router.push('/premium')} style={[styles.plusCard, { boxShadow: shadow.raised }]}>
        <View style={styles.plusCopy}>
          <View style={styles.plusTitle}>
            <Ionicons name="sparkles" size={17} color={colors.aiAccent} />
            <ThemedText variant="headline" style={styles.white}>{isPremium ? 'Trace Plus 이용 중' : 'Trace Plus'}</ThemedText>
          </View>
          <ThemedText variant="caption" style={styles.plusBody}>모든 기억을 더 오래, 안전하게 간직하세요.</ThemedText>
        </View>
        <Ionicons name="arrow-forward" size={19} color={colors.aiAccent} />
      </PressableScale>
    </ScrollView>
  );
}

function ProfileStat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.stat}>
      <CountUpText value={value} variant="title" style={styles.statValue} />
      <ThemedText variant="caption" style={styles.muted}>{label}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingHorizontal: spacing.ml, paddingTop: spacing.md, paddingBottom: 124, gap: spacing.lg },
  topBar: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { color: '#F8F7F3', fontFamily: 'serif' },
  iconButton: { width: 44, height: 44, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1A1E27' },
  identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: { width: 76, height: 76, borderRadius: radius.full, borderWidth: 2, borderColor: '#343944' },
  identityCopy: { flex: 1, gap: 2 },
  white: { color: '#F8F7F3' },
  muted: { color: '#969AA4' },
  lavender: { color: '#B8A9FF' },
  stats: { minHeight: 92, flexDirection: 'row', alignItems: 'center', borderRadius: radius.card, borderCurve: 'continuous', backgroundColor: '#181C25', paddingHorizontal: spacing.sm },
  stat: { flex: 1, alignItems: 'center', gap: 3 },
  statValue: { color: '#F8F7F3', fontVariant: ['tabular-nums'] },
  divider: { width: StyleSheet.hairlineWidth, height: 38, backgroundColor: '#303541' },
  section: { gap: spacing.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topPlaces: { borderRadius: radius.card, borderCurve: 'continuous', backgroundColor: '#181C25', paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  placeRow: { minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rank: { width: 22, color: '#777B85', textAlign: 'center', fontVariant: ['tabular-nums'] },
  placePhoto: { width: 46, height: 46, borderRadius: radius.md },
  placeCopy: { flex: 1, gap: 2 },
  menuGroup: { borderRadius: radius.card, borderCurve: 'continuous', backgroundColor: '#181C25', paddingHorizontal: spacing.md, overflow: 'hidden' },
  menuRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  menuBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#2D323C' },
  menuLabel: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  plusCard: { minHeight: 92, flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderRadius: radius.card, borderCurve: 'continuous', padding: spacing.md, backgroundColor: '#24213B', borderWidth: StyleSheet.hairlineWidth, borderColor: '#4A426D' },
  plusCopy: { flex: 1, gap: spacing.xs },
  plusTitle: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  plusBody: { color: '#B8B2C9' },
});
