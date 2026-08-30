import Ionicons from '@expo/vector-icons/Ionicons';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, ReduceMotion, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { radius, spacing, useTraceTheme } from '@/theme';
import type { TimelineFilter } from '@/types/archive';

const options: { value: TimelineFilter; label: string }[] = [
  { value: 'ALL', label: '전체' },
  { value: 'RECENT_7_DAYS', label: '최근 7일' },
  { value: 'RECENT_30_DAYS', label: '최근 30일' },
  { value: 'WITH_PHOTOS', label: '사진이 있는 기록' },
  { value: 'FREQUENT_PLACES', label: '자주 방문한 장소' },
];

export function FilterSheet({ visible, selected, onSelect, onClose }: { visible: boolean; selected: TimelineFilter; onSelect: (value: TimelineFilter) => void; onClose: () => void }) {
  const { colors } = useTraceTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View entering={FadeIn.duration(160).reduceMotion(ReduceMotion.System)} style={[styles.scrim, { backgroundColor: colors.scrim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="필터 닫기" />
        <Animated.View
          entering={SlideInDown.springify().damping(22).stiffness(220).reduceMotion(ReduceMotion.System)}
          exiting={SlideOutDown.duration(180).reduceMotion(ReduceMotion.System)}
          style={[styles.sheet, { backgroundColor: colors.surface, paddingBottom: Math.max(spacing.xl, insets.bottom + spacing.md) }]}
        >
          <View style={[styles.grabber, { backgroundColor: colors.border }]} />
          <ThemedText variant="title">기록 보기</ThemedText>
          <View style={styles.options}>
            {options.map((option) => (
              <PressableScale
                key={option.value}
                accessibilityRole="radio"
                accessibilityLabel={option.label}
                accessibilityState={{ checked: selected === option.value }}
                onPress={() => { onSelect(option.value); onClose(); }}
                style={styles.row}
              >
                <ThemedText variant="body">{option.label}</ThemedText>
                {selected === option.value ? <Ionicons name="checkmark-circle" size={22} color={colors.text} /> : <View style={[styles.unchecked, { borderColor: colors.border }]} />}
              </PressableScale>
            ))}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, justifyContent: 'flex-end' },
  sheet: { paddingHorizontal: spacing.ml, paddingTop: spacing.sm, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, gap: spacing.sm },
  grabber: { width: 38, height: 4, borderRadius: radius.full, alignSelf: 'center', marginBottom: spacing.sm },
  options: { gap: spacing.xxs },
  row: { minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  unchecked: { width: 20, height: 20, borderRadius: radius.full, borderWidth: 1.5 },
});
