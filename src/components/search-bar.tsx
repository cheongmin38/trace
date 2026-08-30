import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, TextInput, View } from 'react-native';
import { PressableScale } from '@/components/pressable-scale';
import { radius, spacing, typography, useTraceTheme } from '@/theme';

export function SearchBar({ value, onChangeText, onClose }: { value: string; onChangeText: (value: string) => void; onClose: () => void }) {
  const { colors } = useTraceTheme();
  return (
    <View style={[styles.root, { backgroundColor: colors.surfaceMuted }]}>
      <Ionicons name="search" size={19} color={colors.secondaryText} />
      <TextInput value={value} onChangeText={onChangeText} placeholder="장소 이름으로 검색" placeholderTextColor={colors.tertiaryText} autoFocus returnKeyType="search" style={[styles.input, typography.subhead, { color: colors.text }]} />
      <PressableScale onPress={onClose} accessibilityRole="button" accessibilityLabel="검색 닫기" hitSlop={10}>
        <Ionicons name="close-circle" size={21} color={colors.secondaryText} />
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { minHeight: 48, borderRadius: radius.md, borderCurve: 'continuous', flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, gap: spacing.xs },
  input: { flex: 1, paddingVertical: spacing.sm },
});
