import Ionicons from "@expo/vector-icons/Ionicons";
import { Redirect, Stack, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { PressableScale } from "@/components/pressable-scale";
import { ThemedText } from "@/components/themed-text";
import { useAuthStore } from "@/store/auth-store";
import { radius, spacing, typography, useTraceTheme } from "@/theme";
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export default function Signup() {
  const router = useRouter();
  const { colors } = useTraceTheme();
  const signUp = useAuthStore((s) => s.signUp);
  const loading = useAuthStore((s) => s.isLoading);
  const serviceError = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);
  const authenticated = useAuthStore((s) => s.isAuthenticated);
  const onboardingCompleted = useAuthStore((s) => s.onboardingCompleted);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const submit = async () => {
    const e = !emailPattern.test(email.trim())
      ? "이메일 주소를 확인해주세요."
      : password.length < 8
        ? "비밀번호는 8자 이상 입력해주세요."
        : password !== confirm
          ? "비밀번호가 일치하지 않아요."
          : null;
    setError(e);
    clearError();
    if (e) return;
    try {
      await signUp({ email: email.trim(), password });
    } catch (err) {
      console.error("Trace signup failed", err);
    }
  };
  if (authenticated) return <Redirect href={onboardingCompleted ? "/(tabs)/home" : "/onboarding/permissions"} />;
  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={process.env.EXPO_OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Stack.Screen options={{ title: "회원가입" }} />
        <Pressable onPress={() => router.back()} accessibilityLabel="뒤로 가기">
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <View style={styles.header}>
          <ThemedText variant="largeTitle">Trace 시작하기</ThemedText>
          <ThemedText variant="subhead" style={{ color: colors.secondaryText }}>
            필요한 정보만으로 계정을 만들어요.
          </ThemedText>
        </View>
        <View style={styles.form}>
          {[
            ["이메일", email, setEmail, "email-address"],
            ["비밀번호", password, setPassword, "default"],
            ["비밀번호 확인", confirm, setConfirm, "default"],
          ].map(([label, value, setValue, type]) => (
            <View
              key={String(label)}
              style={[styles.input, { backgroundColor: colors.surface }]}
            >
              <Ionicons
                name={
                  label === "이메일" ? "mail-outline" : "lock-closed-outline"
                }
                size={19}
                color={colors.secondaryText}
              />
              <TextInput
                value={String(value)}
                onChangeText={setValue as (text: string) => void}
                secureTextEntry={label !== "이메일"}
                keyboardType={String(type) as "default" | "email-address"}
                placeholder={String(label)}
                placeholderTextColor={colors.tertiaryText}
                style={[styles.field, typography.body, { color: colors.text }]}
              />
            </View>
          ))}
          {error || serviceError ? (
            <ThemedText variant="caption" style={{ color: colors.warm }}>
              {error ?? serviceError}
            </ThemedText>
          ) : null}
          <PressableScale
            onPress={() => void submit()}
            disabled={loading}
            style={[styles.cta, { backgroundColor: colors.accent }]}
          >
            {loading ? (
              <ActivityIndicator color={colors.onAccent} />
            ) : (
              <ThemedText variant="headline" style={{ color: colors.onAccent }}>
                회원가입
              </ThemedText>
            )}
          </PressableScale>
          <PressableScale onPress={() => router.replace("/email-login")}>
            <ThemedText variant="subhead" style={{ textAlign: "center" }}>
              이미 계정이 있나요? 로그인
            </ThemedText>
          </PressableScale>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    flexGrow: 1,
    padding: spacing.ml,
    paddingTop: spacing.xl,
    gap: spacing.xl,
  },
  header: { gap: spacing.sm },
  form: { gap: spacing.sm },
  input: {
    minHeight: 56,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  field: { flex: 1, paddingVertical: spacing.md },
  cta: {
    minHeight: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xs,
  },
});
