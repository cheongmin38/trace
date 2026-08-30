import { placeRepository } from '@/repositories/place-repository';
import { readEngineSnapshot, writeEngineSnapshot } from '@/repositories/local-storage';
import { visitRepository } from '@/repositories/visit-repository';
import { resolvePlace } from '@/services/place-resolution-service';
import type {
  LocationPoint,
  LocationSource,
  VisitDetectionIgnoredReason,
  VisitDetectionResult,
  VisitDetectionSnapshot,
} from '@/types/location';
import type { Place, Visit } from '@/types/trace';
import { calculateDistanceMeters, isValidCoordinates, isWithinRadius } from '@/utils/geo';
import { minutesBetween } from '@/utils/time';

export const VISIT_CONFIG = {
  arrivalRadiusMeters: 100,
  confirmationMinutes: 10,
  exitRadiusMeters: 150,
  minimumAccuracyMeters: 100,
  duplicateVisitCooldownMinutes: 60,
  maximumCandidateSpeedMetersPerSecond: 8,
  maximumRememberedPointAgeMinutes: 30,
} as const;

export type VisitDetectionConfig = typeof VISIT_CONFIG;

function idleSnapshot(timestamp: string, lastPoint: LocationPoint | null = null): VisitDetectionSnapshot {
  return {
    status: 'idle',
    candidate: null,
    confirmedVisitId: null,
    lastPoint,
    updatedAt: timestamp,
  };
}

function ignoredResult(
  snapshot: VisitDetectionSnapshot,
  reason: VisitDetectionIgnoredReason,
): VisitDetectionResult {
  return {
    snapshot,
    matchedPlace: null,
    createdVisit: null,
    updatedVisit: null,
    endedVisit: null,
    ignoredReason: reason,
  };
}

function movementSpeed(point: LocationPoint, previous: LocationPoint | null): number | null {
  if (point.speed !== undefined && point.speed !== null && point.speed >= 0) return point.speed;
  if (!previous) return null;
  const elapsedSeconds = (new Date(point.timestamp).getTime() - new Date(previous.timestamp).getTime()) / 1_000;
  if (elapsedSeconds <= 0) return null;
  return calculateDistanceMeters(previous, point) / elapsedSeconds;
}

function confidenceFor(point: LocationPoint): number {
  if (point.accuracy === undefined) return 0.75;
  return Math.max(0.45, Math.min(0.98, 1 - point.accuracy / 200));
}

async function refreshPlaceMetadata(place: Place): Promise<Place> {
  const trackedVisits = await visitRepository.getVisitsByPlaceId(place.id);
  const chronological = [...trackedVisits].sort(
    (left, right) => new Date(left.startedAt).getTime() - new Date(right.startedAt).getTime(),
  );
  const seed = placeRepository.getSeedPlace(place.id);
  return (await placeRepository.updatePlace(place.id, {
    visitCount: (seed?.visitCount ?? 0) + chronological.length,
    firstVisitedAt: seed?.firstVisitedAt ?? chronological[0]?.startedAt,
    lastVisitedAt: chronological.at(-1)?.startedAt ?? seed?.lastVisitedAt,
  })) ?? place;
}

async function hasActiveCooldown(placeId: string, timestamp: string, minutes: number): Promise<boolean> {
  const visits = await visitRepository.getVisitsByPlaceId(placeId);
  const latestEnded = visits
    .filter((visit) => visit.endedAt)
    .sort((left, right) => new Date(right.endedAt ?? 0).getTime() - new Date(left.endedAt ?? 0).getTime())[0];
  if (!latestEnded?.endedAt) return false;
  return minutesBetween(latestEnded.endedAt, timestamp) < minutes;
}

async function processConfirmedVisit(
  point: LocationPoint,
  snapshot: VisitDetectionSnapshot,
): Promise<VisitDetectionResult> {
  const visit = snapshot.confirmedVisitId
    ? await visitRepository.getVisitById(snapshot.confirmedVisitId)
    : null;
  const place = visit ? await placeRepository.getPlaceById(visit.placeId) : null;
  if (!visit || !place) {
    const next = idleSnapshot(point.timestamp, point);
    await writeEngineSnapshot(next);
    return ignoredResult(next, 'no-nearby-place');
  }

  if (isWithinRadius(point, place.location, VISIT_CONFIG.exitRadiusMeters)) {
    const updatedVisit = await visitRepository.updateVisit(visit.id, {
      durationMinutes: minutesBetween(visit.startedAt, point.timestamp),
      confidence: confidenceFor(point),
    });
    const next: VisitDetectionSnapshot = { ...snapshot, lastPoint: point, updatedAt: point.timestamp };
    await writeEngineSnapshot(next);
    return { snapshot: next, matchedPlace: place, createdVisit: null, updatedVisit, endedVisit: null };
  }

  const endedVisit = await visitRepository.endVisit(visit.id, point.timestamp);
  const updatedPlace = await refreshPlaceMetadata(place);
  const next: VisitDetectionSnapshot = {
    status: 'ended',
    candidate: null,
    confirmedVisitId: null,
    lastPoint: point,
    updatedAt: point.timestamp,
  };
  await writeEngineSnapshot(next);
  return { snapshot: next, matchedPlace: updatedPlace, createdVisit: null, updatedVisit: null, endedVisit };
}

