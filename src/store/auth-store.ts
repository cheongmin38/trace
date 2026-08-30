import { create } from 'zustand';
import { authService, getOnboardingMetadata, isSupabaseConfigured, saveOnboardingMetadata, subscribeToAuthChanges, type AuthProvider } from '@/services/auth-service';
import type { User } from '@/types/trace';

type Credentials = { email: string; password: string };

type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authInitialized: boolean;
  hasSeenWelcome: boolean;
  onboardingCompleted: boolean;
  error: string | null;
  signIn: (provider: AuthProvider, credentials?: Credentials) => Promise<User>;
  signUp: (credentials: Credentials) => Promise<User>;
  signOut: () => Promise<void>;
  restoreSession: () => Promise<void>;
  clearUser: () => void;
  clearError: () => void;
  markWelcomeSeen: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  authInitialized: false,
  hasSeenWelcome: false,
  onboardingCompleted: false,
  error: null,

  signIn: async (provider, credentials) => {
    set({ isLoading: true, error: null });
    try {
      const user = provider === 'apple'
        ? await authService.signInWithApple()
        : provider === 'google'
          ? await authService.signInWithGoogle()
          : await authService.signInWithEmail(credentials?.email ?? '', credentials?.password ?? '');
      set({ user, isAuthenticated: true, isLoading: false });
      return user;
    } catch (error) {
      const message = error instanceof Error ? error.message : '로그인 중 문제가 발생했어요.';
      set({ isLoading: false, error: message });
      throw error;
    }
  },
  signUp: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const user = await authService.signUpWithEmail(credentials.email, credentials.password);
      set({ user, isAuthenticated: true, isLoading: false });
      return user;
    } catch (error) {
      const message = error instanceof Error ? error.message : '회원가입 중 문제가 발생했어요.';
      set({ isLoading: false, error: message });
      throw error;
    }
  },
  signOut: async () => {
    set({ isLoading: true, error: null });
    try { await authService.signOut(); } catch (error) { console.error('Trace sign out failed', error); }
    set({ user: null, isAuthenticated: false, isLoading: false });
  },
  restoreSession: async () => {
    if (get().authInitialized) return;
    set({ isLoading: true, error: null });
    try {
      const [user, metadata] = await Promise.all([authService.restoreSession(), getOnboardingMetadata()]);
      set({ user, isAuthenticated: Boolean(user), hasSeenWelcome: metadata.hasSeenWelcome, onboardingCompleted: metadata.onboardingCompleted, isLoading: false, authInitialized: true });
      if (isSupabaseConfigured) subscribeToAuthChanges((nextUser) => set({ user: nextUser, isAuthenticated: Boolean(nextUser) }));
    } catch (error) {
      console.error('Trace session initialization failed', error);
      set({ user: null, isAuthenticated: false, isLoading: false, authInitialized: true, error: '로그인 상태를 불러오지 못했어요.' });
    }
  },
  clearUser: () => set({ user: null, isAuthenticated: false }),
  clearError: () => set({ error: null }),
  markWelcomeSeen: async () => {
    const metadata = { hasSeenWelcome: true, onboardingCompleted: get().onboardingCompleted };
    set(metadata);
    await saveOnboardingMetadata(metadata);
  },
  completeOnboarding: async () => {
    const metadata = { hasSeenWelcome: true, onboardingCompleted: true };
    set(metadata);
    await saveOnboardingMetadata(metadata);
  },
}));
