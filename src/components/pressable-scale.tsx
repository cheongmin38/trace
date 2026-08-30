import type { PropsWithChildren } from 'react';
import { Pressable } from 'react-native';
import type { PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, { ReduceMotion, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { motion } from '@/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
export function PressableScale({ children, style, onPressIn, onPressOut, ...props }: PropsWithChildren<PressableProps & { style?: StyleProp<ViewStyle> }>) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));
  return (
    <AnimatedPressable
      {...props}
      pressRetentionOffset={props.pressRetentionOffset ?? 16}
      onPressIn={(event) => {
        scale.set(withTiming(0.97, { duration: motion.press, reduceMotion: ReduceMotion.System }));
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        scale.set(withTiming(1, { duration: motion.press, reduceMotion: ReduceMotion.System }));
        onPressOut?.(event);
      }}
      style={[animatedStyle, style]}
    >
      {children}
    </AnimatedPressable>
  );
}
