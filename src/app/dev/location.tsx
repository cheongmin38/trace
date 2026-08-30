import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, Stack } from 'expo-router';
import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { MOCK_LOCATION_PRESETS, mockLocationService } from '@/services/mock-location-service';
import { useAppStore } from '@/store/app-store';
import { useLocationStore } from '@/store/location-store';
import { radius, shadow, spacing, useTraceTheme } from '@/theme';

type Action = 'arrive' | 'advance5' | 'advance10' | 'photo' | 'leave' | 'revisit' | 'poor' | 'fast' | 'reset';

const statusLabels = {
  idle: '대기 중',
  candidate: '체류 후보',
  confirmed: '방문 확정',
  ended: '방문 종료',
} as const;

export default function LocationDeveloperScreen() {
  const { colors } = useTraceTheme();
  const location = useLocationStore((state) => state.lastLocation);
  const isTracking = useLocationStore((state) => state.isTracking);
  const detection = useLocationStore((state) => state.detection);
  const trackingError = useLocationStore((state) => state.trackingError);
  const visits = useAppStore((state) => state.visits);
  const memories = useAppStore((state) => state.memories);
  const places = useAppStore((state) => state.places);
  const [pending, setPending] = useState<Action | null>(null);
  const [lastOutcome, setLastOutcome] = useState('시뮬레이터가 준비되었어요.');

  const trackedVisits = useMemo(() => visits
    .filter((visit) => visit.source !== 'demo')
    .sort((left, right) => new Date(right.startedAt).getTime() - new Date(left.startedAt).getTime())
    .slice(0, 10), [visits]);
  const candidatePlace = places.find((place) => place.id === detection?.candidate?.placeId);
  const candidatePreset = MOCK_LOCATION_PRESETS.find((preset) => preset.placeId === detection?.candidate?.placeId);
  const currentVisit = visits.find((visit) => visit.id === detection?.confirmedVisitId);

  if (!__DEV__) return <Redirect href="/map" />;

  const execute = async (action: Action, operation: () => Promise<unknown>) => {
    setPending(action);
    try {
      const result = await operation();
      const ignoredReason = typeof result === 'object' && result !== null && 'ignoredReason' in result
        ? String(result.ignoredReason ?? '')
        : '';
      const capturedPhoto = typeof result === 'object' && result !== null && 'takenAt' in result;
      setLastOutcome(capturedPhoto
        ? '현재 체류 시간에 테스트 사진을 촬영했어요.'
        : ignoredReason ? `신호 처리 결과 · ${ignoredReason}` : '위치 신호를 정상적으로 처리했어요.');
    } catch (error) {
      setLastOutcome(error instanceof Error ? error.message : '테스트 위치를 처리하지 못했어요.');
    } finally {
      setPending(null);
    }
  };

  const actionButton = (action: Action, label: string, operation: () => Promise<unknown>, emphasis = false) => (
    <PressableScale
      key={label}
      accessibilityRole="button"
      disabled={pending !== null}
      onPress={() => void execute(action, operation)}
      style={[styles.action, { backgroundColor: emphasis ? colors.accent : colors.surfaceMuted }]}
    >
      {pending === action ? <ActivityIndicator size="small" color={emphasis ? colors.onAccent : colors.text} /> : null}
      <ThemedText variant="headline" style={emphasis ? { color: colors.onAccent } : undefined}>{label}</ThemedText>
    </PressableScale>
  );

  return (
    <>
      <Stack.Screen options={{ title: 'Location Simulator' }} />
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={[styles.content, { backgroundColor: colors.background }]}>
        <View style={styles.intro}>
          <View style={[styles.devBadge, { backgroundColor: colors.accentSoft }]}><ThemedText variant="caption">DEVELOPMENT ONLY</ThemedText></View>
          <ThemedText variant="largeTitle">위치 엔진 테스트</ThemedText>
          <ThemedText variant="body">웹의 테스트 좌표도 Native GPS와 동일한 감지·저장 파이프라인을 통과합니다.</ThemedText>
        </View>

        <View style={[styles.statusCard, { backgroundColor: colors.journey, boxShadow: shadow.raised }]}>
          <View style={styles.statusHeader}>
            <View style={[styles.statusDot, { backgroundColor: isTracking ? colors.success : colors.tertiaryText }]} />
            <ThemedText variant="headline" style={{ color: colors.journeyText }}>{isTracking ? 'Tracking 활성' : 'Tracking 대기'}</ThemedText>
            <ThemedText variant="caption" style={[styles.statusValue, { color: colors.journeyText }]}>{statusLabels[detection?.status ?? 'idle']}</ThemedText>
          </View>
          <View style={styles.coordinateGrid}>
            <Coordinate label="LATITUDE" value={location?.latitude.toFixed(6) ?? '—'} />
            <Coordinate label="LONGITUDE" value={location?.longitude.toFixed(6) ?? '—'} />
            <Coordinate label="ACCURACY" value={location?.accuracy ? `${Math.round(location.accuracy)}m` : '—'} />
          </View>
          <ThemedText variant="caption" style={{ color: colors.journeyText, opacity: 0.68 }}>{lastOutcome}</ThemedText>
        </View>

        <Section title="테스트 위치" colors={colors}>
          <View style={styles.presetGrid}>
            {MOCK_LOCATION_PRESETS.map((preset) => actionButton(
              'arrive',
              preset.label,
              () => mockLocationService.arrive(preset.placeId),
              preset.id === 'seongsu',
            ))}
          </View>
        </Section>

        <Section title="체류 시나리오" colors={colors}>
          <View style={styles.presetGrid}>
            {actionButton('arrive', '성수동 도착', () => mockLocationService.arrive(), true)}
            {actionButton('advance5', '5분 경과', () => mockLocationService.advanceMinutes(5))}
            {actionButton('advance10', '10분 경과', () => mockLocationService.advanceMinutes(10))}
            {actionButton('photo', '테스트 사진 촬영', () => mockLocationService.capturePhoto())}
            {actionButton('leave', '성수동 떠나기', () => mockLocationService.leave())}
            {actionButton('revisit', '61분 후 재방문', () => mockLocationService.revisitAfterCooldown())}
          </View>
        </Section>

        <Section title="현재 감지 상태" colors={colors}>
          <InfoRow label="Candidate 장소" value={candidatePlace?.name ?? candidatePreset?.label ?? '없음'} />
          <InfoRow label="체류 시작" value={detection?.candidate?.enteredAt ? new Date(detection.candidate.enteredAt).toLocaleTimeString('ko-KR') : '—'} />
          <InfoRow label="샘플 수" value={String(detection?.candidate?.sampleCount ?? 0)} />
          <InfoRow label="현재 Visit" value={currentVisit ? `${places.find((place) => place.id === currentVisit.placeId)?.name ?? currentVisit.placeId} · ${currentVisit.visitNumber}번째` : '없음'} />
        </Section>

        <Section title="보호 시나리오" colors={colors}>
          <View style={styles.presetGrid}>
            {actionButton('poor', '낮은 정확도 신호', () => mockLocationService.sendPoorAccuracy())}
            {actionButton('fast', '빠르게 통과', () => mockLocationService.passQuickly())}
          </View>
        </Section>

        <Section title="최근 실제 Visit" colors={colors}>
          {trackedVisits.length ? trackedVisits.map((visit) => {
            const place = places.find((item) => item.id === visit.placeId);
            const memory = memories.find((item) => item.visitId === visit.id);
            return <View key={visit.id} style={styles.visitRow}><View style={[styles.visitIcon, { backgroundColor: colors.accentSoft }]}><Ionicons name={memory ? 'images' : 'location'} size={17} color={colors.text} /></View><View style={styles.visitCopy}><ThemedText variant="headline">{place?.name ?? visit.placeId}</ThemedText><ThemedText variant="caption">{visit.visitNumber}번째 방문 · {visit.durationMinutes ?? 0}분 · {visit.endedAt ? '종료' : '기록 중'}</ThemedText><ThemedText variant="caption">Memory · {visit.memoryProcessingStatus ?? '대기'}{memory ? ` · 사진 ${memory.photos.length}장` : ''}</ThemedText></View></View>;
          }) : <ThemedText variant="body">아직 시뮬레이터로 확정한 방문이 없어요.</ThemedText>}
        </Section>

        {trackingError ? <View style={[styles.error, { backgroundColor: colors.accentSoft }]}><Ionicons name="alert-circle-outline" size={18} color={colors.warm} /><ThemedText variant="caption" style={styles.errorCopy}>{trackingError}</ThemedText></View> : null}
        {actionButton('reset', '테스트 기록 초기화', () => mockLocationService.reset())}
      </ScrollView>
    </>
  );
}

