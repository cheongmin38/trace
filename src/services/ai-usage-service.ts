import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UsageMetric } from '@/types/ai-usage';
const KEY='trace:ai:usage:v1';
export async function recordAiUsage(metric:UsageMetric){const raw=await AsyncStorage.getItem(KEY);let rows:UsageMetric[]=[];try{rows=raw?JSON.parse(raw):[]}catch{rows=[];}rows.push(metric);await AsyncStorage.setItem(KEY,JSON.stringify(rows.slice(-1000)));}
export async function getAiUsage(){const raw=await AsyncStorage.getItem(KEY);try{return raw?JSON.parse(raw) as UsageMetric[]:[]}catch{return [];}}
export async function getTodayAiUsage(){const today=new Date().toISOString().slice(0,10);return (await getAiUsage()).filter(row=>row.createdAt.slice(0,10)===today);}
export function estimateAiCost(rows:UsageMetric[]){return rows.reduce((sum,row)=>sum+row.inputTokens*0.0000015+row.outputTokens*0.000006,0);}
