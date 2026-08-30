import { useEffect, useState } from 'react';
import type { TextProps } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { ThemedText } from '@/components/themed-text';
import type { typography } from '@/theme';

export function CountUpText({ value, variant = 'title', ...props }: Omit<TextProps, 'children'> & { value: number; variant?: keyof typeof typography }) {
  const reducedMotion = useReducedMotion();
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (reducedMotion) return;

    const startedAt = Date.now();
    const duration = 520;
    let frame = 0;
    const tick = () => {
      const progress = Math.min(1, (Date.now() - startedAt) / duration);
      setDisplay(Math.round(value * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [reducedMotion, value]);

  const visibleValue = reducedMotion ? value : display;
  return <ThemedText {...props} variant={variant}>{visibleValue.toLocaleString('ko-KR')}</ThemedText>;
}
