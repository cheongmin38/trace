import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { MemoryCard } from '@/components/memory-card';
import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { askTrace, type AskResult } from '@/services/ask-trace-service';
import { useAppStore } from '@/store/app-store';
import { useAuthStore } from '@/store/auth-store';
import { spacing, useTraceTheme } from '@/theme';

export function AskTraceCard() {
  const { colors } = useTraceTheme(); const memories=useAppStore(s=>s.memories); const visits=useAppStore(s=>s.visits); const places=useAppStore(s=>s.places); const userId=useAuthStore(s=>s.user?.id); const scopedUserId=userId&&(memories.some(m=>m.userId===userId)||visits.some(v=>v.userId===userId)||places.some(p=>p.userId===userId))?userId:undefined;
  const [query,setQuery]=useState(''); const [result,setResult]=useState<AskResult | null>(null);
const search=()=>setResult(askTrace(query,{userId:scopedUserId,memories,visits,places}));
  return <View style={[styles.card,{backgroundColor:colors.surface}]}><ThemedText variant="title">Ask Trace</ThemedText><ThemedText variant="caption" style={{color:colors.secondaryText}}>내 기록 안에서만 찾아드려요</ThemedText><View style={[styles.search,{backgroundColor:colors.surfaceMuted}]}><TextInput value={query} onChangeText={setQuery} onSubmitEditing={search} placeholder="예: 서울숲에 몇 번 갔지?" placeholderTextColor={colors.tertiaryText} style={[styles.input,{color:colors.text}]}/><PressableScale onPress={search} accessibilityRole="button" style={[styles.button,{backgroundColor:colors.accent}]}><ThemedText variant="caption" style={{color:colors.onAccent}}>찾기</ThemedText></PressableScale></View>{result?<View style={styles.result}><ThemedText variant="body" selectable>{result.answer}</ThemedText>{result.memories.slice(0,2).map(memory=><MemoryCard key={memory.id} memory={memory}/>)}</View>:null}</View>;
}
const styles=StyleSheet.create({card:{marginHorizontal:spacing.ml,marginBottom:spacing.lg,padding:spacing.ml,borderRadius:20,borderCurve:'continuous',gap:spacing.xs},search:{padding:6,borderRadius:14,flexDirection:'row',alignItems:'center'},input:{flex:1,paddingHorizontal:10,paddingVertical:9,fontSize:15},button:{paddingHorizontal:14,paddingVertical:10,borderRadius:10},result:{gap:spacing.md,paddingTop:spacing.sm}});
