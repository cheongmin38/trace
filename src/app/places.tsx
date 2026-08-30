import { Stack, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { MemoryImage } from '@/components/memory-image';
import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { useAppStore } from '@/store/app-store';
import { radius, shadow, spacing, useTraceTheme } from '@/theme';
import type { PlaceKind } from '@/types/trace';

const filters: { value: PlaceKind | 'ALL'; label: string }[] = [
  { value: 'ALL', label: '전체' }, { value: 'CAFE', label: '카페' }, { value: 'PARK', label: '공원' }, { value: 'FOOD', label: '맛집' }, { value: 'TRAVEL', label: '여행' }, { value: 'CULTURE', label: '문화' }, { value: 'OTHER', label: '기타' },
];

export default function PlacesScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { colors } = useTraceTheme();
  const places = useAppStore((state) => state.places);
  const [filter, setFilter] = useState<PlaceKind | 'ALL'>('ALL');
  const filtered = useMemo(() => places.filter((place) => filter === 'ALL' || place.kind === filter).sort((left, right) => new Date(right.lastVisitedAt ?? 0).getTime() - new Date(left.lastVisitedAt ?? 0).getTime()), [filter, places]);
  const cardWidth = (Math.min(width, 480) - spacing.ml * 2 - spacing.sm) / 2;
  return <><Stack.Screen options={{ title: '나의 장소' }} /><FlatList data={filtered} keyExtractor={(place) => place.id} numColumns={2} columnWrapperStyle={styles.columns} contentInsetAdjustmentBehavior="automatic" style={{ backgroundColor: colors.background }} contentContainerStyle={styles.content} ListHeaderComponent={<View style={styles.header}><ThemedText variant="largeTitle">나의 장소</ThemedText><ThemedText variant="subhead">자주 머문 곳부터 여행지까지, 당신의 공간을 모았어요.</ThemedText><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>{filters.map((item) => <PressableScale key={item.value} accessibilityRole="button" accessibilityState={{ selected: filter === item.value }} onPress={() => setFilter(item.value)} style={[styles.filter, { backgroundColor: filter === item.value ? colors.accent : colors.surface }]}><ThemedText variant="caption" style={{ color: filter === item.value ? colors.onAccent : colors.secondaryText }}>{item.label}</ThemedText></PressableScale>)}</ScrollView></View>} renderItem={({ item }) => <PressableScale accessibilityRole="button" accessibilityLabel={`${item.name} 장소 보기`} onPress={() => router.push({ pathname: '/place/[id]', params: { id: item.id } })} style={[styles.card, { width: cardWidth, backgroundColor: colors.surface, boxShadow: shadow.soft }]}><MemoryImage uri={item.coverPhoto ?? ''} accessibilityLabel={item.name} style={styles.photo} /><View style={styles.copy}><ThemedText variant="headline" numberOfLines={1}>{item.name}</ThemedText><ThemedText variant="caption">{item.visitCount}회 · 사진 {item.photoCount}장</ThemedText><ThemedText variant="caption" numberOfLines={1}>{item.address}</ThemedText></View></PressableScale>} ListEmptyComponent={<View style={styles.empty}><ThemedText variant="headline">이 분류의 장소가 아직 없어요</ThemedText></View>} /></>;
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.ml, paddingBottom: spacing.xxl },
  header: { paddingTop: spacing.lg, paddingBottom: spacing.lg, gap: spacing.sm },
  filters: { gap: spacing.xs, paddingVertical: spacing.xs },
  filter: { minHeight: 36, paddingHorizontal: spacing.sm, borderRadius: radius.full, justifyContent: 'center' },
  columns: { gap: spacing.sm, marginBottom: spacing.sm },
  card: { borderRadius: radius.card, borderCurve: 'continuous', overflow: 'hidden' },
  photo: { width: '100%', aspectRatio: 1 },
  copy: { padding: spacing.sm, gap: spacing.xxs },
  empty: { paddingVertical: spacing.xxl, alignItems: 'center' },
});
