import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { AskResultCards } from '@/components/ask-result-cards';
import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { generateRemoteAskTraceAnswer } from '@/services/ask-trace-ai-service';
import { searchAskTraceQuestion } from '@/services/ask-trace-search-service';
import { useAppStore } from '@/store/app-store';
import { useAuthStore } from '@/store/auth-store';
import { radius, shadow, spacing, useTraceTheme } from '@/theme';

const prompts = ['올해 가장 많이 간 곳', '최근에 갔던 카페', '1년 전 오늘', '사진을 가장 많이 찍은 장소'];
const categories = ['추천', '최근', '장소', '사람', '여행'];

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
      const searchResult = await searchAskTraceQuestion(question, scopedUserId, {
        getPlaces: async () => places,
        getVisits: async () => visits,
        getMemories: async () => memories,
      });
      setResult(searchResult);
      setAnswer((await generateRemoteAskTraceAnswer(question, searchResult)).text);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={[styles.content, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: 'Ask Trace' }} />
      <View style={styles.hero}>
        <View style={styles.heroTitle}>
          <View style={[styles.orbit, { backgroundColor: colors.accentSoft }]}><Ionicons name="sparkles" size={18} color={colors.accent} /></View>
          <ThemedText variant="title">Ask Trace</ThemedText>
        </View>
        <ThemedText variant="largeTitle">무엇을 기억해 볼까요?</ThemedText>
        <ThemedText variant="subhead" style={{ color: colors.secondaryText }}>Trace의 실제 기록 안에서만 답을 찾아드려요.</ThemedText>
      </View>

      <View style={[styles.searchPanel, { backgroundColor: colors.surfaceGlass, borderColor: colors.border, boxShadow: shadow.card }]}>
        <View style={[styles.inputWrap, { backgroundColor: colors.surfaceMuted }]}>
          <Ionicons name="search" size={19} color={colors.secondaryText} />
          <TextInput
            value={question}
            onChangeText={setQuestion}
            onSubmitEditing={submit}
            placeholder="예: 작년에 제주도 언제 갔어?"
            placeholderTextColor={colors.tertiaryText}
            style={[styles.input, { color: colors.text }]}
            returnKeyType="search"
          />
          {question ? <PressableScale accessibilityLabel="질문 지우기" onPress={() => setQuestion('')}><Ionicons name="close-circle" size={18} color={colors.tertiaryText} /></PressableScale> : null}
        </View>
        <PressableScale accessibilityLabel="질문하기" onPress={submit} style={[styles.askButton, { backgroundColor: colors.accent, opacity: question.trim() ? 1 : 0.45 }]}>
          {loading ? <ActivityIndicator color={colors.onAccent} /> : <Ionicons name="arrow-up" size={20} color={colors.onAccent} />}
        </PressableScale>
      </View>

      {!result ? (
        <View style={styles.discovery}>
          <View style={styles.categoryRow}>
            {categories.map((category, index) => <View key={category} style={[styles.category, { backgroundColor: index === 0 ? colors.accent : colors.surface, borderColor: colors.border }]}><ThemedText variant="caption" style={{ color: index === 0 ? colors.onAccent : colors.secondaryText }}>{category}</ThemedText></View>)}
          </View>
          <ThemedText variant="headline">추천 질문</ThemedText>
          <View style={styles.promptGrid}>
            {prompts.map((item, index) => <PressableScale key={item} onPress={() => setQuestion(item)} style={[styles.prompt, { backgroundColor: colors.surfaceGlass, borderColor: colors.border, boxShadow: shadow.soft }]}>
              <View style={[styles.promptIcon, { backgroundColor: index % 2 ? colors.accentSoft : colors.lavender }]}><Ionicons name={index === 1 ? 'cafe-outline' : index === 2 ? 'time-outline' : index === 3 ? 'images-outline' : 'location-outline'} size={17} color={colors.accent} /></View>
              <ThemedText variant="subhead" style={styles.promptText}>{item}</ThemedText>
              <Ionicons name="chevron-forward" size={16} color={colors.tertiaryText} />
            </PressableScale>)}
          </View>
          <View style={[styles.privacy, { backgroundColor: colors.ivory }]}><Ionicons name="shield-checkmark-outline" size={19} color={colors.warm} /><ThemedText variant="caption" style={{ flex: 1 }}>필요한 기록만 사용하며, 없는 이야기는 만들지 않아요.</ThemedText></View>
        </View>
      ) : (
        <View style={[styles.answerCard, { backgroundColor: colors.surfaceGlass, borderColor: colors.border, boxShadow: shadow.card }]}>
          <ThemedText variant="caption" style={{ color: colors.accent }}>ASK TRACE</ThemedText>
          <ThemedText variant="subhead" style={{ color: colors.secondaryText }}>{question}</ThemedText>
          {loading ? <View style={styles.loading}><ActivityIndicator color={colors.accent} /><ThemedText variant="subhead">기억을 정리하고 있어요.</ThemedText></View> : <><ThemedText variant="title">{answer}</ThemedText><AskResultCards result={result} /></>}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, padding: spacing.ml, paddingBottom: 124, gap: spacing.lg },
  hero: { paddingTop: spacing.lg, gap: spacing.xs },
  heroTitle: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  orbit: { width: 32, height: 32, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  searchPanel: { minHeight: 62, borderRadius: radius.card, borderWidth: StyleSheet.hairlineWidth, padding: spacing.xs, flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  inputWrap: { flex: 1, minHeight: 48, borderRadius: radius.md, paddingHorizontal: spacing.md, alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  input: { flex: 1, minHeight: 46, fontSize: 15 },
  askButton: { width: 48, height: 48, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  discovery: { gap: spacing.md },
  categoryRow: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
  category: { minHeight: 32, paddingHorizontal: spacing.md, borderRadius: radius.full, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  promptGrid: { gap: spacing.sm },
  prompt: { minHeight: 60, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  promptIcon: { width: 34, height: 34, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  promptText: { flex: 1 },
  privacy: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, marginTop: spacing.xs },
  answerCard: { borderRadius: radius.card, borderWidth: StyleSheet.hairlineWidth, padding: spacing.ml, gap: spacing.md },
  loading: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center', paddingVertical: spacing.md },
});
