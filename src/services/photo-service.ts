import { Platform } from 'react-native';
import { photos as archivePhotos } from '@/services/mock-archive';
import type { Photo } from '@/types/trace';
import { distanceInMeters } from '@/utils/geo';

async function loadMediaLibrary() {
  return import('expo-media-library');
}

export type PhotoLibraryAccess = 'all' | 'limited' | 'none';

export type PhotoSearchResult = {
  photos: Photo[];
  access: PhotoLibraryAccess;
  isComplete: boolean;
};

export interface PhotoService {
  getPhotos(limit?: number): Promise<Photo[]>;
  getPhotosBetween(startDate: string, endDate: string): Promise<Photo[]>;
  searchPhotosBetween(startDate: string, endDate: string): Promise<PhotoSearchResult>;
}

export class PhotoServiceError extends Error {
  constructor(
    public readonly code: 'permission-denied' | 'permission-limited' | 'library-unavailable',
    message: string,
  ) {
    super(message);
    this.name = 'PhotoServiceError';
  }
}

export class MockPhotoService implements PhotoService {
  constructor(private readonly photos: Photo[] = archivePhotos) {}

  async getPhotos(limit = this.photos.length) {
    return this.photos.slice(0, limit);
  }

  async searchPhotosBetween(startDate: string, endDate: string): Promise<PhotoSearchResult> {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const photos = this.photos.filter((photo) => {
      const takenAt = new Date(photo.takenAt).getTime();
      return takenAt >= start && takenAt <= end;
    });
    return { photos, access: 'all', isComplete: true };
  }

  async getPhotosBetween(startDate: string, endDate: string) {
    return (await this.searchPhotosBetween(startDate, endDate)).photos;
  }
}

type MediaAsset = InstanceType<typeof import('expo-media-library').Asset>;

const MAX_QUERY_ASSETS = 250;
const ENRICHMENT_BATCH_SIZE = 8;
const screenshotFilenamePattern = /(^|[\s_.-])(screenshot|screen[_\s-]?shot|스크린샷)([\s_.-]|$)/i;

function accessFromPermission(permission: { granted: boolean; accessPrivileges?: 'all' | 'limited' | 'none' }): PhotoLibraryAccess {
  if (!permission.granted || permission.accessPrivileges === 'none') return 'none';
  return permission.accessPrivileges === 'limited' ? 'limited' : 'all';
}

async function enrichAsset(asset: MediaAsset): Promise<Photo | null> {
  const [info, location, mediaSubtypes, isInCloud] = await Promise.all([
    asset.getInfo(),
    asset.getLocation().catch((error) => {
      if (__DEV__) console.info('[Trace photos] Asset GPS metadata is unavailable.', { assetId: asset.id, error });
      return null;
    }),
    Platform.OS === 'ios'
      ? asset.getMediaSubtypes().then((subtypes) => subtypes as string[]).catch(() => [] as string[])
      : Promise.resolve<string[]>([]),
    Platform.OS === 'ios' ? asset.getIsInCloud().catch(() => false) : Promise.resolve(false),
  ]);
  if (!info.creationTime || !Number.isFinite(info.creationTime)) return null;

  const isScreenshot = mediaSubtypes.includes('screenshot') || screenshotFilenamePattern.test(info.filename);
  return {
    id: info.id,
    assetId: info.id,
    uri: isInCloud ? asset.id : info.uri,
    takenAt: new Date(info.creationTime).toISOString(),
    location: location ?? undefined,
    width: info.width,
    height: info.height,
    filename: info.filename,
    mediaSubtypes,
    isScreenshot,
    isLocallyAvailable: !isInCloud,
    source: 'media-library',
  };
}

async function enrichAssets(assets: MediaAsset[]): Promise<Photo[]> {
  const photos: Photo[] = [];
  for (let index = 0; index < assets.length; index += ENRICHMENT_BATCH_SIZE) {
    const batch = assets.slice(index, index + ENRICHMENT_BATCH_SIZE);
    const enriched = await Promise.all(batch.map((asset) => enrichAsset(asset)));
    photos.push(...enriched.filter((photo): photo is Photo => photo !== null));
  }
  return photos.filter((photo, index, all) => all.findIndex((item) => (item.assetId ?? item.id) === (photo.assetId ?? photo.id)) === index);
}

