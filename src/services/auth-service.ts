import type { User } from '@/types/trace';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
export { isSupabaseConfigured } from '@/lib/supabase';

const SESSION_KEY = 'trace.auth.session';
const ONBOARDING_KEY = 'trace.auth.onboarding';

export type AuthProvider = User['provider'];
export type OnboardingMetadata = { hasSeenWelcome: boolean; onboardingCompleted: boolean };

export class AuthServiceError extends Error {
  constructor(public readonly code: 'INVALID_CREDENTIALS' | 'SESSION_ERROR' | 'EMAIL_CONFIRMATION_REQUIRED' | 'UNKNOWN', message: string) {
    super(message);
    this.name = 'AuthServiceError';
  }
}

function mapSupabaseUser(user: { id: string; email?: string; created_at?: string; app_metadata?: { provider?: string } }): User {
  const provider = user.app_metadata?.provider === 'google' ? 'google' : user.app_metadata?.provider === 'apple' ? 'apple' : 'email';
  return { id: user.id, email: user.email, name: user.email?.split('@')[0] ?? 'Trace 사용자', provider, createdAt: user.created_at ?? new Date().toISOString() };
}

export class SupabaseAuthService implements AuthService {
  async signInWithApple(): Promise<User> { throw new AuthServiceError('UNKNOWN', 'Apple 로그인이 아직 연결되지 않았어요.'); }
  async signInWithGoogle(): Promise<User> { throw new AuthServiceError('UNKNOWN', 'Google 로그인이 아직 연결되지 않았어요.'); }
  async signInWithEmail(email: string, password: string) { if (!supabase) throw new AuthServiceError('UNKNOWN', '인증 서버가 설정되지 않았어요.'); const { data, error } = await supabase.auth.signInWithPassword({ email, password }); if (error || !data.user) throw new AuthServiceError('INVALID_CREDENTIALS', '이메일 또는 비밀번호를 확인해주세요.'); return mapSupabaseUser(data.user); }
  async signUpWithEmail(email: string, password: string) { if (!supabase) throw new AuthServiceError('UNKNOWN', '인증 서버가 설정되지 않았어요.'); const { data, error } = await supabase.auth.signUp({ email, password }); if (error || !data.user) throw new AuthServiceError('UNKNOWN', '회원가입을 완료하지 못했어요.'); if (!data.session) throw new AuthServiceError('EMAIL_CONFIRMATION_REQUIRED', '인증 메일을 보냈어요. 이메일 인증 후 로그인해주세요.'); return mapSupabaseUser(data.user); }
  async signOut() { if (supabase) { const { error } = await supabase.auth.signOut(); if (error) throw new AuthServiceError('UNKNOWN', '로그아웃하지 못했어요.'); } }
  async getCurrentUser() { return this.restoreSession(); }
  async restoreSession() { if (!supabase) return null; const { data, error } = await supabase.auth.getSession(); if (error) throw new AuthServiceError('SESSION_ERROR', '로그인 상태를 불러오지 못했어요.'); return data.session?.user ? mapSupabaseUser(data.session.user) : null; }
}

async function setStoredValue(key: string, value: string) {
  if (process.env.EXPO_OS === 'web') {
    globalThis.localStorage?.setItem(key, value);
    return;
  }
  const SecureStore = await import('expo-secure-store');
  await SecureStore.setItemAsync(key, value);
}

async function getStoredValue(key: string) {
  if (process.env.EXPO_OS === 'web') return globalThis.localStorage?.getItem(key) ?? null;
  const SecureStore = await import('expo-secure-store');
  return SecureStore.getItemAsync(key);
}

async function deleteStoredValue(key: string) {
  if (process.env.EXPO_OS === 'web') {
    globalThis.localStorage?.removeItem(key);
    return;
  }
  const SecureStore = await import('expo-secure-store');
  await SecureStore.deleteItemAsync(key);
}

