import Ionicons from '@expo/vector-icons/Ionicons';
import { Host, Switch as ExpoSwitch } from '@expo/ui';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch as NativeSwitch, View } from 'react-native';
import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { openLocationSettings, setBackgroundTrackingEnabled, startLocationTracking, stopLocationTracking } from '@/services/location-service';
import { useAppStore } from '@/store/app-store';
import { useAuthStore } from '@/store/auth-store';
import { useLocationStore } from '@/store/location-store';
import { radius, shadow, spacing, useTraceTheme } from '@/theme';

function SettingSwitch({ label, value, disabled, onValueChange, color }: { label: string; value: boolean; disabled?: boolean; onValueChange: (value: boolean) => void; color: string }) {
  if (Platform.OS === 'web') {
    return <NativeSwitch accessibilityLabel={label} value={value} disabled={disabled} onValueChange={onValueChange} trackColor={{ false: '#3A3F49', true: color }} />;
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
  const backgroundTrackingEnabled = useLocationStore((state) => state.backgroundTrackingEnabled);
  const locationError = useLocationStore((state) => state.trackingError);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [locationPending, setLocationPending] = useState<'tracking' | 'background' | null>(null);

  const permissionLabel = {
    unknown: '확인 중',
    'foreground-granted': '앱 사용 중 허용',
    'background-granted': '항상 허용',
    denied: '권한 꺼짐',
    restricted: '시스템 설정 필요',
    unsupported: '웹에서는 지원하지 않음',
  }[permissionStatus];

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

  const generalRows = [
    { label: '사진 연결', description: '장소와 사진을 자동으로 연결해요', icon: 'images-outline', value: settings.photoMatchingEnabled, set: (value: boolean) => updateSettings({ photoMatchingEnabled: value }) },
    { label: '스크린샷 포함', description: '자동 추억에 스크린샷도 포함해요', icon: 'phone-portrait-outline', value: settings.includeScreenshotsInMemories, set: (value: boolean) => updateSettings({ includeScreenshotsInMemories: value }) },
    { label: '자동 추억 생성', description: '새로운 방문을 하나의 기억으로 정리해요', icon: 'sparkles-outline', value: settings.automaticMemoryEnabled, set: (value: boolean) => updateSettings({ automaticMemoryEnabled: value }) },
    { label: '알림', description: '새로운 기억과 지난 추억을 알려드려요', icon: 'notifications-outline', value: settings.notificationsEnabled, set: (value: boolean) => updateSettings({ notificationsEnabled: value }) },
    { label: '다크 모드', description: '어두운 화면으로 표시해요', icon: 'moon-outline', value: isDark, set: (value: boolean) => setTheme(value ? 'dark' : 'light') },
  ] as const;

  const privacyRows = [
    { label: '집 기록 표시', description: '집으로 분류된 기억을 타임라인에 표시해요', icon: 'home-outline', value: settings.showHomeMemories, set: (value: boolean) => updateSettings({ showHomeMemories: value }) },
    { label: '직장 기록 표시', description: '직장으로 분류된 기억을 타임라인에 표시해요', icon: 'business-outline', value: settings.showWorkMemories, set: (value: boolean) => updateSettings({ showWorkMemories: value }) },
  ] as const;

  return (
    <>
      <Stack.Screen options={{ title: '설정', headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text }} />
      <ScrollView contentInsetAdjustmentBehavior="automatic" style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <ThemedText variant="largeTitle" style={styles.white}>설정</ThemedText>
          <ThemedText variant="subhead" style={styles.muted}>Trace가 기록하는 방식을 관리하세요.</ThemedText>
        </View>

        <SectionTitle title="기록" />
        <View style={[styles.locationCard, { backgroundColor: colors.surface, borderColor: colors.border, boxShadow: shadow.soft }]}>
          <SettingRowHeader icon="navigate-outline" title="위치 기록" description={isTracking ? '자동 기록 중' : '위치 기록 꺼짐'}>
            {locationPending === 'tracking' ? <ActivityIndicator color={colors.aiAccent} /> : <SettingSwitch label="위치 기록" color={colors.traceLavender} value={isTracking} onValueChange={(value) => void toggleTracking(value)} />}
          </SettingRowHeader>
          <View style={styles.divider} />
          <SettingRowHeader icon="radio-outline" title="백그라운드 기록" description="앱을 닫아도 방문을 이어서 기록해요">
            {locationPending === 'background' ? <ActivityIndicator color={colors.aiAccent} /> : <SettingSwitch label="백그라운드 기록" color={colors.traceLavender} value={backgroundTrackingEnabled} disabled={Platform.OS === 'web'} onValueChange={(value) => void toggleBackground(value)} />}
          </SettingRowHeader>
          <View style={styles.permissionRow}><ThemedText variant="caption" style={styles.muted}>권한 상태</ThemedText><ThemedText variant="caption" style={styles.white}>{permissionLabel}</ThemedText></View>
          {locationError ? <ThemedText variant="caption" style={{ color: '#E99A86' }}>{locationError}</ThemedText> : null}
          {permissionStatus === 'denied' || permissionStatus === 'restricted' ? (
            <PressableScale onPress={() => void openLocationSettings()} style={styles.permissionButton}>
              <ThemedText variant="caption" style={styles.white}>시스템 설정 열기</ThemedText><Ionicons name="open-outline" size={15} color={colors.text} />
            </PressableScale>
          ) : null}
        </View>

        <SettingsGroup rows={generalRows} />

        {theme !== 'system' ? <PressableScale onPress={() => setTheme('system')} style={styles.systemTheme}><Ionicons name="contrast-outline" size={16} color="#9A9EA8" /><ThemedText variant="caption" style={styles.muted}>시스템 테마 사용</ThemedText></PressableScale> : null}

        <SectionTitle title="개인정보 보호" />
        <SettingsGroup rows={privacyRows} />

        <PressableScale onPress={() => router.push('/premium')} style={[styles.plusCard, { backgroundColor: colors.lavender, borderColor: colors.traceLavender }]}>
          <View style={styles.plusCopy}><ThemedText variant="headline" style={styles.white}>Trace Premium</ThemedText><ThemedText variant="caption" style={styles.muted}>더 많은 기록과 안전한 보관을 만나보세요.</ThemedText></View>
          <Ionicons name="sparkles" size={20} color={colors.aiAccent} />
        </PressableScale>

        <SectionTitle title="지원" />
        <View style={styles.group}>
          {['개인정보 처리방침', '이용약관', '앱 버전 1.0.0'].map((label, index, labels) => (
            <PressableScale key={label} onPress={() => Alert.alert(label, label === '앱 버전 1.0.0' ? 'Trace 1.0.0 · Expo SDK 56' : '출시 전 공식 문서 주소가 연결될 예정입니다.')} style={[styles.infoRow, index < labels.length - 1 && styles.rowBorder]}>
              <ThemedText variant="body" style={styles.white}>{label}</ThemedText><Ionicons name="chevron-forward" size={17} color="#6F737D" />
            </PressableScale>
          ))}
        </View>

        <PressableScale onPress={() => setLogoutOpen(true)} style={styles.logout}><Ionicons name="log-out-outline" size={19} color="#E99A86" /><ThemedText variant="headline" style={{ color: '#E99A86' }}>로그아웃</ThemedText></PressableScale>
      </ScrollView>

      <Modal visible={logoutOpen} transparent animationType="fade" onRequestClose={() => setLogoutOpen(false)}>
        <View style={styles.modalScrim}>
          <Pressable accessibilityLabel="로그아웃 취소" style={StyleSheet.absoluteFill} onPress={() => setLogoutOpen(false)} />
          <View style={styles.modalCard}>
            <View style={styles.modalCopy}><ThemedText variant="title">로그아웃할까요?</ThemedText><ThemedText variant="body" style={{ color: colors.secondaryText }}>기기에 저장된 방문 기록은 그대로 유지돼요.</ThemedText></View>
            <View style={styles.modalActions}>
              <PressableScale onPress={() => setLogoutOpen(false)} style={[styles.modalButton, { backgroundColor: colors.surfaceMuted }]}><ThemedText variant="headline">취소</ThemedText></PressableScale>
              <PressableScale onPress={() => { setLogoutOpen(false); void signOut(); }} style={[styles.modalButton, { backgroundColor: colors.text }]}><ThemedText variant="headline" style={{ color: colors.onAccent }}>로그아웃</ThemedText></PressableScale>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <ThemedText variant="headline" style={styles.white}>{title}</ThemedText>;
}

function SettingRowHeader({ icon, title, description, children }: { icon: keyof typeof Ionicons.glyphMap; title: string; description: string; children: React.ReactNode }) {
  const { colors } = useTraceTheme();
  return <View style={styles.settingRow}><View style={styles.leading}><View style={[styles.rowIcon, { backgroundColor: colors.surfaceMuted }]}><Ionicons name={icon} size={19} color={colors.text} /></View><View style={styles.rowCopy}><ThemedText variant="body" style={styles.white}>{title}</ThemedText><ThemedText variant="caption" style={styles.muted}>{description}</ThemedText></View></View>{children}</View>;
}

function SettingsGroup({ rows }: { rows: readonly { label: string; description: string; icon: keyof typeof Ionicons.glyphMap; value: boolean; set: (value: boolean) => void }[] }) {
  const { colors } = useTraceTheme();
  return <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }]}>{rows.map((row, index) => <View key={row.label} style={[styles.settingRow, index < rows.length - 1 && styles.rowBorder]}><View style={styles.leading}><View style={[styles.rowIcon, { backgroundColor: colors.surfaceMuted }]}><Ionicons name={row.icon} size={19} color={colors.text} /></View><View style={styles.rowCopy}><ThemedText variant="body" style={styles.white}>{row.label}</ThemedText><ThemedText variant="caption" style={styles.muted}>{row.description}</ThemedText></View></View><SettingSwitch label={row.label} color={colors.traceLavender} value={row.value} onValueChange={row.set} /></View>)}</View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8F6F2' },
  content: { flexGrow: 1, padding: spacing.ml, paddingBottom: spacing.xxxl, gap: spacing.md },
  header: { gap: spacing.xxs, paddingBottom: spacing.sm },
  white: {},
  muted: {},
  locationCard: { borderRadius: radius.card, borderCurve: 'continuous', padding: spacing.md, gap: spacing.sm, borderWidth: StyleSheet.hairlineWidth },
  group: { borderRadius: radius.card, borderCurve: 'continuous', paddingHorizontal: spacing.md, overflow: 'hidden', backgroundColor: '#FFFFFF', borderWidth: StyleSheet.hairlineWidth, borderColor: '#E8E2DB' },
  settingRow: { minHeight: 70, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  leading: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rowIcon: { width: 36, height: 36, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0EEEA' },
  rowCopy: { flex: 1, gap: 2 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#E8E2DB' },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E8E2DB' },
  permissionRow: { minHeight: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  permissionButton: { minHeight: 42, borderRadius: radius.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, backgroundColor: '#F0EEEA' },
  systemTheme: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: spacing.xs, alignSelf: 'flex-start' },
  plusCard: { minHeight: 86, flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderRadius: radius.card, borderCurve: 'continuous', padding: spacing.md, borderWidth: StyleSheet.hairlineWidth },
  plusCopy: { flex: 1, gap: spacing.xxs },
  infoRow: { minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logout: { minHeight: 54, borderRadius: radius.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, backgroundColor: '#FFFFFF', borderWidth: StyleSheet.hairlineWidth, borderColor: '#E8E2DB' },
  modalScrim: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.ml, backgroundColor: 'rgba(0,0,0,0.58)' },
  modalCard: { width: '100%', maxWidth: 420, borderRadius: radius.card, borderCurve: 'continuous', padding: spacing.ml, gap: spacing.lg, backgroundColor: '#FBF7F0', boxShadow: shadow.raised },
  modalCopy: { gap: spacing.xs },
  modalActions: { flexDirection: 'row', gap: spacing.xs },
  modalButton: { flex: 1, minHeight: 50, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
});
