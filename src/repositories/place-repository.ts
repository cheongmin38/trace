import { simulatorPlaces } from '@/data/location-presets';
import { readPersistedPlaces, writePersistedPlaces } from '@/repositories/local-storage';
import { places as demoPlaces } from '@/services/mock-archive';
import type { Place } from '@/types/trace';
import { calculateDistanceMeters, isValidCoordinates } from '@/utils/geo';
import { demoDataEnabled } from '@/config/runtime';

export type NearbyPlace = {
  place: Place;
  distanceMeters: number;
};

export interface PlaceRepository {
  getPlaces(): Promise<Place[]>;
  getPlaceById(id: string): Promise<Place | null>;
  getPlaceByExternalId(providerId: string, externalPlaceId: string): Promise<Place | null>;
  findNearbyPlaces(latitude: number, longitude: number, radiusMeters: number): Promise<NearbyPlace[]>;
  createPlace(place: Place): Promise<Place>;
  createOrReusePlace(place: Place, radiusMeters: number): Promise<Place>;
  updatePlace(id: string, values: Partial<Omit<Place, 'id'>>): Promise<Place | null>;
  renamePlace(id: string, name: string): Promise<Place | null>;
}

const seedPlaces = (demoDataEnabled ? [...demoPlaces, ...simulatorPlaces] : []).filter(
  (place, index, all) => all.findIndex((candidate) => candidate.id === place.id) === index,
);

let mutationQueue: Promise<void> = Promise.resolve();

async function enqueueMutation<T>(operation: () => Promise<T>): Promise<T> {
  const result = mutationQueue.then(operation, operation);
  mutationQueue = result.then(() => undefined, () => undefined);
  return result;
}

function mergePlaces(persisted: Place[]): Place[] {
  const byId = new Map(seedPlaces.map((place) => [place.id, place]));
  persisted.forEach((place) => byId.set(place.id, { ...byId.get(place.id), ...place }));
  return [...byId.values()];
}

function isIdentityProtected(place: Place): boolean {
  return place.isUserNamed === true
    || place.resolutionSource === 'user'
    || place.category === 'HOME'
    || place.category === 'WORK';
}

class LocalPlaceRepository implements PlaceRepository {
  async getPlaces(): Promise<Place[]> {
    return mergePlaces(await readPersistedPlaces());
  }

  async getPlaceById(id: string): Promise<Place | null> {
    return (await this.getPlaces()).find((place) => place.id === id) ?? null;
  }

  async getPlaceByExternalId(providerId: string, externalPlaceId: string): Promise<Place | null> {
    return (await this.getPlaces()).find((place) => place.providerId === providerId
      && place.externalPlaceId === externalPlaceId) ?? null;
  }

  async findNearbyPlaces(latitude: number, longitude: number, radiusMeters: number): Promise<NearbyPlace[]> {
    const origin = { latitude, longitude };
    if (!isValidCoordinates(origin) || !Number.isFinite(radiusMeters) || radiusMeters < 0) return [];
    return (await this.getPlaces())
      .map((place) => ({ place, distanceMeters: calculateDistanceMeters(origin, place.location) }))
      .filter((item) => item.distanceMeters <= radiusMeters && item.place.category !== 'TRANSIT')
      .sort((left, right) => left.distanceMeters - right.distanceMeters);
  }

  async createPlace(place: Place): Promise<Place> {
    if (!place.name.trim() || !isValidCoordinates(place.location)) {
      throw new Error('유효한 장소 이름과 좌표가 필요합니다.');
    }
    return enqueueMutation(async () => {
      const persisted = await readPersistedPlaces();
      if (seedPlaces.some((item) => item.id === place.id) || persisted.some((item) => item.id === place.id)) {
        throw new Error('이미 존재하는 장소입니다.');
      }
      await writePersistedPlaces([...persisted, place]);
      return place;
    });
  }

  async createOrReusePlace(place: Place, radiusMeters: number): Promise<Place> {
    if (!place.name.trim() || !isValidCoordinates(place.location)) {
      throw new Error('유효한 장소 이름과 좌표가 필요합니다.');
    }
    return enqueueMutation(async () => {
      const persisted = await readPersistedPlaces();
      const allPlaces = mergePlaces(persisted);
      const externalMatch = place.providerId && place.externalPlaceId
        ? allPlaces.find((item) => item.providerId === place.providerId
          && item.externalPlaceId === place.externalPlaceId)
        : null;
      if (externalMatch) return externalMatch;

      const nearby = allPlaces
        .map((item) => ({ place: item, distance: calculateDistanceMeters(place.location, item.location) }))
        .filter((item) => item.place.category !== 'TRANSIT' && item.distance <= radiusMeters)
        .sort((left, right) => left.distance - right.distance)[0]?.place;
      if (nearby) return nearby;

      const sameId = allPlaces.find((item) => item.id === place.id);
      if (sameId) return sameId;
      await writePersistedPlaces([...persisted, place]);
      return place;
    });
  }

  async updatePlace(id: string, values: Partial<Omit<Place, 'id'>>): Promise<Place | null> {
    return enqueueMutation(async () => {
      const current = await this.getPlaceById(id);
      if (!current) return null;
      const userInitiatedRename = values.resolutionSource === 'user' || values.isUserNamed === true;
      const protectedValues = isIdentityProtected(current) && !userInitiatedRename
        ? {
          ...values,
          name: current.name,
          category: current.category,
          kind: current.kind,
          resolvedCategory: current.resolvedCategory,
        }
        : values;
      const updated: Place = {
        ...current,
        ...protectedValues,
        id,
        location: protectedValues.location ?? current.location,
      };
      if (!updated.name.trim() || !isValidCoordinates(updated.location)) {
        throw new Error('장소 정보가 올바르지 않습니다.');
      }
      const persisted = await readPersistedPlaces();
      await writePersistedPlaces([...persisted.filter((place) => place.id !== id), updated]);
      return updated;
    });
  }

  async renamePlace(id: string, name: string): Promise<Place | null> {
    const normalizedName = name.trim();
    if (!normalizedName) throw new Error('장소 이름을 입력해주세요.');
    return this.updatePlace(id, {
      name: normalizedName,
      isUserNamed: true,
      resolutionSource: 'user',
      resolvedAt: new Date().toISOString(),
    });
  }

  getSeedPlace(id: string): Place | null {
    return seedPlaces.find((place) => place.id === id) ?? null;
  }
}

export const placeRepository = new LocalPlaceRepository();
