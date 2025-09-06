// app/(tabs)/(home)/basketball/weekly-goals.tsx
import React, { useState } from "react";
import { SafeAreaView, View, Text, Pressable, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";

import { theme } from "../../../../constants/theme";
import { Card } from "../../../../components/Card";            // named export
import { PrimaryButton } from "../../../../components/Button"; // named export
import ProgressBar from "../../../../components/ProgressBar";  // default import

type Goal = { id: string; label: string; pct: number };
const uid = () => Math.random().toString(36).slice(2, 9);

export default function WeeklyGoalsScreen() {
  const [goals, setGoals] = useState<Goal[]>([
    { id: uid(), label: "200 3PT", pct: 0.5 },
    { id: uid(), label: "4 Workouts", pct: 0.75 },
    { id: uid(), label: "200 2PT", pct: 0.3 },
  ]);

  const addGoal = () => {
    Haptics.selectionAsync();
    setGoals((g) => [{ id: uid(), label: "New goal", pct: 0 }, ...g]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.color.bg }}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", padding: 16, gap: 8 }}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={{
            width: 40, height: 40, borderRadius: 10,
            alignItems: "center", justifyContent: "center",
            backgroundColor: "#0f1317", borderWidth: 1, borderColor: "#1a222b",
          }}
        >
          <Ionicons name="chevron-back" size={20} color={theme.color.text} />
        </Pressable>
        <Text style={{ color: theme.color.text, fontSize: 20, fontWeight: "900" }}>
          Weekly Goals
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}
      >
        <Card>
          <Text style={{ fontSize: 20, fontWeight: "900", color: "#111", marginBottom: 12 }}>
            Your Goals
          </Text>

          <View style={{ gap: 14 }}>
            {goals.map((g) => {
              const clamped = Math.max(0, Math.min(1, g.pct));
              return (
                <View key={g.id} style={{ gap: 6 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <Text style={{ color: "#111", fontWeight: "800", flex: 1 }} numberOfLines={1}>
                      {g.label}
                    </Text>
                    <Text style={{ color: "#111", fontWeight: "900" }}>
                      {Math.round(clamped * 100)}%
                    </Text>
                  </View>
                  {/* Removed 'showPct' prop to match ProgressBarProps */}
                  <ProgressBar value={clamped} height={12} />
                </View>
              );
            })}
          </View>

          <View style={{ alignItems: "flex-end", marginTop: 14 }}>
            <PrimaryButton label="+ Add Weekly Goal" onPress={addGoal} />
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}





