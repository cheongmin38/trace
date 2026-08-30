import type { TextStyle } from 'react-native';
import { useColorScheme } from 'react-native';
import { useAppStore } from '@/store/app-store';

export const spacing = { xxs: 4, xs: 8, sm: 12, md: 16, ml: 20, lg: 24, xl: 32, xxl: 40, xxxl: 48 } as const;
export const radius = { sm: 10, md: 14, card: 20, lg: 28, full: 999 } as const;
export const shadow = {
  soft: '0 1px 8px rgba(15, 15, 15, 0.045)',
  card: '0 3px 18px rgba(15, 15, 15, 0.065)',
  raised: '0 12px 32px rgba(15, 15, 15, 0.13)',
  marker: '0 5px 14px rgba(15, 15, 15, 0.18)',
  tab: '0 -8px 28px rgba(15, 15, 15, 0.055)',
  cta: '0 8px 20px rgba(15, 15, 15, 0.12)',
} as const;
export const motion = { press: 120, base: 220, sheet: 300 } as const;
export const typography = {
  largeTitle: { fontSize: 32, lineHeight: 39, fontWeight: '700', letterSpacing: -0.7 },
  screenTitle: { fontSize: 30, lineHeight: 36, fontWeight: '700', letterSpacing: -0.65 },
  title: { fontSize: 21, lineHeight: 27, fontWeight: '700', letterSpacing: -0.35 },
  headline: { fontSize: 17, lineHeight: 23, fontWeight: '600', letterSpacing: -0.15 },
  body: { fontSize: 16, lineHeight: 23, fontWeight: '400', letterSpacing: -0.08 },
  subhead: { fontSize: 14, lineHeight: 20, fontWeight: '400', letterSpacing: -0.04 },
  caption: { fontSize: 12, lineHeight: 17, fontWeight: '500' },
  tabLabel: { fontSize: 11, lineHeight: 15, fontWeight: '600' },
} as const satisfies Record<string, TextStyle>;

const palettes = {
  light: { background: '#F7F7F5', surface: '#FFFFFF', surfaceMuted: '#F0F0ED', surfaceElevated: '#FCFCFA', text: '#171717', secondaryText: '#737373', tertiaryText: '#A0A09C', border: '#E7E7E3', accent: '#111111', accentSoft: '#ECECE8', onAccent: '#FFFFFF', warm: '#B86F52', warmSoft: '#F5E8E1', lavender: '#EAEAF8', ivory: '#F7F3EA', success: '#4D7C65', map: '#E8EAE5', mapLine: '#D2D7D0', journey: '#1D1D1C', journeyText: '#FFFFFF', scrim: 'rgba(8,8,8,0.34)' },
  dark: { background: '#0D0D0D', surface: '#171717', surfaceMuted: '#222220', surfaceElevated: '#1D1D1B', text: '#FAFAF8', secondaryText: '#A3A3A0', tertiaryText: '#70706D', border: '#2A2A28', accent: '#F5F5F2', accentSoft: '#292927', onAccent: '#111111', warm: '#DEA088', warmSoft: '#382923', lavender: '#26263B', ivory: '#2E2922', success: '#7CAA91', map: '#20231F', mapLine: '#343934', journey: '#1B1B1A', journeyText: '#FFFFFF', scrim: 'rgba(0,0,0,0.58)' },
} as const;

export type TraceColors = (typeof palettes)['light'];
export function useTraceTheme() {
  const systemScheme = useColorScheme();
  const preference = useAppStore((state) => state.theme);
  const scheme = preference === 'system' ? systemScheme : preference;
  return { colors: palettes[scheme === 'dark' ? 'dark' : 'light'], isDark: scheme === 'dark' };
}
