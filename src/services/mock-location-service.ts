import { locationPresetIds } from '@/data/location-presets';
import { clearLocationPersistence, readEngineSnapshot } from '@/repositories/local-storage';
import { placeRepository } from '@/repositories/place-repository';
import { processAndSyncLocationPoint } from '@/services/location-pipeline';
import { visitRepository } from '@/repositories/visit-repository';
import { resetVisitDetection } from '@/services/visit-detection-service';
import { useAppStore } from '@/store/app-store';
import { useLocationStore } from '@/store/location-store';
import type { LocationPoint, VisitDetectionResult } from '@/types/location';
import type { Photo, Place } from '@/types/trace';
import { MockClock } from '@/utils/time';

export type MockLocationPreset = {
  id: keyof typeof locationPresetIds;
  label: string;
  placeId: string;
};

export const MOCK_LOCATION_PRESETS: MockLocationPreset[] = [
  { id: 'seongsu', label: '성수동 카페', placeId: locationPresetIds.seongsu },
  { id: 'seoulForest', label: '서울숲', placeId: locationPresetIds.seoulForest },
  { id: 'hanRiver', label: '한강공원', placeId: locationPresetIds.hanRiver },
  { id: 'bukchon', label: '북촌', placeId: locationPresetIds.bukchon },
  { id: 'gangnam', label: '강남', placeId: locationPresetIds.gangnam },
];

class MockLocationService {
  private readonly clock = new MockClock();
  private currentPlaceId: string | null = null;

  private async alignClock(): Promise<void> {
    const snapshot = await readEngineSnapshot();
    const previous = snapshot?.lastPoint ? new Date(snapshot.lastPoint.timestamp).getTime() : 0;
    if (previous > this.clock.now().getTime()) this.clock.set(previous + 60_000);
  }

  private async place(placeId?: string): Promise<Place> {
    const targetId = placeId ?? this.currentPlaceId ?? locationPresetIds.seongsu;
    const place = await placeRepository.getPlaceById(targetId);
    if (!place) throw new Error('테스트 장소를 찾지 못했어요.');
    return place;
  }

  private pointFor(place: Place, values: Partial<LocationPoint> = {}): LocationPoint {
    return {
      latitude: place.location.latitude,
      longitude: place.location.longitude,
      accuracy: 12,
      speed: 0,
      timestamp: this.clock.now().toISOString(),
      ...values,
    };
  }

  async arrive(placeId: string = locationPresetIds.seongsu): Promise<VisitDetectionResult> {
    await this.alignClock();
    this.currentPlaceId = placeId;
    const target = await this.place(placeId);
    useLocationStore.getState().setTracking(true);
    return processAndSyncLocationPoint(this.pointFor(target), 'mock');
  }

  async advanceMinutes(minutes: number): Promise<VisitDetectionResult> {
    await this.alignClock();
    this.clock.advanceMinutes(minutes);
    const target = await this.place();
    return processAndSyncLocationPoint(this.pointFor(target), 'mock');
  }

  async capturePhoto(): Promise<Photo> {
    await this.alignClock();
    const target = await this.place();
    const photo: Photo = {
      id: `mock-capture-${this.clock.now().getTime()}`,
      uri: target.coverPhoto ?? 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=85',
      takenAt: this.clock.now().toISOString(),
      location: target.location,
      width: 1200,
      height: 900,
    };
    const activeVisit = await visitRepository.getActiveVisit();
    if (!activeVisit) throw new Error('방문이 확정된 뒤 테스트 사진을 촬영해주세요.');
    const updatedVisit = await visitRepository.updateVisit(activeVisit.id, {
      mockPhotos: [photo, ...(activeVisit.mockPhotos ?? []).filter((item) => item.id !== photo.id)],
    });
    if (updatedVisit) useAppStore.getState().updateVisit(updatedVisit);
    return photo;
  }

  async leave(): Promise<VisitDetectionResult> {
    await this.alignClock();
    this.clock.advanceMinutes(1);
    const target = await this.place();
    const point = this.pointFor(target, {
      latitude: target.location.latitude + 0.0045,
      longitude: target.location.longitude + 0.0045,
      speed: 2,
    });
    this.currentPlaceId = null;
    return processAndSyncLocationPoint(point, 'mock');
  }

  async revisitAfterCooldown(placeId: string = locationPresetIds.seongsu): Promise<VisitDetectionResult> {
    await this.alignClock();
    this.clock.advanceMinutes(61);
    return this.arrive(placeId);
  }

  async sendPoorAccuracy(): Promise<VisitDetectionResult> {
    await this.alignClock();
    const target = await this.place(locationPresetIds.seongsu);
    return processAndSyncLocationPoint(this.pointFor(target, { accuracy: 450 }), 'mock');
  }

  async passQuickly(): Promise<VisitDetectionResult> {
    await this.alignClock();
    const snapshot = await readEngineSnapshot();
    if (snapshot?.status === 'confirmed') await this.leave();
    await resetVisitDetection(this.clock.now().toISOString());
    this.clock.advanceMinutes(1);
    const target = await this.place(locationPresetIds.seongsu);
    return processAndSyncLocationPoint(this.pointFor(target, { speed: 20 }), 'mock');
  }

  async reset(): Promise<void> {
    await clearLocationPersistence();
    await resetVisitDetection(this.clock.now().toISOString());
    this.currentPlaceId = null;
    useAppStore.getState().resetTrackedData();
    useLocationStore.getState().reset();
    useLocationStore.getState().setInitialized(true);
    useLocationStore.getState().setPermissionStatus('unsupported');
  }
}

export const mockLocationService = new MockLocationService();
