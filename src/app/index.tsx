import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/auth-store';

export default function Index() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasSeenWelcome = useAuthStore((state) => state.hasSeenWelcome);
  const onboardingCompleted = useAuthStore((state) => state.onboardingCompleted);
  if (!isAuthenticated) return <Redirect href={hasSeenWelcome ? '/auth' : '/onboarding'} />;
  if (!onboardingCompleted) return <Redirect href="/onboarding/permissions" />;
  return <Redirect href="/(tabs)/home" />;
}
