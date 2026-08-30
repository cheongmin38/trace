import { Stack } from 'expo-router';
import { useMemo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { EmptyState } from '@/components/empty-state';
import { MemoryCard } from '@/components/memory-card';
import { ThemedText } from '@/components/themed-text';
import { useAppStore } from '@/store/app-store';
import { spacing, useTraceTheme } from '@/theme';

export default function ArchiveScreen() {
  const { colors } = useTraceTheme();
  const memories = useAppStore((state) => state.memories);
  const favorites = useMemo(() => memories
    .filter((memory) => memory.isFavorite)
    .sort((left, right) => new Date(right.startedAt).getTime() - new Date(left.startedAt).getTime()), [memories]);

  return (
    <>
      <Stack.Screen options={{ title: '내 보관함' }} />
      <FlatList
        data={favorites}
        keyExtractor={(memory) => memory.id}
        renderItem={({ item }) => <MemoryCard memory={item} />}
        contentInsetAdjustmentBehavior="automatic"
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={styles.content}
        ListHeaderComponent={<View style={styles.header}><ThemedText variant="largeTitle">간직한 추억</ThemedText><ThemedText variant="subhead">마음을 눌러 모아둔 순간을 다시 만나보세요.</ThemedText></View>}
        ListEmptyComponent={<EmptyState title="아직 간직한 추억이 없어요" description="추억 상세 화면에서 하트를 누르면 이곳에 모여요." />}
      />
    </>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingHorizontal: spacing.ml, paddingBottom: spacing.xxl },
  header: { paddingTop: spacing.lg, paddingBottom: spacing.xl, gap: spacing.xxs },
});
