import { Image } from 'expo-image';
import type { ImageStyle, StyleProp } from 'react-native';

export function BrandLogo({ size = 84, style }: { size?: number; style?: StyleProp<ImageStyle> }) {
  return <Image source={require('@/assets/brand/trace-logo.png')} contentFit="contain" transition={160} accessibilityLabel="Trace 로고" style={[{ width: size, height: size, borderRadius: size * 0.22 }, style]} />;
}
