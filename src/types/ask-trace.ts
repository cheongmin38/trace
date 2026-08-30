export type AskIntent='PLACE_SEARCH'|'VISIT_SEARCH'|'TRIP_SEARCH'|'PHOTO_SEARCH'|'MEMORY_SEARCH'|'STATISTICS'|'DATE_SEARCH'|'UNKNOWN';
export type AskSort='recent'|'oldest'|'asc'|'desc'|null;
export type AskQuery={intent:AskIntent;locationQuery:string|null;dateRange:{start:string;end:string}|null;category:string|null;metric:'visitCount'|'photoCount'|'memoryCount'|'durationMinutes'|null;sort:AskSort;limit:number|null;mediaType:'photo'|'video'|null};
