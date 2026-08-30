import type { Memory, Photo, Place, ProfileIdentity, Visit } from '@/types/trace';
import { calculateVisitNumber } from '@/utils/visit-number';

const LOCAL_USER_ID = 'local-demo-user';
const image = (id: string, width = 1200) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=82`;
const photoIds = [
  'photo-1495474472287-4d71bcdd2085',
  'photo-1470252649378-9c29740c9fa8',
  'photo-1519501025264-65ba15a82390',
  'photo-1534274988757-a28bf1a57c17',
  'photo-1511818966892-d7d671e672a2',
  'photo-1519671282429-b44660ead0a7',
  'photo-1518005020951-eccb494ad742',
  'photo-1528127269322-539801943592',
  'photo-1500530855697-b586d89ba3ee',
  'photo-1449824913935-59a10b8d2000',
  'photo-1501339847302-ac426a4a7cbb',
  'photo-1511081692775-05d0f180a065',
];

const primaryPlaceSeeds = [
  ['seongsu', '성수동 카페거리', 'PLACE', 'CAFE', '서울 성동구 성수동', 37.5446, 127.0557, 0],
  ['seoulforest', '서울숲', 'PLACE', 'PARK', '서울 성동구 뚝섬로', 37.5444, 127.0374, 9],
  ['hangang', '한강공원', 'PLACE', 'PARK', '서울 영등포구 여의도동', 37.5285, 126.9335, 1],
  ['namsan', '남산서울타워', 'TRAVEL', 'TRAVEL', '서울 용산구 남산공원길', 37.5512, 126.9882, 2],
  ['bukchon', '북촌한옥마을', 'TRAVEL', 'CULTURE', '서울 종로구 북촌로', 37.5826, 126.9831, 3],
  ['jamsil', '잠실한강공원', 'PLACE', 'PARK', '서울 송파구 잠실동', 37.5207, 127.1145, 4],
  ['thehyundai', '더현대 서울', 'PLACE', 'OTHER', '서울 영등포구 여의대로', 37.5259, 126.9284, 5],
  ['euljiro', '을지로', 'PLACE', 'FOOD', '서울 중구 을지로', 37.566, 126.991, 6],
  ['yeonnam', '연남동', 'PLACE', 'CAFE', '서울 마포구 연남동', 37.5663, 126.9227, 8],
  ['gyeongbok', '경복궁', 'TRAVEL', 'CULTURE', '서울 종로구 사직로', 37.5796, 126.977, 7],
] as const;

const tripPlaceSeeds = [
  ['haeundae', '해운대', 'TRAVEL', 'TRAVEL', '부산광역시 해운대구', 35.1587, 129.1604, 10],
  ['gamcheon', '감천문화마을', 'TRAVEL', 'CULTURE', '부산광역시 사하구', 35.0975, 129.0106, 11],
  ['jeju-aewol', '제주 애월', 'TRAVEL', 'TRAVEL', '제주특별자치도 제주시 애월읍', 33.4621, 126.3097, 8],
  ['jeju-seongsan', '성산일출봉', 'TRAVEL', 'TRAVEL', '제주특별자치도 서귀포시 성산읍', 33.4581, 126.9425, 3],
  ['suwon', '수원화성', 'TRAVEL', 'CULTURE', '경기도 수원시 팔달구', 37.287, 127.012, 7],
  ['nami', '남이섬', 'TRAVEL', 'TRAVEL', '강원특별자치도 춘천시 남산면', 37.7914, 127.5262, 1],
] as const;

const placeSeeds = [...primaryPlaceSeeds, ...tripPlaceSeeds] as const;

const basePlaces: Place[] = placeSeeds.map(([id, name, category, kind, address, latitude, longitude, photoIndex]) => ({
  id,
  userId: LOCAL_USER_ID,
  name,
  category,
  kind,
  address,
  location: { latitude, longitude },
  coverPhoto: image(photoIds[photoIndex]),
  visitCount: 0,
  photoCount: 0,
}));

const recurringVisitDrafts: Visit[] = Array.from({ length: 30 }, (_, index) => {
  const place = basePlaces[index % primaryPlaceSeeds.length];
  const startedAt = new Date('2026-08-26T15:30:00+09:00');
  startedAt.setDate(startedAt.getDate() - index * 2);
  const durationMinutes = 42 + (index * 7) % 80;
  return {
    id: `visit-${index + 1}`,
    userId: LOCAL_USER_ID,
    placeId: place.id,
    startedAt: startedAt.toISOString(),
    endedAt: new Date(startedAt.getTime() + durationMinutes * 60_000).toISOString(),
    durationMinutes,
    visitNumber: 0,
    location: place.location,
    source: 'demo',
    createdAt: startedAt.toISOString(),
  };
});

function createVisitDraft(id: string, placeId: string, startedAt: string, durationMinutes: number): Visit {
  const place = basePlaces.find((item) => item.id === placeId)!;
  const start = new Date(startedAt);
  return { id, userId: LOCAL_USER_ID, placeId, startedAt: start.toISOString(), endedAt: new Date(start.getTime() + durationMinutes * 60_000).toISOString(), durationMinutes, visitNumber: 0, location: place.location, source: 'demo', createdAt: start.toISOString() };
}

const specialVisitDrafts: Visit[] = [
  createVisitDraft('visit-history-seoulforest', 'seoulforest', '2025-08-28T13:20:00+09:00', 118),
  createVisitDraft('visit-trip-busan-1', 'haeundae', '2026-05-02T10:00:00+09:00', 240),
  createVisitDraft('visit-trip-busan-2', 'gamcheon', '2026-05-03T11:00:00+09:00', 210),
  createVisitDraft('visit-trip-jeju-1', 'jeju-aewol', '2026-06-10T09:30:00+09:00', 260),
  createVisitDraft('visit-trip-jeju-2', 'jeju-seongsan', '2026-06-11T11:00:00+09:00', 220),
  createVisitDraft('visit-trip-near-1', 'suwon', '2026-07-03T10:20:00+09:00', 230),
  createVisitDraft('visit-trip-near-2', 'nami', '2026-07-04T12:00:00+09:00', 250),
];

const visitDrafts: Visit[] = [...recurringVisitDrafts, ...specialVisitDrafts];

export const visits: Visit[] = visitDrafts.map((visit) => ({ ...visit, visitNumber: calculateVisitNumber(visitDrafts, visit) }));

const notes = [
  '햇살이 오래 머물던 자리에서 천천히 시간을 보냈다.',
  '걷는 동안 마음도 조금 가벼워진 오후.',
  '익숙한 풍경이 오늘은 다르게 보였다.',
  '사진보다 더 오래 남을 것 같은 조용한 순간.',
  '좋아하는 사람과 나눈 다정한 하루.',
];

export const memories: Memory[] = visits.map((visit, index) => {
  const place = basePlaces.find((item) => item.id === visit.placeId)!;
  const photoCount = (index % 8) + 1;
  const startedAt = new Date(visit.startedAt).getTime();
  const photos: Photo[] = Array.from({ length: photoCount }, (_, photoIndex) => ({
    id: `photo-${index + 1}-${photoIndex + 1}`,
    userId: LOCAL_USER_ID,
    uri: image(photoIds[(index + photoIndex) % photoIds.length]),
    takenAt: new Date(startedAt + Math.min((visit.durationMinutes ?? 10) - 2, 8 + photoIndex * 9) * 60_000).toISOString(),
    location: { latitude: place.location.latitude + photoIndex * 0.00002, longitude: place.location.longitude - photoIndex * 0.00002 },
    width: 1600,
    height: 1200,
  }));
  return {
    id: `memory-${index + 1}`,
    userId: LOCAL_USER_ID,
    placeId: place.id,
    visitId: visit.id,
    title: place.name,
    visitNumber: visit.visitNumber,
    startedAt: visit.startedAt,
    endedAt: visit.endedAt ?? visit.startedAt,
    photos,
    location: visit.location,
    summary: notes[index % notes.length],
    createdAt: visit.endedAt ?? visit.startedAt,
    isFavorite: index % 7 === 0,
  };
}).sort((left, right) => new Date(right.startedAt).getTime() - new Date(left.startedAt).getTime());

export const photos: Photo[] = memories.flatMap((memory) => memory.photos);

export const places: Place[] = basePlaces.map((place) => {
  const placeVisits = visits.filter((visit) => visit.placeId === place.id).sort((left, right) => new Date(left.startedAt).getTime() - new Date(right.startedAt).getTime());
  const placePhotos = memories.filter((memory) => memory.placeId === place.id).flatMap((memory) => memory.photos);
  return {
    ...place,
    visitCount: placeVisits.length,
    photoCount: placePhotos.length,
    firstVisitedAt: placeVisits[0]?.startedAt,
    lastVisitedAt: placeVisits.at(-1)?.startedAt,
  };
});

export const profileSummary: ProfileIdentity = { name: 'cmcm', handle: '@trace_user', joinedAt: '2024년 5월', plan: 'Trace Plus' };

export function formatVisitTime(value: string) {
  return new Intl.DateTimeFormat('ko-KR', { hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(value));
}

export function formatVisitDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', { month: '2-digit', day: '2-digit', weekday: 'long' }).format(new Date(value));
}

export function formatFullDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' }).format(new Date(value));
}
