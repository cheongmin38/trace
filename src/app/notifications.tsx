import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { EmptyState } from '@/components/empty-state';
import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { useAppStore } from '@/store/app-store';
import { radius, spacing, useTraceTheme } from '@/theme';

type Notice = {
  id: string;
  title: string;
  body: string;
  date: string;
  icon: keyof typeof Ionicons.glyphMap;
  memoryId?: string;
  reviewYear?: string;
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { colors } = useTraceTheme();
  const memories = useAppStore((state) => state.memories);
  const places = useAppStore((state) => state.places);

  const notices = useMemo<Notice[]>(() => {
    const now = new Date();
    const memoryNotices = memories.slice(0, 8).map((memory) => {
      const place = places.find((candidate) => candidate.id === memory.placeId);
      return {
        id: `memory-${memory.id}`,
        title: '새로운 기억이 준비됐어요',
        body: `${place?.name ?? memory.title}의 방문과 사진을 하나의 기억으로 정리했어요.`,
        date: memory.createdAt,
        icon: 'sparkles-outline' as const,
        memoryId: memory.id,
      };
    });
    const yearAgo = memories.find((memory) => {
      const date = new Date(memory.startedAt);
      return date.getMonth() === now.getMonth() && date.getDate() === now.getDate() && date.getFullYear() === now.getFullYear() - 1;
    });
    const yearAgoNotice: Notice[] = yearAgo ? [{
      id: `year-ago-${yearAgo.id}`,
      title: '1년 전 오늘의 기억',
      body: '그날의 장소와 사진을 다시 만나보세요.',
      date: yearAgo.startedAt,
      icon: 'time-outline',
      memoryId: yearAgo.id,
    }] : [];
    const monthly: Notice = {
      id: `monthly-${now.getFullYear()}-${now.getMonth()}`,
      title: '이번 달 Trace를 돌아보세요',
      body: '이번 달의 장소와 사진을 한눈에 정리했어요.',
      date: now.toISOString(),
      icon: 'calendar-outline',
      reviewYear: String(now.getFullYear()),
    };
    return [monthly, ...yearAgoNotice, ...memoryNotices].sort((left, right) => right.date.localeCompare(left.date));
  }, [memories, places]);

  const today = new Date().toDateString();
  const todayNotices = notices.filter((notice) => new Date(notice.date).toDateString() === today);
  const previousNotices = notices.filter((notice) => new Date(notice.date).toDateString() !== today);

  const openNotice = (notice: Notice) => {
    if (notice.memoryId) router.push({ pathname: '/memory/[id]', params: { id: notice.memoryId } });
    else if (notice.reviewYear) router.push({ pathname: '/review/[year]', params: { year: notice.reviewYear } });
  };

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={[styles.content, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: '알림' }} />
      <View style={styles.header}>
        <ThemedText variant="largeTitle">알림</ThemedText>
        <ThemedText variant="subhead" style={{ color: colors.secondaryText }}>Trace가 발견한 새로운 기록을 모아두었어요.</ThemedText>
      </View>
      {!notices.length ? <EmptyState title="새로운 알림이 없어요" description="기억이 만들어지면 이곳에서 알려드릴게요." /> : null}
      {todayNotices.length ? <NoticeSection title="오늘" notices={todayNotices} onPress={openNotice} /> : null}
      {previousNotices.length ? <NoticeSection title="이전 알림" notices={previousNotices} onPress={openNotice} /> : null}
    </ScrollView>
  );
}

function NoticeSection({ title, notices, onPress }: { title: string; notices: Notice[]; onPress: (notice: Notice) => void }) {
  const { colors } = useTraceTheme();
  return (
    <View style={styles.section}>
      <ThemedText variant="headline">{title}</ThemedText>
      <View style={[styles.group, { backgroundColor: colors.surface }]}>
        {notices.map((notice, index) => (
          <PressableScale
            key={notice.id}
            onPress={() => onPress(notice)}
            style={[styles.row, index < notices.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}
          >
            <View style={[styles.icon, { backgroundColor: colors.lavender }]}>
              <Ionicons name={notice.icon} size={20} color={colors.traceLavender} />
            </View>
            <View style={styles.copy}>
              <ThemedText variant="headline">{notice.title}</ThemedText>
              <ThemedText variant="caption" style={{ color: colors.secondaryText }}>{notice.body}</ThemedText>
              <ThemedText variant="caption" style={{ color: colors.tertiaryText }}>
                {new Date(notice.date).toLocaleDateString('ko-KR')}
              </ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={17} color={colors.tertiaryText} />
          </PressableScale>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, padding: spacing.ml, paddingBottom: spacing.xxxl, gap: spacing.lg },
  header: { gap: spacing.xxs },
  section: { gap: spacing.sm },
  group: { borderRadius: radius.card, borderCurve: 'continuous', paddingHorizontal: spacing.md, overflow: 'hidden' },
  row: { minHeight: 88, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  icon: { width: 42, height: 42, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, gap: 3 },
});
