import Ionicons from '@expo/vector-icons/Ionicons';
import { Host, Switch as ExpoSwitch } from '@expo/ui';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch as NativeSwitch, View } from 'react-native';
import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import {
  openLocationSettings,
  setBackgroundTrackingEnabled,
  startLocationTracking,
  stopLocationTracking,
} from '@/services/location-service';
import { useAppStore } from '@/store/app-store';
import { useAuthStore } from '@/store/auth-store';
import { useLocationStore } from '@/store/location-store';
import { radius, shadow, spacing, useTraceTheme } from '@/theme';

function LocationSwitch({
  label,
  value,
  disabled,
  onValueChange,
  color,
}: {
  label: string;
  value: boolean;
  disabled?: boolean;
  onValueChange: (value: boolean) => void;
  color: string;
}) {
  if (Platform.OS === 'web') {
    return <NativeSwitch accessibilityLabel={label} value={value} disabled={disabled} onValueChange={onValueChange} trackColor={{ false: '#5E6065', true: color }} />;
  }
  return <Host matchContents seedColor={color}><ExpoSwitch value={value} disabled={disabled} onValueChange={onValueChange} /></Host>;
}

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, isDark } = useTraceTheme();
  const theme = useAppStore((state) => state.theme);
  const setTheme = useAppStore((state) => state.setTheme);
  const settings = useAppStore((state) => state.settings);
  const updateSettings = useAppStore((state) => state.updateSettings);
  const signOut = useAuthStore((state) => state.signOut);
  const permissionStatus = useLocationStore((state) => state.permissionStatus);
  const isTracking = useLocationStore((state) => state.isTracking);
  const lastUpdatedAt = useLocationStore((state) => state.lastUpdatedAt);
  const backgroundTrackingEnabled = useLocationStore((state) => state.backgroundTrackingEnabled);
  const locationError = useLocationStore((state) => state.trackingError);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [locationPending, setLocationPending] = useState<'tracking' | 'background' | null>(null);
  const [settingsOpenedAt] = useState(() => Date.now());

  const toggles = [
    { label: '사진 접근', description: '장소와 사진을 안전하게 연결해요', icon: 'images-outline', value: settings.photoMatchingEnabled, set: (value: boolean) => updateSettings({ photoMatchingEnabled: value }) },
    { label: '스크린샷 포함', description: '자동 추억에 스크린샷도 함께 연결해요', icon: 'phone-portrait-outline', value: settings.includeScreenshotsInMemories, set: (value: boolean) => updateSettings({ includeScreenshotsInMemories: value }) },
    { label: '자동 추억 생성', description: '새로운 방문을 추억으로 정리해요', icon: 'sparkles-outline', value: settings.automaticMemoryEnabled, set: (value: boolean) => updateSettings({ automaticMemoryEnabled: value }) },
    { label: '알림', description: '새로 정리된 추억을 알려드려요', icon: 'notifications-outline', value: settings.notificationsEnabled, set: (value: boolean) => updateSettings({ notificationsEnabled: value }) },
    { label: '다크 모드', description: '어두운 환경에 맞춰 표시해요', icon: 'moon-outline', value: isDark, set: (value: boolean) => setTheme(value ? 'dark' : 'light') },
  ] as const;

  const visibilityToggles = [
    { label: '집 기록 표시', description: '집으로 분류한 기억을 타임라인에 표시해요', icon: 'home-outline', value: settings.showHomeMemories, set: (value: boolean) => updateSettings({ showHomeMemories: value }) },
    { label: '직장 기록 표시', description: '직장으로 분류한 기억을 타임라인에 표시해요', icon: 'business-outline', value: settings.showWorkMemories, set: (value: boolean) => updateSettings({ showWorkMemories: value }) },
  ] as const;

  const permissionLabel = {
    unknown: '확인 중',
    'foreground-granted': '앱 사용 중 허용',
    'background-granted': '항상 허용',
    denied: '권한 꺼짐',
    restricted: '시스템 설정 필요',
    unsupported: '웹 테스트 모드',
  }[permissionStatus];

  const lastRecordLabel = lastUpdatedAt
    ? new Intl.RelativeTimeFormat('ko-KR', { numeric: 'auto' }).format(
      -Math.max(0, Math.round((settingsOpenedAt - new Date(lastUpdatedAt).getTime()) / 60_000)),
      'minute',
    )
    : '아직 기록 없음';

  const toggleTracking = async (enabled: boolean) => {
    setLocationPending('tracking');
    try {
      if (enabled) await startLocationTracking({ backgroundPreferred: backgroundTrackingEnabled });
      else await stopLocationTracking();
      updateSettings({ locationTrackingEnabled: enabled });
    } catch (error) {
      updateSettings({ locationTrackingEnabled: false });
      console.error('Location tracking setting could not be changed', error);
    } finally {
      setLocationPending(null);
    }
  };

  const toggleBackground = async (enabled: boolean) => {
    setLocationPending('background');
    try {
      const status = await setBackgroundTrackingEnabled(enabled);
      if (enabled && status !== 'background-granted' && Platform.OS !== 'web') {
        Alert.alert('백그라운드 위치 권한', '앱을 사용하지 않을 때도 기록하려면 시스템 설정에서 위치 접근을 항상 허용해주세요.');
      }
    } catch (error) {
      console.error('Background location setting could not be changed', error);
    } finally {
      setLocationPending(null);
    }
  };

  const confirmSignOut = async () => {
    setLogoutOpen(false);
    await signOut();
  };

  return (
    <>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={[styles.content, { backgroundColor: colors.background }]}>
        <ThemedText variant="title">기록</ThemedText>
        <View style={[styles.locationCard, { backgroundColor: colors.journey, boxShadow: shadow.raised }]}>
          <View style={styles.locationHeading}>
            <View style={[styles.locationPulse, { backgroundColor: isTracking ? colors.success : colors.tertiaryText }]} />
            <View style={styles.locationHeadingCopy}>
              <ThemedText variant="headline" style={{ color: colors.journeyText }}>위치 기록</ThemedText>
              <ThemedText variant="caption" style={{ color: colors.journeyText, opacity: 0.68 }}>{isTracking ? '자동 기록 중' : '위치 기록 꺼짐'} · {lastRecordLabel}</ThemedText>
            </View>
            {locationPending === 'tracking'
              ? <ActivityIndicator color={colors.journeyText} />
              : <LocationSwitch label="위치 기록 토글" color={colors.success} value={isTracking} onValueChange={(value) => void toggleTracking(value)} />}
          </View>
          <View style={styles.locationDivider} />
          <View style={styles.locationOption}>
            <View style={styles.locationHeadingCopy}>
              <ThemedText variant="body" style={{ color: colors.journeyText }}>백그라운드 위치 기록</ThemedText>
              <ThemedText variant="caption" style={{ color: colors.journeyText, opacity: 0.62 }}>앱을 사용하지 않을 때도 방문을 기록합니다.</ThemedText>
            </View>
            {locationPending === 'background'
              ? <ActivityIndicator color={colors.journeyText} />
              : <LocationSwitch label="백그라운드 위치 기록 토글" color={colors.success} value={backgroundTrackingEnabled} disabled={Platform.OS === 'web'} onValueChange={(value) => void toggleBackground(value)} />}
          </View>
          <View style={styles.permissionRow}>
            <ThemedText variant="caption" style={{ color: colors.journeyText, opacity: 0.68 }}>권한 상태</ThemedText>
            <ThemedText variant="caption" style={{ color: colors.journeyText }}>{permissionLabel}</ThemedText>
          </View>
          {locationError ? <ThemedText variant="caption" style={{ color: colors.warm }}>{locationError}</ThemedText> : null}
          {permissionStatus === 'denied' || permissionStatus === 'restricted' ? <PressableScale accessibilityRole="button" onPress={() => void openLocationSettings()} style={[styles.locationAction, { backgroundColor: colors.surface }]}><ThemedText variant="headline">시스템 설정 열기</ThemedText><Ionicons name="open-outline" size={16} color={colors.text} /></PressableScale> : null}
          {Platform.OS === 'web' && __DEV__ ? <PressableScale accessibilityRole="button" onPress={() => router.push('/dev/location')} style={[styles.locationAction, { backgroundColor: colors.surface }]}><ThemedText variant="headline">테스트 위치 사용</ThemedText><Ionicons name="flask-outline" size={17} color={colors.text} /></PressableScale> : null}
        </View>

        <View style={[styles.group, { backgroundColor: colors.surface, boxShadow: shadow.soft }]}>
          {toggles.map((item, index) => <View key={item.label} style={[styles.row, index < toggles.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}><View style={styles.rowLeading}><View style={[styles.icon, { backgroundColor: colors.surfaceMuted }]}><Ionicons name={item.icon} size={19} color={colors.text} /></View><View style={styles.rowCopy}><ThemedText variant="body">{item.label}</ThemedText><ThemedText variant="caption">{item.description}</ThemedText></View></View><NativeSwitch accessibilityLabel={`${item.label} 토글`} value={item.value} onValueChange={item.set} trackColor={{ false: colors.border, true: colors.success }} /></View>)}
        </View>

        {theme !== 'system' ? <PressableScale onPress={() => setTheme('system')} accessibilityRole="button" style={styles.systemTheme}><Ionicons name="contrast-outline" size={16} color={colors.secondaryText} /><ThemedText variant="caption">시스템 테마로 돌아가기</ThemedText></PressableScale> : null}

        <ThemedText variant="title">개인정보</ThemedText>
        <View style={[styles.group, { backgroundColor: colors.surface, boxShadow: shadow.soft }]}>
          {visibilityToggles.map((item, index) => <View key={item.label} style={[styles.row, index < visibilityToggles.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}><View style={styles.rowLeading}><View style={[styles.icon, { backgroundColor: colors.surfaceMuted }]}><Ionicons name={item.icon} size={19} color={colors.text} /></View><View style={styles.rowCopy}><ThemedText variant="body">{item.label}</ThemedText><ThemedText variant="caption">{item.description}</ThemedText></View></View><NativeSwitch accessibilityLabel={`${item.label} 토글`} value={item.value} onValueChange={item.set} trackColor={{ false: colors.border, true: colors.success }} /></View>)}
        </View>

        <ThemedText variant="title">정보</ThemedText>
        <View style={[styles.group, { backgroundColor: colors.surface, boxShadow: shadow.soft }]}>
          {['개인정보 보호', '이용약관', '앱 버전 1.0.0'].map((label, index, labels) => <PressableScale key={label} accessibilityRole="button" onPress={() => Alert.alert(label, label === '앱 버전 1.0.0' ? 'Trace 1.0.0 · Expo SDK 56' : 'Trace는 사용자의 기록을 기기 중심으로 안전하게 다룹니다.')} style={[styles.infoRow, index < labels.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}><ThemedText variant="body">{label}</ThemedText><Ionicons name="chevron-forward" size={17} color={colors.tertiaryText} /></PressableScale>)}
        </View>

        <PressableScale onPress={() => setLogoutOpen(true)} accessibilityRole="button" style={[styles.logout, { backgroundColor: colors.surface, boxShadow: shadow.soft }]}>
          <Ionicons name="log-out-outline" size={19} color={colors.warm} />
          <ThemedText variant="headline" style={{ color: colors.warm }}>로그아웃</ThemedText>
        </PressableScale>
      </ScrollView>
      <Modal visible={logoutOpen} transparent animationType="fade" onRequestClose={() => setLogoutOpen(false)}>
        <View style={[styles.modalScrim, { backgroundColor: colors.scrim }]}>
          <Pressable accessibilityLabel="로그아웃 취소" style={StyleSheet.absoluteFill} onPress={() => setLogoutOpen(false)} />
          <View style={[styles.modalCard, { backgroundColor: colors.surface, boxShadow: shadow.raised }]}>
            <View style={styles.modalCopy}><ThemedText variant="title">로그아웃할까요?</ThemedText><ThemedText variant="body" style={{ color: colors.secondaryText }}>기기에 저장된 추억과 방문 기록은 그대로 유지돼요.</ThemedText></View>
            <View style={styles.modalActions}>
              <PressableScale accessibilityRole="button" onPress={() => setLogoutOpen(false)} style={[styles.modalButton, { backgroundColor: colors.surfaceMuted }]}><ThemedText variant="headline">취소</ThemedText></PressableScale>
              <PressableScale accessibilityRole="button" onPress={() => void confirmSignOut()} style={[styles.modalButton, { backgroundColor: colors.accent }]}><ThemedText variant="headline" style={{ color: colors.onAccent }}>로그아웃</ThemedText></PressableScale>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, padding: spacing.ml, paddingBottom: spacing.xxl, gap: spacing.md },
  locationCard: { borderRadius: radius.card, borderCurve: 'continuous', padding: spacing.md, gap: spacing.sm },
  locationHeading: { minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  locationHeadingCopy: { flex: 1, gap: 2 },
  locationPulse: { width: 9, height: 9, borderRadius: radius.full },
  locationDivider: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.16)' },
  locationOption: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  permissionRow: { minHeight: 34, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  locationAction: { minHeight: 46, borderRadius: radius.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
  group: { borderRadius: radius.card, borderCurve: 'continuous', overflow: 'hidden', paddingHorizontal: spacing.md },
  row: { minHeight: 76, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  rowLeading: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  icon: { width: 38, height: 38, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  rowCopy: { flex: 1, gap: 2 },
  infoRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  systemTheme: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: spacing.xs, alignSelf: 'flex-start' },
  logout: { minHeight: 56, borderRadius: radius.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
  modalScrim: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.ml },
  modalCard: { width: '100%', maxWidth: 420, borderRadius: radius.card, borderCurve: 'continuous', padding: spacing.ml, gap: spacing.lg },
  modalCopy: { gap: spacing.xs },
  modalActions: { flexDirection: 'row', gap: spacing.xs },
  modalButton: { flex: 1, minHeight: 50, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
});
