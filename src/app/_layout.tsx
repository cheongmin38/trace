import '@/tasks/location-task';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useReducedMotion } from 'react-native-reanimated';
import { ThemedText } from '@/components/themed-text';
import { BrandLogo } from '@/components/brand-logo';
import { useAuthStore } from '@/store/auth-store';
import { restoreLocationTracking } from '@/services/location-service';
import { synchronizePersistedLocationData } from '@/services/location-pipeline';
import { useLocationStore } from '@/store/location-store';
import { spacing, useTraceTheme } from '@/theme';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { isDark, colors } = useTraceTheme();
  const reducedMotion = useReducedMotion();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const authInitialized = useAuthStore((state) => state.authInitialized);
  const onboardingCompleted = useAuthStore((state) => state.onboardingCompleted);
  const restoreSession = useAuthStore((state) => state.restoreSession);
  const locationInitialized = useLocationStore((state) => state.initialized);

  useEffect(() => { void restoreSession(); }, [restoreSession]);
  useEffect(() => { void restoreLocationTracking(); }, []);
  useEffect(() => { if (authInitialized && isAuthenticated) void synchronizePersistedLocationData(); }, [authInitialized, isAuthenticated]);
  useEffect(() => { if (authInitialized && locationInitialized) void SplashScreen.hideAsync(); }, [authInitialized, locationInitialized]);

  if (!authInitialized || !locationInitialized) {
    return <GestureHandlerRootView style={[styles.root, styles.splash, { backgroundColor: colors.background }]}><BrandLogo size={112} /><ThemedText variant="caption">당신의 순간을 조용히 불러오고 있어요</ThemedText></GestureHandlerRootView>;
  }

  const canEnterApp = isAuthenticated && onboardingCompleted;
  return (
    <GestureHandlerRootView style={[styles.root, process.env.EXPO_OS === 'web' && styles.webRoot]}>
      <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Stack screenOptions={{ headerShown: false, headerShadowVisible: false, headerBackButtonDisplayMode: 'minimal', headerStyle: { backgroundColor: colors.background }, contentStyle: { backgroundColor: colors.background }, animation: reducedMotion ? 'fade' : 'default' }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="auth" options={{ headerShown: false }} />
          <Stack.Screen name="email-login" options={{ title: '이메일 로그인' }} />
          <Stack.Screen name="signup" options={{ title: '회원가입' }} />
          <Stack.Screen name="forgot-password" options={{ title: '비밀번호 찾기' }} />
          <Stack.Protected guard={!isAuthenticated || !onboardingCompleted}>
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          </Stack.Protected>
          <Stack.Protected guard={canEnterApp}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="memory/[id]" options={{ title: '' }} />
            <Stack.Screen name="ask-trace" options={{ title: 'Ask Trace' }} />
            <Stack.Screen name="place/[id]" options={{ title: '' }} />
            <Stack.Screen name="archive" options={{ title: '보관함' }} />
            <Stack.Screen name="places" options={{ title: '나의 장소' }} />
            <Stack.Screen name="review/[year]" options={{ title: '' }} />
            <Stack.Screen name="premium" options={{ title: 'Trace Premium', presentation: 'modal' }} />
            <Stack.Screen name="settings" options={{ title: '설정' }} />
            <Stack.Screen name="dev/location" options={{ title: 'Location Simulator' }} />
            <Stack.Screen name="notifications" options={{ title: '알림' }} />
            <Stack.Screen name="trash" options={{ title: '휴지통' }} />
            <Stack.Screen name="dev/ai-usage" options={{ title: 'AI Usage' }} />
          </Stack.Protected>
        </Stack>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  splash: { alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
  webRoot: { width: '100%', maxWidth: 480, alignSelf: 'center', boxShadow: '0 0 48px rgba(0,0,0,0.08)' },
});
