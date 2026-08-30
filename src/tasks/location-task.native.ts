import * as TaskManager from 'expo-task-manager';
import { writeTrackingError } from '@/repositories/local-storage';
import { processLocationPoint } from '@/services/visit-detection-service';
import { processEndedVisitMemory } from '@/services/memory-processing-service';
import { TRACE_LOCATION_TASK } from '@/tasks/location-task-name';
import type { LocationPoint } from '@/types/location';
import { appendRoutePoint } from '@/services/route-recording-service';

type NativeLocation = {
  timestamp: number;
  coords: {
    latitude: number;
    longitude: number;
    accuracy: number | null;
    altitude: number | null;
    speed: number | null;
    heading: number | null;
  };
};

type LocationTaskPayload = {
  locations: NativeLocation[];
};

function toPoint(location: NativeLocation): LocationPoint {
  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    accuracy: location.coords.accuracy ?? undefined,
    altitude: location.coords.altitude ?? undefined,
    speed: location.coords.speed ?? undefined,
    heading: location.coords.heading ?? undefined,
    timestamp: new Date(location.timestamp).toISOString(),
  };
}

if (!TaskManager.isTaskDefined(TRACE_LOCATION_TASK)) {
  TaskManager.defineTask<LocationTaskPayload>(TRACE_LOCATION_TASK, async ({ data, error }) => {
    if (error) {
      await writeTrackingError('백그라운드 위치 기록을 처리하지 못했어요.');
      console.error('Trace background location task failed', error.message);
      return;
    }
    if (!data?.locations?.length) return;
    try {
      for (const location of data.locations.slice(-5)) {
        const point = toPoint(location);
        await appendRoutePoint(point, 'gps');
        const result = await processLocationPoint(point, 'gps');
        if (result.endedVisit) await processEndedVisitMemory(result.endedVisit, { syncStore: false });
      }
      await writeTrackingError(null);
    } catch (taskError) {
      await writeTrackingError('백그라운드 방문 기록을 저장하지 못했어요.');
      console.error('Trace background visit pipeline failed', taskError);
    }
  });
}
