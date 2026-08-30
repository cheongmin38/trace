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
  ask: ['sparkles-outline', 'sparkles'],
  profile: ['person-outline', 'person'],
} as const;

function TabIcon({ name, focused, color }: { name: keyof typeof icons; focused: boolean; color: ColorValue }) {
  const scale = useSharedValue(focused ? 1.04 : 1);

  useEffect(() => {
    scale.set(withTiming(focused ? 1.08 : 1, { duration: motion.press, reduceMotion: ReduceMotion.System }));
  }, [focused, scale]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  return (
    <View style={styles.iconSlot}>
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
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.tertiaryText,
        tabBarLabelStyle: typography.tabLabel,
        tabBarItemStyle: styles.item,
        tabBarStyle: [styles.bar, { borderColor: colors.border, boxShadow: shadow.raised }],
        tabBarBackground: () => <BlurView intensity={82} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />,
      }}
    >
      {(['home', 'map', 'timeline', 'ask', 'profile'] as const).map((name) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title: name === 'home' ? '홈' : name === 'map' ? '지도' : name === 'timeline' ? '타임라인' : name === 'ask' ? 'Ask' : '프로필',
            tabBarIcon: ({ focused, color }) => <TabIcon name={name} focused={focused} color={color} />,
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
    overflow: 'hidden',
    backgroundColor: 'transparent',
    paddingTop: 5,
    paddingBottom: 5,
  },
  item: { paddingVertical: 3 },
  iconSlot: { height: 30, alignItems: 'center', justifyContent: 'center', gap: 3 },
  activeDot: { width: 3, height: 3, borderRadius: 999 },
});
