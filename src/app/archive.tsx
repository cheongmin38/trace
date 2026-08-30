import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { EmptyState } from '@/components/empty-state';
import { MemoryImage } from '@/components/memory-image';
import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { useAppStore } from '@/store/app-store';
import { radius, shadow, spacing, useTraceTheme } from '@/theme';

type ArchiveMode = 'favorites' | 'saved';

export default function ArchiveScreen() {
  const router = useRouter();
  const { colors } = useTraceTheme();
  const memories = useAppStore((state) => state.memories);
  const places = useAppStore((state) => state.places);
  const [mode, setMode] = useState<ArchiveMode>('favorites');

  const visibleMemories = useMemo(() => memories
    .filter((memory) => mode === 'saved' || memory.isFavorite)
    .sort((left, right) => new Date(right.startedAt).getTime() - new Date(left.startedAt).getTime()), [memories, mode]);

  return (
    <>
      <Stack.Screen options={{ title: '보관함' }} />
      <FlatList
        data={visibleMemories}
        keyExtractor={(memory) => memory.id}
        numColumns={2}
        columnWrapperStyle={styles.columns}
        contentInsetAdjustmentBehavior="automatic"
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={styles.content}
        ListHeaderComponent={(
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View style={styles.titleCopy}>
                <ThemedText variant="largeTitle">보관함</ThemedText>
                <ThemedText variant="subhead" style={{ color: colors.secondaryText }}>
                  다시 보고 싶은 기억을 모아두었어요.
                </ThemedText>
              </View>
              <PressableScale onPress={() => router.push('/trash')} style={[styles.trashButton, { backgroundColor: colors.surface }]}>
                <Ionicons name="trash-outline" size={20} color={colors.secondaryText} />
              </PressableScale>
            </View>
            <View style={[styles.segment, { backgroundColor: colors.surfaceMuted }]}>
              {(['favorites', 'saved'] as const).map((item) => {
                const selected = item === mode;
                return (
                  <PressableScale
                    key={item}
                    onPress={() => setMode(item)}
                    style={[styles.segmentItem, selected && { backgroundColor: colors.surface, boxShadow: shadow.soft }]}
                  >
                    <ThemedText variant="caption" style={{ color: selected ? colors.text : colors.secondaryText }}>
                      {item === 'favorites' ? `즐겨찾기 ${memories.filter((memory) => memory.isFavorite).length}` : `보관된 기록 ${memories.length}`}
                    </ThemedText>
                  </PressableScale>
                );
              })}
            </View>
          </View>
        )}
        renderItem={({ item }) => {
          const place = places.find((candidate) => candidate.id === item.placeId);
          return (
            <PressableScale
              onPress={() => router.push({ pathname: '/memory/[id]', params: { id: item.id } })}
              style={[styles.card, { backgroundColor: colors.surface, boxShadow: shadow.soft }]}
            >
              <MemoryImage uri={item.photos[0]?.uri ?? place?.coverPhoto ?? ''} accessibilityLabel={place?.name ?? item.title} style={styles.photo} />
              <View style={styles.cardCopy}>
                <ThemedText variant="headline" numberOfLines={1}>{place?.name ?? item.title}</ThemedText>
                <ThemedText variant="caption" style={{ color: colors.secondaryText }}>
                  {new Date(item.startedAt).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                </ThemedText>
              </View>
            </PressableScale>
          );
        }}
        ListEmptyComponent={(
          <EmptyState
            title={mode === 'favorites' ? '아직 즐겨찾기한 기억이 없어요' : '보관된 기록이 없어요'}
            description="기억 상세 화면에서 하트를 누르면 이곳에 모여요."
          />
        )}
      />
    </>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingHorizontal: spacing.ml, paddingBottom: spacing.xxxl, gap: spacing.sm },
  header: { paddingTop: spacing.lg, paddingBottom: spacing.lg, gap: spacing.lg },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  titleCopy: { flex: 1, gap: spacing.xxs },
  trashButton: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  segment: { flexDirection: 'row', borderRadius: radius.md, padding: 4 },
  segmentItem: { flex: 1, minHeight: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  columns: { gap: spacing.sm },
  card: { flex: 1, maxWidth: '50%', borderRadius: radius.card, borderCurve: 'continuous', overflow: 'hidden', marginBottom: spacing.sm },
  photo: { width: '100%', aspectRatio: 0.86 },
  cardCopy: { padding: spacing.sm, gap: 2 },
});
