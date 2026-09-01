import type { TextStyle } from 'react-native';
import { useColorScheme } from 'react-native';
import { useAppStore } from '@/store/app-store';

export const spacing = { xxs: 4, xs: 8, sm: 12, md: 16, ml: 20, lg: 24, xl: 32, xxl: 40, xxxl: 48 } as const;
export const radius = { sm: 10, md: 15, card: 22, lg: 30, full: 999 } as const;
export const shadow = {
  soft: '0 2px 14px rgba(30, 42, 58, 0.06)',
  card: '0 10px 28px rgba(30, 42, 58, 0.09)',
  raised: '0 18px 42px rgba(20, 32, 48, 0.16)',
  marker: '0 5px 14px rgba(15, 15, 15, 0.18)',
  tab: '0 -8px 28px rgba(15, 15, 15, 0.055)',
  cta: '0 8px 20px rgba(33, 85, 160, 0.2)',
} as const;
export const motion = { press: 120, base: 240, sheet: 320 } as const;
export const typography = {
  largeTitle: { fontSize: 32, lineHeight: 39, fontWeight: '700', letterSpacing: -0.9, fontFamily: 'System' },
  screenTitle: { fontSize: 30, lineHeight: 36, fontWeight: '700', letterSpacing: -0.8, fontFamily: 'System' },
  title: { fontSize: 21, lineHeight: 27, fontWeight: '700', letterSpacing: -0.45, fontFamily: 'System' },
  headline: { fontSize: 16, lineHeight: 22, fontWeight: '700', letterSpacing: -0.28, fontFamily: 'System' },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400', letterSpacing: -0.12 },
  subhead: { fontSize: 14, lineHeight: 20, fontWeight: '400', letterSpacing: -0.04 },
  caption: { fontSize: 12, lineHeight: 17, fontWeight: '500' },
  tabLabel: { fontSize: 11, lineHeight: 15, fontWeight: '600' },
} as const satisfies Record<string, TextStyle>;

const palettes = {
  light: { background: '#F4F6F8', surface: '#FFFFFF', surfaceMuted: '#EEF1F4', surfaceElevated: '#FFFFFF', text: '#161A22', secondaryText: '#697180', tertiaryText: '#9AA3AF', border: '#E2E6EB', accent: '#3182F6', accentSoft: '#E7F1FF', onAccent: '#FFFFFF', warm: '#D47A62', warmSoft: '#FBE9E4', lavender: '#E8EFFF', ivory: '#FBF7F0', success: '#4F8A71', map: '#E9EDF2', mapLine: '#D2D9E2', journey: '#17253B', journeyText: '#FFFFFF', scrim: 'rgba(16,24,40,0.34)', traceInk: '#121722', traceIvory: '#FBF7F0', traceLavender: '#7C6CF2', aiAccent: '#9B8CFF' },
  dark: { background: '#0D1117', surface: '#171D27', surfaceMuted: '#202936', surfaceElevated: '#1B2430', text: '#F7F9FC', secondaryText: '#A7B0BE', tertiaryText: '#737F8F', border: '#2B3645', accent: '#5B9CFF', accentSoft: '#1E3557', onAccent: '#08111F', warm: '#E0A18D', warmSoft: '#402B32', lavender: '#252E52', ivory: '#332D27', success: '#7DB99E', map: '#151D28', mapLine: '#344152', journey: '#152339', journeyText: '#FFFFFF', scrim: 'rgba(0,0,0,0.62)', traceInk: '#0D1117', traceIvory: '#FBF7F0', traceLavender: '#A99DFF', aiAccent: '#B7ACFF' },
} as const;

export type TraceColors = (typeof palettes)['light'];
export function useTraceTheme() {
  const systemScheme = useColorScheme();
  const preference = useAppStore((state) => state.theme);
  const scheme = preference === 'system' ? systemScheme : preference;
  return { colors: palettes[scheme === 'dark' ? 'dark' : 'light'], isDark: scheme === 'dark' };
}
