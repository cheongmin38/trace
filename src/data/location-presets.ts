import type { Place } from '@/types/trace';

const CREATED_AT = '2026-01-01T00:00:00.000Z';

export const simulatorPlaces: Place[] = [
  {
    id: 'tracking-seongsu-cafe',
    name: '성수동 카페',
    category: 'PLACE',
    kind: 'CAFE',
    address: '서울 성동구 연무장길',
    location: { latitude: 37.54655, longitude: 127.05918 },
    coverPhoto: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=82',
    visitCount: 0,
    photoCount: 0,
    createdAt: CREATED_AT,
  },
  {
    id: 'tracking-gangnam-station',
    name: '강남역',
    category: 'TRANSIT',
    kind: 'OTHER',
    address: '서울 강남구 강남대로',
    location: { latitude: 37.49794, longitude: 127.02762 },
    coverPhoto: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1200&q=82',
    visitCount: 0,
    photoCount: 0,
    createdAt: CREATED_AT,
  },
];

export const locationPresetIds = {
  seongsu: 'tracking-seongsu-cafe',
  seoulForest: 'seoulforest',
  hanRiver: 'hangang',
  bukchon: 'bukchon',
  gangnam: 'tracking-gangnam-station',
} as const;
