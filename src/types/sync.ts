export type SyncStatus = 'pending' | 'synced' | 'failed' | 'deleted';
export type SyncEntity = 'user' | 'place' | 'visit' | 'memory' | 'memoryPhoto' | 'favorite' | 'userSettings';
export type SyncEnvelope = { id: string; entity: SyncEntity; userId: string; deviceId: string; operation: 'upsert' | 'delete'; payload: unknown; createdAt: string; updatedAt: string; deletedAt?: string; syncStatus: SyncStatus };
export interface CloudSyncAdapter { pull(userId:string, since?:string): Promise<SyncEnvelope[]>; push(records:SyncEnvelope[]): Promise<{acknowledgedIds:string[]}>; }
