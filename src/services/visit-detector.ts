import type { Coordinates, Place, Visit } from '@/types/trace';
import { distanceInMeters } from '@/utils/geo';

export type LocationSample = {
  id: string;
  recordedAt: string;
  location: Coordinates;
};

export type VisitCandidate = Omit<Visit, 'visitNumber' | 'userId'>;

export type VisitDetectorOptions = {
  radiusMeters: number;
  minimumDurationMinutes: number;
  maximumSampleGapMinutes: number;
};

const defaults: VisitDetectorOptions = { radiusMeters: 100, minimumDurationMinutes: 20, maximumSampleGapMinutes: 15 };

function createCandidate(place: Place, samples: LocationSample[], settings: VisitDetectorOptions): VisitCandidate | null {
  if (samples.length < 2) return null;
  const startedAt = samples[0].recordedAt;
  const endedAt = samples.at(-1)!.recordedAt;
  const durationMinutes = Math.floor((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 60_000);
  if (durationMinutes < settings.minimumDurationMinutes) return null;
  return {
    id: `visit-candidate-${place.id}-${new Date(startedAt).getTime()}`,
    placeId: place.id,
    startedAt,
    endedAt,
    durationMinutes,
    location: samples[Math.floor(samples.length / 2)].location,
    source: 'mock',
    createdAt: endedAt,
  };
}

export function detectVisitCandidates(samples: LocationSample[], places: Place[], options: Partial<VisitDetectorOptions> = {}): VisitCandidate[] {
  const settings = { ...defaults, ...options };
  const ordered = [...samples].sort((left, right) => new Date(left.recordedAt).getTime() - new Date(right.recordedAt).getTime());
  return places.flatMap((place) => {
    if (place.category === 'TRANSIT') return [];
    const candidates: VisitCandidate[] = [];
    let sequence: LocationSample[] = [];
    const finishSequence = () => {
      const candidate = createCandidate(place, sequence, settings);
      if (candidate) candidates.push(candidate);
      sequence = [];
    };
    ordered.forEach((sample) => {
      if (distanceInMeters(sample.location, place.location) > settings.radiusMeters) {
        finishSequence();
        return;
      }
      const previous = sequence.at(-1);
      const gapMinutes = previous ? (new Date(sample.recordedAt).getTime() - new Date(previous.recordedAt).getTime()) / 60_000 : 0;
      if (previous && gapMinutes > settings.maximumSampleGapMinutes) finishSequence();
      sequence.push(sample);
    });
    finishSequence();
    return candidates;
  });
}
