import { memories, places, visits } from '@/services/mock-archive';
import { detectTrips } from '@/services/trip-detector';

export const trips = detectTrips(visits, places, memories);
