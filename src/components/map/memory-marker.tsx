import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { ReduceMotion, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { MemoryImage } from '@/components/memory-image';
import { ThemedText } from '@/components/themed-text';
import { motion, radius, shadow, useTraceTheme } from '@/theme';
import type { MapVisitPin } from '@/types/location';

export function MemoryMarker({ pin, selected }: { pin: MapVisitPin; selected: boolean }) {
  const { colors } = useTraceTheme();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.92);

  useEffect(() => {
    scale.set(withSpring(selected ? 1.12 : 1, { duration: 400, dampingRatio: 1, reduceMotion: ReduceMotion.System }));
    opacity.set(withTiming(selected ? 1 : 0.92, { duration: motion.base, reduceMotion: ReduceMotion.System }));
  }, [opacity, scale, selected]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
    opacity: opacity.get(),
  }));

  return (
    <Animated.View style={[styles.root, animatedStyle]}>
      <MemoryImage uri={pin.imageUri} accessibilityLabel={pin.title} style={styles.photo} />
      <View style={[styles.badge, { backgroundColor: colors.accent }]}>
        <ThemedText variant="caption" style={{ color: colors.onAccent }}>{pin.visitCount}</ThemedText>
      </View>
      <View style={[styles.stem, { backgroundColor: colors.accent }]} />
      <View style={[styles.dot, { backgroundColor: colors.accent }]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { width: 68, height: 87, alignItems: 'center' },
  photo: { width: 56, height: 56, borderRadius: radius.full, borderWidth: 2, borderColor: '#FFFFFF', boxShadow: shadow.marker },
  badge: { position: 'absolute', right: 0, top: -1, minWidth: 22, height: 22, paddingHorizontal: 5, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  stem: { width: 1.5, height: 12 },
  dot: { width: 7, height: 7, borderRadius: radius.full, borderWidth: 1.5, borderColor: '#FFFFFF' },
});
