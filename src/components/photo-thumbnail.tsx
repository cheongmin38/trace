import { StyleSheet } from 'react-native';
import { MemoryImage } from '@/components/memory-image';
import { radius } from '@/theme';
export function PhotoThumbnail({ uri, label }: { uri: string; label: string }) { return <MemoryImage uri={uri} accessibilityLabel={label} style={styles.image} />; }
const styles = StyleSheet.create({ image: { width: 68, height: 68, borderRadius: radius.sm, borderCurve: 'continuous' } });
