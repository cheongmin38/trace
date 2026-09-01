import { useRouter } from 'expo-router';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { MemoryImage } from '@/components/memory-image';
import { PhotoThumbnail } from '@/components/photo-thumbnail';
import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { formatVisitDate, formatVisitTime } from '@/services/mock-archive';
import { useAppStore } from '@/store/app-store';
import { radius, shadow, spacing, useTraceTheme } from '@/theme';
import type { Memory } from '@/types/trace';

export const MemoryCard = memo(function MemoryCard({ memory }: { memory: Memory }) {
  const router = useRouter();
  const { colors } = useTraceTheme();
  const place = useAppStore((state) => state.places.find((item) => item.id === memory.placeId));
  const placeName = place?.name ?? memory.title;
  return <PressableScale accessibilityRole="button" accessibilityLabel={`${placeName} 추억 보기`} onPress={() => router.push({ pathname: '/memory/[id]', params: { id: memory.id } })} style={[styles.root, { backgroundColor: colors.surfaceGlass, borderColor: colors.border, boxShadow: shadow.soft }]}><ThemedText variant="caption" style={[styles.date, { color: colors.secondaryText }]}>{formatVisitDate(memory.startedAt)}</ThemedText><MemoryImage uri={memory.photos[0]?.uri ?? place?.coverPhoto ?? ''} accessibilityLabel={placeName} style={[styles.hero, { backgroundColor: colors.surfaceMuted }]} /><View style={styles.copy}><View style={styles.titleLine}><ThemedText variant="title" numberOfLines={1} style={styles.title}>{placeName}</ThemedText><View style={[styles.visit, { backgroundColor: colors.accentSoft }]}><ThemedText variant="caption">{memory.visitNumber}번째 방문</ThemedText></View></View><View style={styles.metadata}><ThemedText variant="subhead" numberOfLines={1}>{place?.address ?? '장소 정보 없음'}</ThemedText><View style={[styles.metaDot, { backgroundColor: colors.tertiaryText }]} /><ThemedText variant="subhead">{formatVisitTime(memory.startedAt)}</ThemedText></View></View><View style={styles.thumbnails}>{memory.photos.slice(0, 4).map((photo, index) => <PhotoThumbnail key={photo.id} uri={photo.uri} label={`${placeName} 사진 ${index + 1}`} />)}<View style={styles.photoCount}><ThemedText variant="caption">사진 {memory.photos.length}장</ThemedText></View></View></PressableScale>;
});
const styles = StyleSheet.create({ root: { gap: spacing.sm, padding: spacing.sm, marginBottom: spacing.md, borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.card, borderCurve: 'continuous' }, date: { paddingTop: spacing.xs, fontSize: 13, lineHeight: 18, fontWeight: '600' }, hero: { width: '100%', aspectRatio: 1.45, borderRadius: radius.md, borderCurve: 'continuous' }, copy: { gap: spacing.xs, paddingTop: spacing.xxs }, titleLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs }, title: { flex: 1 }, visit: { paddingHorizontal: spacing.xs, paddingVertical: spacing.xxs, borderRadius: radius.sm, borderCurve: 'continuous' }, metadata: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs }, metaDot: { width: 3, height: 3, borderRadius: radius.full }, thumbnails: { flexDirection: 'row', gap: spacing.xs, alignItems: 'center' }, photoCount: { marginLeft: 'auto', alignSelf: 'flex-end', paddingBottom: spacing.xs } });
