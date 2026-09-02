import type { TextStyle } from 'react-native';
import { useColorScheme } from 'react-native';
import { useAppStore } from '@/store/app-store';

export const spacing = { xxs: 4, xs: 8, sm: 12, md: 16, ml: 20, lg: 24, xl: 32, xxl: 40, xxxl: 48 } as const;
export const radius = { sm: 12, md: 14, card: 20, lg: 26, full: 999 } as const;
export const shadow = {
  soft: '0 2px 10px rgba(41, 34, 76, 0.045)',
  card: '0 5px 18px rgba(41, 34, 76, 0.06)',
  raised: '0 10px 24px rgba(41, 34, 76, 0.10)',
  marker: '0 5px 14px rgba(30, 24, 64, 0.16)',
  tab: '0 -3px 12px rgba(31, 25, 61, 0.045)',
  cta: '0 7px 18px rgba(120, 93, 255, 0.20)',
} as const;
export const motion = { press: 120, base: 240, sheet: 320 } as const;
export const typography = {
  largeTitle: { fontSize: 28, lineHeight: 35, fontWeight: '700', letterSpacing: -0.8, fontFamily: 'System' },
  screenTitle: { fontSize: 26, lineHeight: 32, fontWeight: '700', letterSpacing: -0.7, fontFamily: 'System' },
  title: { fontSize: 20, lineHeight: 26, fontWeight: '700', letterSpacing: -0.45, fontFamily: 'System' },
  headline: { fontSize: 16, lineHeight: 22, fontWeight: '700', letterSpacing: -0.25, fontFamily: 'System' },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400', letterSpacing: -0.1 },
  subhead: { fontSize: 14, lineHeight: 20, fontWeight: '400', letterSpacing: -0.04 },
  caption: { fontSize: 12, lineHeight: 17, fontWeight: '500', letterSpacing: -0.02 },
  tabLabel: { fontSize: 11, lineHeight: 15, fontWeight: '600' },
} as const satisfies Record<string, TextStyle>;

const palettes = {
  light: { background: '#FAFAFC', surface: '#FFFFFF', surfaceGlass: '#FFFFFF', surfaceMuted: '#F5F4F9', surfaceElevated: '#FFFFFF', text: '#1B1A21', secondaryText: '#777780', tertiaryText: '#A6A5AF', border: '#EAE9F0', accent: '#7B5CFA', accentSoft: '#F0ECFF', onAccent: '#FFFFFF', warm: '#D77E65', warmSoft: '#FFF0EB', lavender: '#F6F2FF', ivory: '#FCFAF7', success: '#57A986', map: '#F0EFF6', mapLine: '#DDD9E9', journey: '#252139', journeyText: '#FFFFFF', scrim: 'rgba(23,18,34,0.34)', traceInk: '#1B172C', traceIvory: '#FCFAF7', traceLavender: '#8B73F6', aiAccent: '#9A82FF' },
  dark: { background: '#0E0D18', surface: '#181726', surfaceGlass: 'rgba(24,23,38,0.82)', surfaceMuted: '#242237', surfaceElevated: '#201F31', text: '#F9F8FF', secondaryText: '#AAA6BC', tertiaryText: '#77738D', border: '#302D48', accent: '#A99CF2', accentSoft: '#302B52', onAccent: '#171525', warm: '#E0A18D', warmSoft: '#402B32', lavender: '#302B52', ivory: '#332D27', success: '#7DB99E', map: '#1B1A2B', mapLine: '#39364B', journey: '#282343', journeyText: '#FFFFFF', scrim: 'rgba(0,0,0,0.62)', traceInk: '#0E0D18', traceIvory: '#FBF7F0', traceLavender: '#B2A6FF', aiAccent: '#C1B6FF' },
} as const;

export type TraceColors = (typeof palettes)['light'];
export function useTraceTheme() {
  const systemScheme = useColorScheme();
  const preference = useAppStore((state) => state.theme);
  const scheme = preference === 'system' ? systemScheme : preference;
  return { colors: palettes[scheme === 'dark' ? 'dark' : 'light'], isDark: scheme === 'dark' };
}