async function processCandidate(
  point: LocationPoint,
  snapshot: VisitDetectionSnapshot,
): Promise<VisitDetectionResult> {
  const candidate = snapshot.candidate;
  const place = candidate ? await placeRepository.getPlaceById(candidate.placeId) : null;
  if (!candidate || !place || !isWithinRadius(point, place.location, VISIT_CONFIG.exitRadiusMeters)) {
    const next = idleSnapshot(point.timestamp, point);
    await writeEngineSnapshot(next);
    return { snapshot: next, matchedPlace: null, createdVisit: null, updatedVisit: null, endedVisit: null };
  }

  const nextCandidate = {
    ...candidate,
    lastInsideAt: point.timestamp,
    sampleCount: candidate.sampleCount + 1,
  };
  const stayedMinutes = minutesBetween(candidate.enteredAt, point.timestamp);
  if (stayedMinutes < VISIT_CONFIG.confirmationMinutes) {
    const next: VisitDetectionSnapshot = {
      ...snapshot,
      candidate: nextCandidate,
      lastPoint: point,
      updatedAt: point.timestamp,
    };
    await writeEngineSnapshot(next);
    return { snapshot: next, matchedPlace: place, createdVisit: null, updatedVisit: null, endedVisit: null };
  }

  if (await hasActiveCooldown(place.id, point.timestamp, VISIT_CONFIG.duplicateVisitCooldownMinutes)) {
    const next = idleSnapshot(point.timestamp, point);
    await writeEngineSnapshot(next);
    return ignoredResult(next, 'cooldown');
  }

  const existingCount = await visitRepository.getVisitCountForPlace(place.id);
  const draft: Visit = {
    id: `tracked-${place.id}-${new Date(candidate.enteredAt).getTime()}`,
    placeId: place.id,
    startedAt: candidate.enteredAt,
    durationMinutes: stayedMinutes,
    visitNumber: existingCount + 1,
    location: place.location,
    source: candidate.source,
    confidence: confidenceFor(point),
    createdAt: point.timestamp,
    memoryIds: [],
  };
  const createdVisit = await visitRepository.createVisit(draft);
  const updatedPlace = await refreshPlaceMetadata(place);
  const next: VisitDetectionSnapshot = {
    status: 'confirmed',
    candidate: nextCandidate,
    confirmedVisitId: createdVisit.id,
    lastPoint: point,
    updatedAt: point.timestamp,
  };
  await writeEngineSnapshot(next);
  return { snapshot: next, matchedPlace: updatedPlace, createdVisit, updatedVisit: null, endedVisit: null };
}

export async function processLocationPoint(
  point: LocationPoint,
  source: LocationSource,
): Promise<VisitDetectionResult> {
  const coordinates = { latitude: point.latitude, longitude: point.longitude };
  let currentSnapshot = await readEngineSnapshot() ?? idleSnapshot(point.timestamp);

  if (!isValidCoordinates(coordinates) || Number.isNaN(new Date(point.timestamp).getTime())) {
    return ignoredResult(currentSnapshot, 'invalid-location');
  }
  if (point.accuracy !== undefined && point.accuracy > VISIT_CONFIG.minimumAccuracyMeters) {
    return ignoredResult(currentSnapshot, 'poor-accuracy');
  }
  if (currentSnapshot.lastPoint && new Date(point.timestamp).getTime() <= new Date(currentSnapshot.lastPoint.timestamp).getTime()) {
    return ignoredResult(currentSnapshot, 'duplicate-event');
  }

  const activeVisit = await visitRepository.getActiveVisit();
  if (activeVisit && currentSnapshot.confirmedVisitId !== activeVisit.id) {
    currentSnapshot = {
      status: 'confirmed',
      candidate: null,
      confirmedVisitId: activeVisit.id,
      lastPoint: currentSnapshot.lastPoint,
      updatedAt: currentSnapshot.updatedAt,
    };
    await writeEngineSnapshot(currentSnapshot);
  }

  const snapshot = currentSnapshot.status === 'ended'
    ? idleSnapshot(point.timestamp, currentSnapshot.lastPoint)
    : currentSnapshot;
  if (snapshot.status === 'confirmed') return processConfirmedVisit(point, snapshot);
  if (snapshot.status === 'candidate') return processCandidate(point, snapshot);

  const speed = movementSpeed(point, snapshot.lastPoint);
  if (speed !== null && speed > VISIT_CONFIG.maximumCandidateSpeedMetersPerSecond) {
    const next = idleSnapshot(point.timestamp, point);
    await writeEngineSnapshot(next);
    return ignoredResult(next, 'moving-too-fast');
  }

  const nearby = await placeRepository.findNearbyPlaces(
    point.latitude,
    point.longitude,
    VISIT_CONFIG.arrivalRadiusMeters,
  );
  let place: Place | null = nearby[0]?.place ?? null;
  if (!place) {
    const resolution = await resolvePlace(point.latitude, point.longitude);
    place = resolution?.place ?? null;
  }
  if (!place || place.category === 'TRANSIT') {
    const next = idleSnapshot(point.timestamp, point);
    await writeEngineSnapshot(next);
    return ignoredResult(next, 'no-nearby-place');
  }

  const next: VisitDetectionSnapshot = {
    status: 'candidate',
    candidate: {
      placeId: place.id,
      enteredAt: point.timestamp,
      lastInsideAt: point.timestamp,
      sampleCount: 1,
      source,
    },
    confirmedVisitId: null,
    lastPoint: point,
    updatedAt: point.timestamp,
  };
  await writeEngineSnapshot(next);
  return { snapshot: next, matchedPlace: place, createdVisit: null, updatedVisit: null, endedVisit: null };
}

export async function resetVisitDetection(timestamp = new Date().toISOString()): Promise<VisitDetectionSnapshot> {
  const snapshot = idleSnapshot(timestamp);
  await writeEngineSnapshot(snapshot);
  return snapshot;
}
