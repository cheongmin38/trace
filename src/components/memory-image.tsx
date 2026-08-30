import { Image } from 'expo-image';
import { useState } from 'react';
import type { ImageStyle, StyleProp } from 'react-native';

const fallback = require('@/assets/images/splash-icon.png');
const blurhash = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';
export function MemoryImage({ uri, style, accessibilityLabel }: { uri: string; style?: StyleProp<ImageStyle>; accessibilityLabel: string }) {
  const [failed, setFailed] = useState(false);
  return <Image source={failed ? fallback : { uri }} placeholder={{ blurhash }} placeholderContentFit="cover" style={style} contentFit="cover" transition={180} cachePolicy="memory-disk" recyclingKey={uri} accessibilityLabel={accessibilityLabel} onError={(event) => { console.error('Trace image failed to load', uri, event.error); setFailed(true); }} />;
}
