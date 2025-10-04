import React, { useState } from "react";
import { View, Text, ScrollView, TextInput, Pressable, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { theme } from "../../../../constants/theme";

type Goal = { id: string; name: string; total: string };

export default function SoccerWeeklyGoals() {
  const [goals, setGoals] = useState<Goal[]>([
    { id: "g1", name: "Shots on Target", total: "60" },
    { id: "g2", name: "Workouts", total: "4" },
  ]);
  const [name, setName] = useState("");
  const [total, setTotal] = useState("");

  const add = () => {
    if (!name.trim() || !total.trim()) return;
    setGoals((g) => [...g, { id: Math.random().toString(36).slice(2, 9), name: name.trim(), total: total.trim() }]);
    setName("");
    setTotal("");
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.bg0 }}
      contentContainerStyle={{ padding: theme.layout.xl, gap: 14, paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={{ alignItems: "center", marginTop: 34 }}>
        <Text style={styles.h1}>Weekly Goals</Text>
        <View style={styles.h1Underline} />
      </View>

      {/* Existing (placeholder) list */}
      <View style={{ gap: 10 }}>
        {goals.map((g) => (
          <View
            key={g.id}
            style={{
              backgroundColor: theme.colors.surface1,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: theme.colors.strokeSoft,
              padding: 12,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            }}
          >
            <View style={{ width: 8, height: 20, borderRadius: 6, backgroundColor: theme.colors.primary600 }} />
            <Text style={{ color: theme.colors.textHi, fontWeight: "900", flex: 1 }} numberOfLines={1}>
              {g.name}
            </Text>
            <Text style={{ color: theme.colors.textHi, fontWeight: "900" }}>{g.total}</Text>
          </View>
        ))}
      </View>

      {/* Add new (placeholder form) */}
      <TextInput
        placeholder="Goal name (e.g., Completed Passes)"
        placeholderTextColor={theme.colors.textLo}
        value={name}
        onChangeText={setName}
        style={styles.input}
      />
      <TextInput
        placeholder="Weekly total (number)"
        placeholderTextColor={theme.colors.textLo}
        keyboardType="numeric"
        value={total}
        onChangeText={(t) => setTotal(t.replace(/[^\d]/g, ""))}
        style={styles.input}
      />

      <View style={{ flexDirection: "row", gap: 10, justifyContent: "flex-end" }}>
        <Pressable onPress={add}>
          <LinearGradient colors={["#0ddc45", "#258ac4"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cta}>
            <Text style={styles.ctaText}>+ Add Goal</Text>
          </LinearGradient>
        </Pressable>
        <Pressable onPress={() => router.back()}>
          <View style={[styles.cta, { backgroundColor: "#0B121A", borderWidth: 1, borderColor: theme.colors.strokeSoft }]}>
            <Text style={{ color: theme.colors.textHi, fontWeight: "900" }}>Done</Text>
          </View>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  h1: { color: theme.colors.textHi, fontSize: 30, fontWeight: "900" },
  h1Underline: { height: 4, alignSelf: "stretch", backgroundColor: theme.colors.primary600, borderRadius: 999, marginTop: 6 },
  input: {
    backgroundColor: "#0C1016",
    color: theme.colors.textHi,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.strokeSoft,
  },
  cta: { borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10 },
  ctaText: { color: "#052d1b", fontWeight: "900" },
});