export class ExpoMediaPhotoService implements PhotoService {
  private async queryRecent(limit: number): Promise<Photo[]> {
    const MediaLibrary = await loadMediaLibrary();
    const permission = await MediaLibrary.getPermissionsAsync(false, ['photo']);
    if (accessFromPermission(permission) === 'none') return [];
    const assets = await new MediaLibrary.Query()
      .eq(MediaLibrary.AssetField.MEDIA_TYPE, MediaLibrary.MediaType.IMAGE)
      .orderBy({ key: MediaLibrary.AssetField.CREATION_TIME, ascending: false })
      .limit(limit)
      .exe();
    return enrichAssets(assets);
  }

  async getPhotos(limit = 100): Promise<Photo[]> {
    try {
      return await this.queryRecent(limit);
    } catch (error) {
      console.error('Photo library lookup failed', error);
      return [];
    }
  }

  async searchPhotosBetween(startDate: string, endDate: string): Promise<PhotoSearchResult> {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    if (!Number.isFinite(start) || !Number.isFinite(end) || start > end) {
      throw new PhotoServiceError('library-unavailable', '사진 검색 시간 범위가 올바르지 않습니다.');
    }

    const MediaLibrary = await loadMediaLibrary();
    const permission = await MediaLibrary.getPermissionsAsync(false, ['photo']);
    const access = accessFromPermission(permission);
    if (access === 'none') {
      throw new PhotoServiceError('permission-denied', '사진 접근 권한이 없어 Memory 생성을 잠시 보류합니다.');
    }

    try {
      const assets = await new MediaLibrary.Query()
        .eq(MediaLibrary.AssetField.MEDIA_TYPE, MediaLibrary.MediaType.IMAGE)
        .gte(MediaLibrary.AssetField.CREATION_TIME, start)
        .lte(MediaLibrary.AssetField.CREATION_TIME, end)
        .orderBy(MediaLibrary.AssetField.CREATION_TIME)
        .limit(MAX_QUERY_ASSETS)
        .exe();
      const photos = await enrichAssets(assets);
      return { photos, access, isComplete: access === 'all' && assets.length < MAX_QUERY_ASSETS };
    } catch (error) {
      if (error instanceof PhotoServiceError) throw error;
      console.error('Photo library lookup for Memory failed', error);
      throw new PhotoServiceError('library-unavailable', '사진 보관함을 확인하지 못했습니다.');
    }
  }

  async getPhotosBetween(startDate: string, endDate: string): Promise<Photo[]> {
    return (await this.searchPhotosBetween(startDate, endDate)).photos;
  }
}

const mockPhotoService = new MockPhotoService();
export const photoService: PhotoService = Platform.OS === 'web' ? mockPhotoService : new ExpoMediaPhotoService();

export async function requestPhotoPermission() {
  if (Platform.OS === 'web') return false;
  try {
    const MediaLibrary = await loadMediaLibrary();
    return (await MediaLibrary.requestPermissionsAsync(false, ['photo'])).granted;
  } catch (error) {
    console.error('Photo permission request failed', error);
    return false;
  }
}

export async function getPhotoLibraryAccess(): Promise<PhotoLibraryAccess> {
  if (Platform.OS === 'web') return 'none';
  try {
    const MediaLibrary = await loadMediaLibrary();
    return accessFromPermission(await MediaLibrary.getPermissionsAsync(false, ['photo']));
  } catch (error) {
    console.error('Photo permission status could not be read', error);
    return 'none';
  }
}

export async function presentLimitedPhotoAccessPicker(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const MediaLibrary = await loadMediaLibrary();
    const permission = await MediaLibrary.getPermissionsAsync(false, ['photo']);
    if (accessFromPermission(permission) !== 'limited') return false;
    await MediaLibrary.presentPermissionsPicker(['photo']);
    return true;
  } catch (error) {
    console.error('Limited photo access picker could not be opened', error);
    return false;
  }
}

export async function getPhotos(limit = 100) {
  return photoService.getPhotos(limit);
}

export async function getPhotosBetween(startDate: string, endDate: string) {
  return photoService.getPhotosBetween(startDate, endDate);
}

export async function getRecentPhotos(limit = 20) {
  return photoService.getPhotos(limit);
}

export async function findPhotosNearLocation(latitude: number, longitude: number, radius = 250) {
  const photos = await photoService.getPhotos();
  return photos.filter((photo) => photo.location
    && distanceInMeters(photo.location, { latitude, longitude }) <= radius);
}
