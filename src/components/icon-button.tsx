import Ionicons from '@expo/vector-icons/Ionicons';
import { PressableScale } from '@/components/pressable-scale';
import { radius, shadow, useTraceTheme } from '@/theme';

export function IconButton({ name, label, onPress, filled = false }: { name: keyof typeof Ionicons.glyphMap; label: string; onPress?: () => void; filled?: boolean }) {
  const { colors } = useTraceTheme();
  return <PressableScale accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={8} style={{ width: 44, height: 44, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: filled ? colors.surface : 'transparent', boxShadow: filled ? shadow.card : undefined }}><Ionicons name={name} size={22} color={colors.text} /></PressableScale>;
}
