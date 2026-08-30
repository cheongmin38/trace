import AsyncStorage from '@react-native-async-storage/async-storage';
export async function getAiCache<T>(key:string):Promise<T|null>{const value=await AsyncStorage.getItem(`trace:ai:cache:${key}`);if(!value)return null;try{return JSON.parse(value) as T;}catch{return null;}}
export async function setAiCache<T>(key:string,value:T){await AsyncStorage.setItem(`trace:ai:cache:${key}`,JSON.stringify(value));}
export const hashInput=(value:string)=>Array.from(value).reduce((hash,char)=>((hash<<5)-hash+char.charCodeAt(0))|0,0).toString(36);