function createMockUser(provider: AuthProvider, email?: string): User {
  const normalizedEmail = email?.trim().toLocaleLowerCase('en-US');
  return {
    id: `mock-${provider}-${normalizedEmail ?? 'user'}`,
    email: normalizedEmail,
    name: provider === 'apple' ? 'Apple 사용자' : provider === 'google' ? 'Google 사용자' : normalizedEmail?.split('@')[0] ?? 'Trace 사용자',
    provider,
    createdAt: new Date().toISOString(),
  };
}

async function persistUser(user: User) {
  await setStoredValue(SESSION_KEY, JSON.stringify(user));
  return user;
}

export interface AuthService {
  signInWithApple(): Promise<User>;
  signInWithGoogle(): Promise<User>;
  signInWithEmail(email: string, password: string): Promise<User>;
  signUpWithEmail(email: string, password: string): Promise<User>;
  signOut(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
  restoreSession(): Promise<User | null>;
}

export class MockAuthService implements AuthService {
  async signInWithApple() { return persistUser(createMockUser('apple')); }
  async signInWithGoogle() { return persistUser(createMockUser('google', 'trace.user@gmail.com')); }
  async signInWithEmail(email: string, password: string) {
    if (email.trim().toLocaleLowerCase('en-US') === 'error@trace.app' || password === 'wrongpass') {
      throw new AuthServiceError('INVALID_CREDENTIALS', '이메일 또는 비밀번호를 다시 확인해주세요.');
    }
    return persistUser(createMockUser('email', email));
  }
  async signUpWithEmail(email: string, password: string) { void password; return persistUser(createMockUser('email', email)); }
  async signOut() { await deleteStoredValue(SESSION_KEY); }
  async getCurrentUser() { return this.restoreSession(); }
  async restoreSession() {
    try {
      const stored = await getStoredValue(SESSION_KEY);
      return stored ? JSON.parse(stored) as User : null;
    } catch (error) {
      console.error('Unable to restore Trace auth session', error);
      throw new AuthServiceError('SESSION_ERROR', '로그인 상태를 불러오지 못했어요.');
    }
  }
}

export const authService: AuthService = isSupabaseConfigured ? new SupabaseAuthService() : new MockAuthService();

export function subscribeToAuthChanges(callback: (user: User | null) => void) {
  if (!supabase) return { unsubscribe: () => undefined };
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session?.user ? mapSupabaseUser(session.user) : null));
  return data.subscription;
}

export async function resetPasswordForEmail(email: string) {
  if (!supabase) throw new AuthServiceError('UNKNOWN', '비밀번호 재설정은 Supabase 설정 후 사용할 수 있어요.');
  const redirectTo = process.env.EXPO_OS === 'web' ? `${globalThis.location?.origin ?? ''}/auth` : undefined;
  const { error } = await supabase.auth.resetPasswordForEmail(email, redirectTo ? { redirectTo } : undefined);
  if (error) throw new AuthServiceError('UNKNOWN', '비밀번호 재설정 메일을 보내지 못했어요.');
}

export async function signInWithApple() { return authService.signInWithApple(); }
export async function signInWithGoogle() { return authService.signInWithGoogle(); }
export async function signInWithEmail(email: string, password: string) { return authService.signInWithEmail(email, password); }
export async function signUpWithEmail(email: string, password: string) { return authService.signUpWithEmail(email, password); }
export async function signOut() { return authService.signOut(); }
export async function getCurrentUser() { return authService.getCurrentUser(); }
export async function restoreSession() { return authService.restoreSession(); }

export async function getOnboardingMetadata(): Promise<OnboardingMetadata> {
  try {
    const stored = await getStoredValue(ONBOARDING_KEY);
    return stored ? JSON.parse(stored) as OnboardingMetadata : { hasSeenWelcome: false, onboardingCompleted: false };
  } catch (error) {
    console.error('Unable to restore onboarding state', error);
    return { hasSeenWelcome: false, onboardingCompleted: false };
  }
}

export async function saveOnboardingMetadata(metadata: OnboardingMetadata) {
  try {
    await setStoredValue(ONBOARDING_KEY, JSON.stringify(metadata));
  } catch (error) {
    console.error('Unable to persist onboarding state', error);
  }
}
