import { useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Stack } from 'expo-router';
import { AskResultCards } from '@/components/ask-result-cards';
import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { generateRemoteAskTraceAnswer } from '@/services/ask-trace-ai-service';
import { searchAskTraceQuestion } from '@/services/ask-trace-search-service';
import { useAppStore } from '@/store/app-store';
import { useAuthStore } from '@/store/auth-store';

export default function AskTraceScreen(){
 const memories=useAppStore(s=>s.memories), visits=useAppStore(s=>s.visits), places=useAppStore(s=>s.places), userId=useAuthStore(s=>s.user?.id);
 const scopedUserId=userId&&(memories.some(m=>m.userId===userId)||visits.some(v=>v.userId===userId)||places.some(p=>p.userId===userId))?userId:undefined;
 const [q,setQ]=useState(''),[answer,setAnswer]=useState(''),[result,setResult]=useState<any>(null),[loading,setLoading]=useState(false);
 const submit=async()=>{if(!q.trim()||loading)return;setLoading(true);try{const r=await searchAskTraceQuestion(q,scopedUserId,{getPlaces:async()=>places,getVisits:async()=>visits,getMemories:async()=>memories});setResult(r);setAnswer((await generateRemoteAskTraceAnswer(q,r)).text);}finally{setLoading(false);}};
 return <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}><Stack.Screen options={{title:'Ask Trace'}}/><ThemedText variant="largeTitle">무엇을 기억해 볼까요?</ThemedText><ThemedText variant="subhead">내 Trace 기록 안에서만 찾아드려요.</ThemedText><View style={styles.inputRow}><TextInput value={q} onChangeText={setQ} onSubmitEditing={submit} placeholder="예: 작년에 제주도 언제 갔어?" style={styles.input}/><PressableScale onPress={submit} style={styles.button}><ThemedText style={{color:'#fff'}}>검색</ThemedText></PressableScale></View>{!result?<View style={styles.suggestions}>{['올해 가장 많이 간 곳','작년 여행 보여줘','1년 전 오늘','최근에 갔던 카페','가장 사진을 많이 찍은 장소'].map(s=><PressableScale key={s} onPress={()=>setQ(s)} style={styles.suggestion}><ThemedText>{s}</ThemedText></PressableScale>)}</View>:<View style={styles.result}><ThemedText variant="caption">{q}</ThemedText>{loading?<ThemedText>기록을 살펴보고 있어요…</ThemedText>:<><ThemedText variant="title">{answer}</ThemedText><AskResultCards result={result}/></>}</View>}</ScrollView>;
}
const styles=StyleSheet.create({content:{padding:24,gap:12},inputRow:{flexDirection:'row',gap:8,marginTop:18},input:{flex:1,backgroundColor:'#f3f4f6',borderRadius:14,padding:14,fontSize:15},button:{backgroundColor:'#171717',borderRadius:14,paddingHorizontal:16,justifyContent:'center'},suggestions:{gap:8,marginTop:14},suggestion:{padding:14,borderRadius:14,backgroundColor:'#f5f5f5'},result:{gap:14,marginTop:18}});
