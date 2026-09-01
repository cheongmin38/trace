import Ionicons from '@expo/vector-icons/Ionicons';
import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import type { ColorValue } from 'react-native';
import { StyleSheet, View } from 'react-native';
import Animated, { ReduceMotion, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { motion, shadow, typography, useTraceTheme } from '@/theme';

const icons = {
  home: ['home-outline', 'home'],
  map: ['map-outline', 'map'],
  timeline: ['time-outline', 'time'],
  ask: ['add', 'add'],
  profile: ['person-outline', 'person'],
} as const;

const labels = { home: '홈', map: '지도', timeline: '타임라인', ask: 'Ask', profile: '프로필' } as const;

function TabIcon({ name, focused, color, accent }: { name: keyof typeof icons; focused: boolean; color: ColorValue; accent: ColorValue }) {
  const scale = useSharedValue(focused ? 1.04 : 1);

  useEffect(() => {
    scale.set(withTiming(focused ? 1.08 : 1, { duration: motion.press, reduceMotion: ReduceMotion.System }));
  }, [focused, scale]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  if (name === 'ask') {
    return <View style={[styles.createButton, { backgroundColor: accent, boxShadow: shadow.card }]}><Ionicons name="add" size={25} color="#FFFFFF" /></View>;
  }

  return (
    <View style={styles.iconSlot}>
      <View style={[styles.activePill, { backgroundColor: color, opacity: focused ? 0.12 : 0 }]} />
      <Animated.View style={animatedStyle}>
        <Ionicons name={icons[name][focused ? 1 : 0]} size={focused ? 23 : 22} color={color} />
      </Animated.View>
      <View style={[styles.activeDot, { backgroundColor: focused ? color : 'transparent' }]} />
    </View>
  );
}

export function BottomTabBar() {
  const { colors, isDark } = useTraceTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        animation: 'none',
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: colors.traceLavender,
        tabBarInactiveTintColor: colors.tertiaryText,
        tabBarLabelStyle: typography.tabLabel,
        tabBarItemStyle: styles.item,
        tabBarStyle: [styles.bar, { borderColor: colors.border, backgroundColor: colors.surfaceGlass, boxShadow: shadow.raised }],
        tabBarBackground: () => <BlurView intensity={84} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />,
      }}
    >
      {(Object.keys(labels) as (keyof typeof labels)[]).map((name) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title: labels[name],
            tabBarIcon: ({ focused, color }) => <TabIcon name={name} focused={focused} color={color} accent={colors.accent} />,
          }}
        />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    height: 76,
    left: 12,
    right: 12,
    bottom: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 26,
    borderCurve: 'continuous',
    overflow: 'hidden',
    backgroundColor: 'transparent',
    paddingTop: 5,
    paddingBottom: 5,
  },
  item: { paddingVertical: 3 },
  iconSlot: { height: 32, minWidth: 44, alignItems: 'center', justifyContent: 'center', gap: 2, position: 'relative' },
  createButton: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginTop: -20, borderWidth: 4, borderColor: 'rgba(255,255,255,0.82)' },
  activePill: { position: 'absolute', width: 42, height: 30, borderRadius: 15 },
  activeDot: { width: 3, height: 3, borderRadius: 999 },
});
