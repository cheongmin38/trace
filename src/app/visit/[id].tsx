import { useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { PressableScale } from '@/components/pressable-scale';
import { useAppStore } from '@/store/app-store';
import { updateVisitDetails, deleteVisitWithRelations } from '@/services/visit-editor-service';

export default function VisitDetailScreen(){
 const {id}=useLocalSearchParams<{id:string}>(); const router=useRouter();
 const visit=useAppStore(s=>s.visits.find(v=>v.id===id)); const places=useAppStore(s=>s.places); const memory=useAppStore(s=>s.memories.find(m=>m.visitId===id));
 const [placeId,setPlaceId]=useState(visit?.placeId??''); const [start,setStart]=useState(visit?.startedAt?.slice(0,16).replace('T',' ')??''); const [end,setEnd]=useState(visit?.endedAt?.slice(0,16).replace('T',' ')??''); const [placeOpen,setPlaceOpen]=useState(false);
 if(!visit) return <View style={styles.center}><ThemedText>방문 기록을 찾을 수 없어요</ThemedText></View>;
 const place=places.find(p=>p.id===placeId)??places.find(p=>p.id===visit.placeId);
 const save=async()=>{try{await updateVisitDetails(id!,{placeId,startedAt:start.replace(' ','T'),endedAt:end.replace(' ','T')});Alert.alert('저장했어요');}catch(e){Alert.alert('저장 실패',e instanceof Error?e.message:'다시 시도해 주세요');}};
 const remove=async()=>{await deleteVisitWithRelations(id!);router.back();};
 return <ScrollView style={styles.container} contentContainerStyle={styles.content}><Stack.Screen options={{title:'방문 기록'}}/><ThemedText variant="title">{place?.name??'장소 없음'}</ThemedText><ThemedText variant="caption">{visit.visitNumber}번째 방문 · 장소와 시간을 수정할 수 있어요</ThemedText>
  <PressableScale onPress={()=>setPlaceOpen(true)} style={styles.row}><Ionicons name="location-outline" size={22}/><ThemedText>장소 변경{place?` · ${place.name}`:''}</ThemedText></PressableScale>
  <TextInput style={styles.input} value={start} onChangeText={setStart} placeholder="시작 2026-08-24 15:30"/><TextInput style={styles.input} value={end} onChangeText={setEnd} placeholder="종료 2026-08-24 17:00"/>
  <PressableScale onPress={save} style={styles.primary}><ThemedText style={{color:'#fff'}}>변경사항 저장</ThemedText></PressableScale>
  {memory&&<PressableScale onPress={()=>router.push(`/memory/${memory.id}`)} style={styles.row}><Ionicons name="images-outline" size={22}/><ThemedText>연결된 사진 {memory.photos.length}장 편집</ThemedText></PressableScale>}
  <Pressable onPress={()=>Alert.alert('방문 기록 삭제','연결된 Memory도 함께 삭제됩니다.',[{text:'취소'},{text:'삭제',style:'destructive',onPress:remove}])} style={styles.delete}><ThemedText style={{color:'#c0392b'}}>방문 기록 삭제</ThemedText></Pressable>
  <Modal visible={placeOpen} transparent animationType="slide"><View style={styles.overlay}><View style={styles.sheet}><ThemedText variant="title">장소 변경</ThemedText>{places.map(p=><Pressable key={p.id} onPress={()=>{setPlaceId(p.id);setPlaceOpen(false)}} style={styles.place}><ThemedText>{p.name}</ThemedText></Pressable>)}<Pressable onPress={()=>setPlaceOpen(false)}><ThemedText style={styles.cancel}>취소</ThemedText></Pressable></View></View></Modal>
 </ScrollView>
}
const styles=StyleSheet.create({container:{flex:1},content:{padding:24,gap:16},center:{flex:1,alignItems:'center',justifyContent:'center'},row:{padding:18,borderRadius:16,backgroundColor:'#f4f4f2',flexDirection:'row',gap:12,alignItems:'center'},input:{backgroundColor:'#f4f4f2',padding:16,borderRadius:14,fontSize:16},primary:{backgroundColor:'#171717',padding:17,borderRadius:16,alignItems:'center'},delete:{padding:18,alignItems:'center'},overlay:{flex:1,justifyContent:'flex-end',backgroundColor:'#0005'},sheet:{backgroundColor:'#fff',padding:24,borderTopLeftRadius:28,borderTopRightRadius:28,gap:10},place:{padding:16,borderBottomWidth:1,borderBottomColor:'#eee'},cancel:{textAlign:'center',padding:14}});
