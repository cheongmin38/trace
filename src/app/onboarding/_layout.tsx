import { Stack } from 'expo-router';
import { useAuthStore } from '@/store/auth-store';

export default function OnboardingLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const onboardingCompleted = useAuthStore((state) => state.onboardingCompleted);
  return <Stack screenOptions={{ headerShown: false }}><Stack.Protected guard={!isAuthenticated}><Stack.Screen name="index" /></Stack.Protected><Stack.Protected guard={isAuthenticated && !onboardingCompleted}><Stack.Screen name="permissions" /><Stack.Screen name="location" /><Stack.Screen name="photos" /><Stack.Screen name="ready" /></Stack.Protected></Stack>;
}
