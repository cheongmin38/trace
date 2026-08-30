import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppHeader } from '@/components/app-header';
import { DailySummaryCard } from '@/components/daily-summary-card';
import { EmptyState } from '@/components/empty-state';
import { IconButton } from '@/components/icon-button';
import { MemoryImage } from '@/components/memory-image';
import { PressableScale } from '@/components/pressable-scale';
import { SkeletonCard } from '@/components/skeleton-card';
import { StatCard } from '@/components/stat-card';
import { ThemedText } from '@/components/themed-text';
import { getMonthlyReview } from '@/services/discovery-service';
import { useAppStore } from '@/store/app-store';
import { shadow, useTraceTheme } from '@/theme';

export function HomeScreen(){
 const router=useRouter(); const {colors}=useTraceTheme(); const [today]=useState(()=>new Date()); const [loading]=useState(false);
 const visits=useAppStore(s=>s.visits), memories=useAppStore(s=>s.memories), places=useAppStore(s=>s.places);
 const dayKey=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`; const todayVisits=useMemo(()=>visits.filter(v=>v.startedAt.slice(0,10)===dayKey),[dayKey,visits]); const todayMemories=useMemo(()=>memories.filter(m=>m.startedAt.slice(0,10)===dayKey),[dayKey,memories]);
 const photoCount=todayMemories.reduce((n,m)=>n+m.photos.length,0); const duration=todayVisits.reduce((n,v)=>n+(v.durationMinutes??0),0); const monthly=getMonthlyReview(places,visits,memories,today.getFullYear(),today.getMonth()+1);
 const yearAgo=memories.find(m=>{const d=new Date(m.startedAt);const target=new Date(today);target.setFullYear(target.getFullYear()-1);return d.toDateString()===target.toDateString();}); const yearAgoPlace=places.find(p=>p.id===yearAgo?.placeId); const recent=memories.slice(0,5);
 return <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={[styles.content,{backgroundColor:colors.background}]}>
  <AppHeader title="Trace" subtitle={today.toLocaleDateString('ko-KR',{year:'numeric',month:'long',day:'numeric',weekday:'long'})} actions={<><IconButton name="notifications-outline" label="알림" onPress={()=>router.push('/notifications')}/><IconButton name="person-circle-outline" label="프로필" onPress={()=>router.push('/profile')}/></>}/>
  {loading?<SkeletonCard/>:<View style={[styles.hero,{backgroundColor:colors.journey,boxShadow:shadow.raised}]}><ThemedText variant="caption" style={{color:colors.journeyText}}>오늘의 Trace</ThemedText><ThemedText variant="title" style={{color:colors.journeyText}}>{todayVisits.length?`오늘 ${todayVisits.length}곳을 다녀왔어요.`:'오늘의 기록을 기다리고 있어요.'}</ThemedText><ThemedText variant="body" style={{color:colors.journeyText,opacity:.8}}>{todayVisits.length?`사진 ${photoCount}장 · 총 ${duration}분 머물렀어요.`:'방문과 사진이 쌓이면 이곳에서 보여드릴게요.'}</ThemedText><DailySummaryCard date={dayKey}/><PressableScale onPress={()=>router.push('/timeline')} style={[styles.cta,{backgroundColor:colors.journeyText}]}><ThemedText variant="headline" style={{color:colors.journey}}>오늘 기록 보기</ThemedText></PressableScale></View>}
  <View style={styles.stats}>{[['places',todayVisits.length],['photos',photoCount],['duration',duration]].map(([label,value])=><StatCard key={String(label)} value={Number(value)} label={label==='places'?'방문 장소':label==='photos'?'사진':'체류 시간(분)'}/>)}</View>
  <View style={styles.section}><View style={styles.heading}><ThemedText variant="title">최근 추억</ThemedText><PressableScale onPress={()=>router.push('/timeline')}><ThemedText variant="caption">모두 보기</ThemedText></PressableScale></View>{recent.length?<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>{recent.map(memory=><PressableScale key={memory.id} onPress={()=>router.push(`/memory/${memory.id}`)} style={[styles.memory,{backgroundColor:colors.surface}]}><MemoryImage uri={memory.photos[0]?.uri??''} style={styles.photo} accessibilityLabel={memory.title}/><ThemedText variant="headline" numberOfLines={1}>{places.find(p=>p.id===memory.placeId)?.name??memory.title}</ThemedText><ThemedText variant="caption">사진 {memory.photos.length}장</ThemedText></PressableScale>)}</ScrollView>:<EmptyState title="아직 추억이 없어요" description="방문 기록이 쌓이면 최근 추억을 보여드릴게요."/>}</View>
  {yearAgo&&yearAgoPlace?<View style={styles.section}><ThemedText variant="title">1년 전 오늘</ThemedText><PressableScale onPress={()=>router.push(`/memory/${yearAgo.id}`)} style={[styles.yearCard,{backgroundColor:colors.surface}]}><MemoryImage uri={yearAgo.photos[0]?.uri??yearAgoPlace.coverPhoto??''} style={styles.yearPhoto} accessibilityLabel={yearAgoPlace.name}/><View><ThemedText variant="headline">{yearAgoPlace.name}</ThemedText><ThemedText variant="caption">작년 같은 날의 기록</ThemedText></View></PressableScale></View>:null}
  <View style={styles.section}><View style={styles.heading}><ThemedText variant="title">이번 달 Trace</ThemedText><PressableScale onPress={()=>router.push({pathname:'/review/[year]',params:{year:String(today.getFullYear())}})}><ThemedText variant="caption">{today.getMonth()+1}월 돌아보기</ThemedText></PressableScale></View><View style={styles.month}><StatCard value={monthly.placeCount} label="장소"/><StatCard value={monthly.memoryCount} label="방문"/><StatCard value={monthly.photoCount} label="사진"/></View></View>
 </ScrollView>
}
const styles=StyleSheet.create({content:{padding:20,paddingBottom:120,gap:20},hero:{padding:20,borderRadius:24,gap:8},cta:{alignSelf:'flex-start',paddingHorizontal:16,paddingVertical:12,borderRadius:14,marginTop:8},stats:{flexDirection:'row',gap:8},section:{gap:12},heading:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},row:{gap:12},memory:{width:156,paddingBottom:12,borderRadius:18,overflow:'hidden',gap:4},photo:{width:'100%',aspectRatio:1},yearCard:{padding:12,borderRadius:18,flexDirection:'row',gap:12,alignItems:'center'},yearPhoto:{width:96,height:96,borderRadius:14},month:{flexDirection:'row',gap:8}});
