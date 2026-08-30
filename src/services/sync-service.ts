import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import type { CloudSyncAdapter, SyncEnvelope, SyncEntity } from '@/types/sync';

const OUTBOX_KEY='trace:sync:outbox:v1'; const DEVICE_KEY='trace:sync:device-id:v1';
const now=()=>new Date().toISOString();
async function deviceId(){ let id=await SecureStore.getItemAsync(DEVICE_KEY); if(!id){id=`device-${Date.now()}-${Math.random().toString(36).slice(2)}`; await SecureStore.setItemAsync(DEVICE_KEY,id);} return id; }
async function read():Promise<SyncEnvelope[]>{const raw=await AsyncStorage.getItem(OUTBOX_KEY); if(!raw)return []; try{return JSON.parse(raw) as SyncEnvelope[]}catch{return [];}}
async function write(v:SyncEnvelope[]){await AsyncStorage.setItem(OUTBOX_KEY,JSON.stringify(v));}
export async function enqueueSyncRecord(input:{id:string;entity:SyncEntity;userId:string;payload:unknown;deletedAt?:string}){const t=now(); const record:SyncEnvelope={...input,deviceId:await deviceId(),operation:input.deletedAt?'delete':'upsert',createdAt:t,updatedAt:t,syncStatus:input.deletedAt?'deleted':'pending'}; const out=await read(); const i=out.findIndex(x=>x.entity===record.entity&&x.id===record.id); if(i>=0)out[i]=record; else out.push(record); await write(out); return record;}
export async function syncNow(userId:string, adapter:CloudSyncAdapter){const out=(await read()).filter(x=>x.userId===userId&&x.syncStatus!=='synced'); if(!out.length)return {pushed:0,pulled:0}; try{const result=await adapter.push(out); const ids=new Set(result.acknowledgedIds); await write((await read()).map(x=>ids.has(x.id)?{...x,syncStatus:'synced'}:x)); const pulled=await adapter.pull(userId); return {pushed:ids.size,pulled:pulled.length,records:pulled};}catch(error){console.error('Trace sync failed',error); return {pushed:0,pulled:0,error};}}
export async function pendingSyncCount(){return (await read()).filter(x=>x.syncStatus!=='synced').length;}
