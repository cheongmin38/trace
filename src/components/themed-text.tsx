import type { TextProps } from 'react-native';
import { Text } from 'react-native';
import { typography, useTraceTheme } from '@/theme';

export function ThemedText({ variant = 'body', style, ...props }: TextProps & { variant?: keyof typeof typography }) {
  const { colors } = useTraceTheme();
  const color = variant === 'subhead' || variant === 'caption' || variant === 'tabLabel' ? colors.secondaryText : colors.text;
  return <Text {...props} style={[typography[variant], { color }, style]} />;
}
