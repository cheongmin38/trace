import '@/tasks/location-task';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useReducedMotion } from 'react-native-reanimated';
import { BrandLogo } from '@/components/brand-logo';
import { ThemedText } from '@/components/themed-text';
import { restoreLocationTracking } from '@/services/location-service';
import { synchronizePersistedLocationData } from '@/services/location-pipeline';
import { useAuthStore } from '@/store/auth-store';
import { useLocationStore } from '@/store/location-store';
import { shadow, spacing, useTraceTheme } from '@/theme';

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
  useEffect(() => {
    if (authInitialized && isAuthenticated) void synchronizePersistedLocationData();
  }, [authInitialized, isAuthenticated]);
  useEffect(() => {
    if (authInitialized && locationInitialized) void SplashScreen.hideAsync();
  }, [authInitialized, locationInitialized]);

  if (!authInitialized || !locationInitialized) {
    return (
      <GestureHandlerRootView style={[styles.root, styles.splash]}>
        <StatusBar style="dark" />
        <View pointerEvents="none" style={[styles.splashOrb, styles.splashOrbTop]} />
        <View pointerEvents="none" style={[styles.splashOrb, styles.splashOrbBottom]} />
        <View pointerEvents="none" style={styles.splashGlow} />
        <View style={styles.splashContent}>
          <BrandLogo size={148} style={styles.splashLogo} />
          <ThemedText variant="screenTitle" style={styles.splashBrand}>Trace</ThemedText>
          <ThemedText variant="subhead" style={styles.splashCopy}>
            당신의 하루가 모여{`\n`}특별한 추억이 됩니다
          </ThemedText>
        </View>
      </GestureHandlerRootView>
    );
  }

  const canEnterApp = isAuthenticated && onboardingCompleted;

  return (
    <GestureHandlerRootView style={[styles.root, process.env.EXPO_OS === 'web' && styles.webRoot]}>
      <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerShown: false,
            headerShadowVisible: false,
            headerBackButtonDisplayMode: 'minimal',
            headerStyle: { backgroundColor: colors.background },
            contentStyle: { backgroundColor: colors.background },
            animation: reducedMotion ? 'fade' : 'default',
          }}>
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
  splash: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAF9FF',
    overflow: 'hidden',
  },
  splashContent: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    transform: [{ translateY: -14 }],
    zIndex: 1,
  },
  splashLogo: {
    borderRadius: 42,
    boxShadow: shadow.card,
  },
  splashBrand: {
    color: '#201B35',
    fontFamily: 'serif',
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -1.2,
    marginTop: spacing.xs,
  },
  splashCopy: {
    color: '#686278',
    textAlign: 'center',
    lineHeight: 22,
  },
  splashGlow: {
    position: 'absolute',
    width: 336,
    height: 336,
    borderRadius: 999,
    backgroundColor: 'rgba(224, 214, 255, 0.40)',
    top: '26%',
    boxShadow: '0 0 64px 22px rgba(230, 220, 255, 0.50)',
  },
  splashOrb: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(201, 188, 255, 0.34)',
    boxShadow: '0 12px 34px rgba(150, 125, 238, 0.14)',
  },
  splashOrbTop: { width: 74, height: 74, top: '14%', right: -12 },
  splashOrbBottom: { width: 108, height: 108, bottom: '15%', left: -28 },
  webRoot: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    boxShadow: '0 0 48px rgba(0,0,0,0.08)',
  },
});
