import type { Photo, Place, Visit } from '@/types/trace';
import { distanceInMeters } from '@/utils/geo';

export type PhotoMatcherOptions = {
  maximumDistanceMeters: number;
  timeBufferMinutes: number;
  maximumPhotos: number;
  minimumConfidence: number;
  includeScreenshots: boolean;
  excludedPhotoIds: ReadonlySet<string>;
};

export type ScoredPhoto = {
  photo: Photo;
  confidence: number;
  timeScore: number;
  locationScore: number | null;
  capturedDuringVisit: boolean;
  distanceMeters: number | null;
};

const defaults: PhotoMatcherOptions = {
  maximumDistanceMeters: 250,
  timeBufferMinutes: 10,
  maximumPhotos: 12,
  minimumConfidence: 40,
  includeScreenshots: false,
  excludedPhotoIds: new Set<string>(),
};

const clamp = (value: number, minimum = 0, maximum = 100) => Math.min(maximum, Math.max(minimum, value));
const photoKey = (photo: Photo) => photo.assetId ?? photo.id;

function calculateTimeScore(takenAt: number, visitStart: number, visitEnd: number, bufferMs: number): number {
  if (takenAt >= visitStart && takenAt <= visitEnd) {
    const duration = Math.max(1, visitEnd - visitStart);
    const midpointDistance = Math.abs(takenAt - (visitStart + duration / 2));
    return clamp(100 - midpointDistance / (duration / 2) * 10, 90, 100);
  }
  const outsideDistance = takenAt < visitStart ? visitStart - takenAt : takenAt - visitEnd;
  return clamp(70 * (1 - outsideDistance / Math.max(1, bufferMs)));
}

export function scorePhotoForVisit(
  visit: Visit,
  place: Place,
  photo: Photo,
  options: Partial<PhotoMatcherOptions> = {},
): ScoredPhoto | null {
  if (!visit.endedAt) return null;
  const settings = { ...defaults, ...options };
  const visitStart = new Date(visit.startedAt).getTime();
  const visitEnd = new Date(visit.endedAt).getTime();
  const takenAt = new Date(photo.takenAt).getTime();
  const bufferMs = settings.timeBufferMinutes * 60_000;

  if (!Number.isFinite(takenAt) || takenAt < visitStart - bufferMs || takenAt > visitEnd + bufferMs) return null;
  if (!settings.includeScreenshots && photo.isScreenshot) return null;
  if (settings.excludedPhotoIds.has(photoKey(photo)) || settings.excludedPhotoIds.has(photo.id)) return null;

  const capturedDuringVisit = takenAt >= visitStart && takenAt <= visitEnd;
  const timeScore = calculateTimeScore(takenAt, visitStart, visitEnd, bufferMs);
  const distanceMeters = photo.location
    ? Math.min(
      distanceInMeters(photo.location, visit.location),
      distanceInMeters(photo.location, place.location),
    )
    : null;
  if (distanceMeters !== null && distanceMeters > settings.maximumDistanceMeters) return null;

  const locationScore = distanceMeters === null
    ? null
    : clamp(100 - distanceMeters / settings.maximumDistanceMeters * 55, 45, 100);
  const confidence = clamp(
    timeScore * 0.45
      + (locationScore ?? 45) * 0.35
      + (capturedDuringVisit ? 100 : 0) * 0.2,
  );
  return confidence >= settings.minimumConfidence
    ? { photo, confidence, timeScore, locationScore, capturedDuringVisit, distanceMeters }
    : null;
}

export function matchPhotosToVisit(
  visit: Visit,
  place: Place,
  photos: Photo[],
  options: Partial<PhotoMatcherOptions> = {},
): Photo[] {
  if (!visit.endedAt) return [];
  const settings = { ...defaults, ...options };
  const bestByPhoto = new Map<string, ScoredPhoto>();

  photos.forEach((photo) => {
    const scored = scorePhotoForVisit(visit, place, photo, settings);
    if (!scored) return;
    const key = photoKey(photo);
    const previous = bestByPhoto.get(key);
    if (!previous || scored.confidence > previous.confidence) bestByPhoto.set(key, scored);
  });

  return [...bestByPhoto.values()]
    .sort((left, right) => right.confidence - left.confidence)
    .slice(0, settings.maximumPhotos)
    .map(({ photo, confidence, timeScore, locationScore, capturedDuringVisit, distanceMeters }) => ({
      ...photo,
      match: {
        confidence: Math.round(confidence),
        timeScore: Math.round(timeScore),
        locationScore: locationScore === null ? null : Math.round(locationScore),
        capturedDuringVisit,
        distanceMeters: distanceMeters === null ? null : Math.round(distanceMeters),
        matchedAt: new Date().toISOString(),
      },
    }))
    .sort((left, right) => new Date(left.takenAt).getTime() - new Date(right.takenAt).getTime());
}
