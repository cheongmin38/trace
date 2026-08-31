import type { PropsWithChildren } from 'react';
import { Pressable } from 'react-native';
import type { PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, { ReduceMotion, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
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
        scale.set(withSpring(0.965, { duration: motion.press, dampingRatio: 0.82, reduceMotion: ReduceMotion.System }));
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        scale.set(withSpring(1, { duration: motion.press, dampingRatio: 0.86, reduceMotion: ReduceMotion.System }));
        onPressOut?.(event);
      }}
      style={[animatedStyle, style]}
    >
      {children}
    </AnimatedPressable>
  );
}
