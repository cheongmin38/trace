export type AiFeature='query-parser'|'daily-summary'|'fuzzy-search'|'photo-caption'|'answer';
export type AiModel='NO_AI'|'LUNA'|'TERRA'|'SOL';
export type UsageMetric={feature:AiFeature;model:AiModel;inputTokens:number;outputTokens:number;cachedTokens:number;latency:number;success:boolean;createdAt:string;userId?:string};
