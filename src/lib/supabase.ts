import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
export const isSupabaseConfigured = Boolean(url && anonKey);

const storage = {
  getItem: async (key: string) => process.env.EXPO_OS === 'web' ? globalThis.localStorage?.getItem(key) ?? null : AsyncStorage.getItem(key),
  setItem: async (key: string, value: string) => { if (process.env.EXPO_OS === 'web') globalThis.localStorage?.setItem(key, value); else await AsyncStorage.setItem(key, value); },
  removeItem: async (key: string) => { if (process.env.EXPO_OS === 'web') globalThis.localStorage?.removeItem(key); else await AsyncStorage.removeItem(key); },
};

export const supabase = isSupabaseConfigured ? createClient(url!, anonKey!, { auth: { storage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: process.env.EXPO_OS === 'web' } }) : null;