function Coordinate({ label, value }: { label: string; value: string }) {
  return <View style={styles.coordinate}><ThemedText variant="caption" style={styles.coordinateLabel}>{label}</ThemedText><ThemedText variant="headline" style={styles.coordinateValue}>{value}</ThemedText></View>;
}

function Section({ title, colors, children }: { title: string; colors: ReturnType<typeof useTraceTheme>['colors']; children: ReactNode }) {
  return <View style={styles.section}><ThemedText variant="title">{title}</ThemedText><View style={[styles.sectionCard, { backgroundColor: colors.surface, boxShadow: shadow.soft }]}>{children}</View></View>;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return <View style={styles.infoRow}><ThemedText variant="subhead">{label}</ThemedText><ThemedText variant="headline" numberOfLines={1} style={styles.infoValue}>{value}</ThemedText></View>;
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, padding: spacing.ml, paddingBottom: spacing.xxxl, gap: spacing.lg },
  intro: { gap: spacing.xs },
  devBadge: { alignSelf: 'flex-start', borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: spacing.xxs },
  statusCard: { borderRadius: radius.card, borderCurve: 'continuous', padding: spacing.ml, gap: spacing.md },
  statusHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  statusDot: { width: 8, height: 8, borderRadius: radius.full },
  statusValue: { marginLeft: 'auto', opacity: 0.72 },
  coordinateGrid: { flexDirection: 'row', gap: spacing.xs },
  coordinate: { flex: 1, gap: spacing.xxs },
  coordinateLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 9 },
  coordinateValue: { color: '#FFFFFF', fontSize: 13, fontVariant: ['tabular-nums'] },
  section: { gap: spacing.sm },
  sectionCard: { borderRadius: radius.card, borderCurve: 'continuous', padding: spacing.md, gap: spacing.sm },
  presetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  action: { minHeight: 46, minWidth: 126, flexGrow: 1, borderRadius: radius.md, borderCurve: 'continuous', paddingHorizontal: spacing.md, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: spacing.xs },
  infoRow: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  infoValue: { flex: 1, textAlign: 'right' },
  visitRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xxs },
  visitIcon: { width: 38, height: 38, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  visitCopy: { flex: 1, gap: 2 },
  error: { borderRadius: radius.md, padding: spacing.md, flexDirection: 'row', gap: spacing.xs },
  errorCopy: { flex: 1 },
});
