import type { TextStyle } from 'react-native';
import { useColorScheme } from 'react-native';
import { useAppStore } from '@/store/app-store';

export const spacing = { xxs: 4, xs: 8, sm: 12, md: 16, ml: 20, lg: 24, xl: 32, xxl: 40, xxxl: 48 } as const;
export const radius = { sm: 10, md: 14, card: 20, lg: 28, full: 999 } as const;
export const shadow = {
  soft: '0 1px 10px rgba(37, 30, 24, 0.05)',
  card: '0 8px 24px rgba(37, 30, 24, 0.07)',
  raised: '0 16px 38px rgba(28, 22, 18, 0.15)',
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
  light: { background: '#F8F6F2', surface: '#FFFFFF', surfaceMuted: '#F0EEEA', surfaceElevated: '#FEFDFC', text: '#1D1A17', secondaryText: '#756F69', tertiaryText: '#AAA39C', border: '#E8E2DB', accent: '#1D1A17', accentSoft: '#EEEAE5', onAccent: '#FFFFFF', warm: '#C17052', warmSoft: '#F7E8E0', lavender: '#E9E8FA', ivory: '#F7F0E6', success: '#4D7C65', map: '#E7E9E2', mapLine: '#CED6CB', journey: '#24211F', journeyText: '#FFFFFF', scrim: 'rgba(23,18,14,0.34)' },
  dark: { background: '#0D0D0D', surface: '#171717', surfaceMuted: '#222220', surfaceElevated: '#1D1D1B', text: '#FAFAF8', secondaryText: '#A3A3A0', tertiaryText: '#70706D', border: '#2A2A28', accent: '#F5F5F2', accentSoft: '#292927', onAccent: '#111111', warm: '#DEA088', warmSoft: '#382923', lavender: '#26263B', ivory: '#2E2922', success: '#7CAA91', map: '#20231F', mapLine: '#343934', journey: '#1B1B1A', journeyText: '#FFFFFF', scrim: 'rgba(0,0,0,0.58)' },
} as const;

export type TraceColors = (typeof palettes)['light'];
export function useTraceTheme() {
  const systemScheme = useColorScheme();
  const preference = useAppStore((state) => state.theme);
  const scheme = preference === 'system' ? systemScheme : preference;
  return { colors: palettes[scheme === 'dark' ? 'dark' : 'light'], isDark: scheme === 'dark' };
}
