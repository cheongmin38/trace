import type { TextStyle } from 'react-native';
import { useColorScheme } from 'react-native';
import { useAppStore } from '@/store/app-store';

export const spacing = { xxs: 4, xs: 8, sm: 12, md: 16, ml: 20, lg: 24, xl: 32, xxl: 40, xxxl: 48 } as const;
export const radius = { sm: 10, md: 15, card: 22, lg: 30, full: 999 } as const;
export const shadow = {
  soft: '0 2px 14px rgba(37, 30, 24, 0.06)',
  card: '0 10px 28px rgba(37, 30, 24, 0.08)',
  raised: '0 18px 42px rgba(28, 22, 18, 0.17)',
  marker: '0 5px 14px rgba(15, 15, 15, 0.18)',
  tab: '0 -8px 28px rgba(15, 15, 15, 0.055)',
  cta: '0 8px 20px rgba(15, 15, 15, 0.12)',
} as const;
export const motion = { press: 120, base: 240, sheet: 320 } as const;
export const typography = {
  largeTitle: { fontSize: 32, lineHeight: 39, fontWeight: '700', letterSpacing: -0.9, fontFamily: 'System' },
  screenTitle: { fontSize: 30, lineHeight: 36, fontWeight: '700', letterSpacing: -0.8, fontFamily: 'System' },
  title: { fontSize: 21, lineHeight: 27, fontWeight: '700', letterSpacing: -0.45, fontFamily: 'System' },
  headline: { fontSize: 17, lineHeight: 23, fontWeight: '600', letterSpacing: -0.25, fontFamily: 'System' },
  body: { fontSize: 16, lineHeight: 23, fontWeight: '400', letterSpacing: -0.08 },
  subhead: { fontSize: 14, lineHeight: 20, fontWeight: '400', letterSpacing: -0.04 },
  caption: { fontSize: 12, lineHeight: 17, fontWeight: '500' },
  tabLabel: { fontSize: 11, lineHeight: 15, fontWeight: '600' },
} as const satisfies Record<string, TextStyle>;

const palettes = {
  light: { background: '#F7F5FF', surface: '#FFFFFF', surfaceMuted: '#EFEDFA', surfaceElevated: '#FCFBFF', text: '#171525', secondaryText: '#716D82', tertiaryText: '#AAA6B8', border: '#E4E0F0', accent: '#6657D9', accentSoft: '#E9E6FF', onAccent: '#FFFFFF', warm: '#D47A62', warmSoft: '#FBE9E4', lavender: '#E8E4FF', ivory: '#FBF7F0', success: '#4F8A71', map: '#E9E8F2', mapLine: '#D3D0DE', journey: '#26213D', journeyText: '#FFFFFF', scrim: 'rgba(23,18,34,0.34)', traceInk: '#161426', traceIvory: '#FBF7F0', traceLavender: '#8B7DEA', aiAccent: '#B8A9FF' },
  dark: { background: '#0E0D18', surface: '#181726', surfaceMuted: '#242237', surfaceElevated: '#201F31', text: '#F9F8FF', secondaryText: '#AAA6BC', tertiaryText: '#77738D', border: '#302D48', accent: '#A99CF2', accentSoft: '#302B52', onAccent: '#171525', warm: '#E0A18D', warmSoft: '#402B32', lavender: '#302B52', ivory: '#332D27', success: '#7DB99E', map: '#1B1A2B', mapLine: '#39364B', journey: '#282343', journeyText: '#FFFFFF', scrim: 'rgba(0,0,0,0.62)', traceInk: '#0E0D18', traceIvory: '#FBF7F0', traceLavender: '#B2A6FF', aiAccent: '#C1B6FF' },
} as const;

export type TraceColors = (typeof palettes)['light'];
export function useTraceTheme() {
  const systemScheme = useColorScheme();
  const preference = useAppStore((state) => state.theme);
  const scheme = preference === 'system' ? systemScheme : preference;
  return { colors: palettes[scheme === 'dark' ? 'dark' : 'light'], isDark: scheme === 'dark' };
}
