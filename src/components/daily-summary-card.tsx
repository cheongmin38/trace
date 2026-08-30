import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { generateDailySummary } from '@/services/daily-summary-service';
import { useAppStore } from '@/store/app-store';
export function DailySummaryCard({date=new Date().toISOString().slice(0,10)}:{date?:string}){const visits=useAppStore(s=>s.visits);const places=useAppStore(s=>s.places);const memories=useAppStore(s=>s.memories);const [text,setText]=useState(''); useEffect(()=>{let active=true; const dayVisits=visits.filter(v=>v.startedAt.slice(0,10)===date); generateDailySummary({sourceDate:date,visits:dayVisits,places,photoCount:memories.filter(m=>m.startedAt.slice(0,10)===date).reduce((n,m)=>n+m.photos.length,0)}).then(r=>active&&setText(r.summary)); return()=>{active=false}},[date,visits,places,memories]); return <View style={styles.card}><ThemedText variant="caption">오늘의 Trace</ThemedText>{text?<ThemedText variant="body">{text}</ThemedText>:<ActivityIndicator/>}</View>}
const styles=StyleSheet.create({card:{marginHorizontal:20,marginBottom:16,padding:18,borderRadius:20,backgroundColor:'#f4f1eb',gap:8}});
