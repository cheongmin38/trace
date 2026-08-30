import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Stack } from 'expo-router';
import { AskResultCards } from '@/components/ask-result-cards';
import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { generateRemoteAskTraceAnswer } from '@/services/ask-trace-ai-service';
import { searchAskTraceQuestion } from '@/services/ask-trace-search-service';
import { useAppStore } from '@/store/app-store';
import { useAuthStore } from '@/store/auth-store';
import { radius, shadow, spacing, useTraceTheme } from '@/theme';

const prompts = ['올해 가장 많이 간 곳', '최근에 갔던 카페', '1년 전 오늘', '사진을 많이 찍은 장소'];

export default function AskTraceScreen() {
  const { colors } = useTraceTheme();
  const memories = useAppStore((state) => state.memories);
  const visits = useAppStore((state) => state.visits);
  const places = useAppStore((state) => state.places);
  const userId = useAuthStore((state) => state.user?.id);
  const scopedUserId = userId && (memories.some((memory) => memory.userId === userId) || visits.some((visit) => visit.userId === userId) || places.some((place) => place.userId === userId)) ? userId : undefined;
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    if (!question.trim() || loading) return;
    setLoading(true);
    try {
      const searchResult = await searchAskTraceQuestion(question, scopedUserId, { getPlaces: async () => places, getVisits: async () => visits, getMemories: async () => memories });
      setResult(searchResult);
      setAnswer((await generateRemoteAskTraceAnswer(question, searchResult)).text);
    } finally { setLoading(false); }
  };
  return <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={[styles.content, { backgroundColor: colors.background }]}>
    <Stack.Screen options={{ title: 'Ask Trace' }} />
    <View style={styles.hero}>
      <View style={[styles.orbit, { backgroundColor: colors.warmSoft }]}><Ionicons name="sparkles" size={24} color={colors.warm} /></View>
      <ThemedText variant="largeTitle">무엇을 기억해 볼까요?</ThemedText>
      <ThemedText variant="subhead">Trace에 남은 장소와 사진을 바탕으로만 답해드려요.</ThemedText>
    </View>
    <View style={[styles.searchPanel, { backgroundColor: colors.surface, boxShadow: shadow.card }]}>
      <View style={[styles.inputWrap, { backgroundColor: colors.surfaceMuted }]}>
        <Ionicons name="search" size={19} color={colors.secondaryText} />
        <TextInput value={question} onChangeText={setQuestion} onSubmitEditing={submit} placeholder="예: 작년에 제주도 언제 갔어?" placeholderTextColor={colors.tertiaryText} style={[styles.input, { color: colors.text }]} returnKeyType="search" />
        {question ? <PressableScale onPress={() => setQuestion('')}><Ionicons name="close-circle" size={18} color={colors.tertiaryText} /></PressableScale> : null}
      </View>
      <PressableScale onPress={submit} style={[styles.askButton, { backgroundColor: colors.accent, opacity: question.trim() ? 1 : 0.45 }]}>
        {loading ? <ActivityIndicator color={colors.onAccent} /> : <><ThemedText variant="headline" style={{ color: colors.onAccent }}>기억 찾기</ThemedText><Ionicons name="arrow-up" size={18} color={colors.onAccent} /></>}
      </PressableScale>
    </View>
    {!result ? <View style={styles.discovery}><ThemedText variant="headline">이렇게 물어보세요</ThemedText><View style={styles.promptGrid}>{prompts.map((item) => <PressableScale key={item} onPress={() => setQuestion(item)} style={[styles.prompt, { backgroundColor: colors.surface, borderColor: colors.border }]}><ThemedText variant="subhead">{item}</ThemedText><Ionicons name="arrow-up-outline" size={15} color={colors.secondaryText} /></PressableScale>)}</View><View style={[styles.privacy, { backgroundColor: colors.ivory }]}><Ionicons name="shield-checkmark-outline" size={19} color={colors.warm} /><ThemedText variant="caption" style={{ flex: 1 }}>답변에 필요한 기록만 사용하며, 기록에 없는 이야기는 만들지 않아요.</ThemedText></View></View> : <View style={[styles.answerCard, { backgroundColor: colors.surface, boxShadow: shadow.card }]}><ThemedText variant="caption" style={{ color: colors.warm }}>ASK TRACE</ThemedText><ThemedText variant="subhead">{question}</ThemedText>{loading ? <View style={styles.loading}><ActivityIndicator color={colors.warm} /><ThemedText variant="subhead">기억을 정리하고 있어요</ThemedText></View> : <><ThemedText variant="title">{answer}</ThemedText><AskResultCards result={result} /></>}</View>}
  </ScrollView>;
}

const styles = StyleSheet.create({ content: { flexGrow: 1, padding: spacing.ml, paddingBottom: 124, gap: spacing.lg }, hero: { paddingTop: spacing.lg, gap: spacing.xs }, orbit: { width: 52, height: 52, borderRadius: radius.card, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs }, searchPanel: { borderRadius: radius.card, padding: spacing.sm, gap: spacing.sm }, inputWrap: { minHeight: 52, borderRadius: radius.md, paddingHorizontal: spacing.md, alignItems: 'center', flexDirection: 'row', gap: spacing.sm }, input: { flex: 1, minHeight: 48, fontSize: 15 }, askButton: { minHeight: 52, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: spacing.xs }, discovery: { gap: spacing.md }, promptGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }, prompt: { width: '48%', minHeight: 72, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, padding: spacing.sm, justifyContent: 'space-between', flexDirection: 'row', alignItems: 'flex-end' }, privacy: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, marginTop: spacing.xs }, answerCard: { borderRadius: radius.card, padding: spacing.ml, gap: spacing.md }, loading: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center', paddingVertical: spacing.md } });
