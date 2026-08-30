import type {
  PlaceResolutionCandidate,
  PlaceResolutionContext,
  PlaceResolutionProvider,
} from '@/types/place-resolution';
import type { ResolvedPlaceCategory } from '@/types/trace';

const categoryPatterns: [ResolvedPlaceCategory, RegExp][] = [
  ['cafe', /카페|커피|coffee|cafe|starbucks|스타벅스/i],
  ['restaurant', /식당|레스토랑|음식|restaurant|grill|kitchen|분식|국밥|횟집|치킨/i],
  ['park', /공원|숲|park|forest|garden/i],
  ['shopping', /백화점|쇼핑|마트|mall|department|market/i],
  ['school', /학교|대학교|학원|school|university|college/i],
  ['hotel', /호텔|숙소|리조트|hotel|resort|motel/i],
  ['transit', /역|정류장|터미널|공항|station|terminal|airport/i],
  ['culture', /박물관|미술관|도서관|궁|문화|museum|gallery|library|palace/i],
  ['travel', /타워|전망대|해변|관광|tower|beach|observatory/i],
];

function inferCategory(text: string): ResolvedPlaceCategory {
  return categoryPatterns.find(([, pattern]) => pattern.test(text))?.[0] ?? 'other';
}

function stableHash(value: string): string {
  let hash = 2_166_136_261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return (hash >>> 0).toString(36);
}

function uniqueAddressParts(parts: (string | null)[]): string {
  return [...new Set(parts.map((part) => part?.trim()).filter((part): part is string => Boolean(part)))].join(' ');
}

export class ExpoReverseGeocodingProvider implements PlaceResolutionProvider {
  readonly id = 'expo-reverse-geocoder';

  async resolvePlace(context: PlaceResolutionContext): Promise<PlaceResolutionCandidate[]> {
    if (typeof document !== 'undefined') return [];
    const Location = await import('expo-location');
    const addresses = await Location.reverseGeocodeAsync({
      latitude: context.latitude,
      longitude: context.longitude,
    });

    return addresses.slice(0, 3).map((address) => {
      const composedAddress = address.formattedAddress?.trim() || uniqueAddressParts([
        address.country,
        address.region,
        address.city,
        address.district,
        address.street,
        address.streetNumber,
      ]);
      const placemarkName = address.name?.trim() ?? '';
      const isGenericName = !placemarkName
        || placemarkName === address.streetNumber
        || /^\d+[A-Za-z-]*$/.test(placemarkName);
      const name = isGenericName
        ? address.street?.trim() || address.district?.trim() || address.city?.trim() || '새로운 장소'
        : placemarkName;
      const source = isGenericName ? 'address' as const : 'poi' as const;
      const identity = `${name}|${composedAddress}|${context.latitude.toFixed(5)}|${context.longitude.toFixed(5)}`;
      return {
        name,
        address: composedAddress || '주소 정보 없음',
        category: inferCategory(`${name} ${composedAddress}`),
        latitude: context.latitude,
        longitude: context.longitude,
        externalPlaceId: `placemark-${stableHash(identity)}`,
        confidence: source === 'poi' ? 0.78 : 0.58,
        providerId: this.id,
        source,
      };
    });
  }
}
