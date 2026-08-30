import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { estimateAiCost, getTodayAiUsage } from '@/services/ai-usage-service';
import type { UsageMetric } from '@/types/ai-usage';
export default function AiUsageScreen(){const [rows,setRows]=useState<UsageMetric[]>([]);useEffect(()=>{void getTodayAiUsage().then(setRows)},[]);const luna=rows.filter(r=>r.model==='LUNA').length;const terra=rows.filter(r=>r.model==='TERRA').length;return <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}><Stack.Screen options={{title:'AI Usage'}}/><ThemedText variant="largeTitle">오늘 AI 사용량</ThemedText><ThemedText variant="subhead">결정적 검색은 AI를 호출하지 않습니다.</ThemedText><View style={styles.grid}><ThemedText>전체 호출  {rows.length}</ThemedText><ThemedText>Luna  {luna}</ThemedText><ThemedText>Terra  {terra}</ThemedText><ThemedText>입력 토큰  {rows.reduce((n,r)=>n+r.inputTokens,0)}</ThemedText><ThemedText>출력 토큰  {rows.reduce((n,r)=>n+r.outputTokens,0)}</ThemedText><ThemedText>예상 비용  ${estimateAiCost(rows).toFixed(4)}</ThemedText></View></ScrollView>}
const styles=StyleSheet.create({content:{padding:24,gap:14},grid:{padding:18,borderRadius:18,backgroundColor:'#f3f4f6',gap:10}});
