import React, { useState } from "react";
import { View, Text, ScrollView, TextInput, Pressable, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { theme } from "../../../../constants/theme";

export default function AddSoccerGame() {
  const [opponent, setOpponent] = useState("");
  const [goalsUs, setGoalsUs] = useState("");
  const [goalsThem, setGoalsThem] = useState("");
  const [minutes, setMinutes] = useState("");
  const [notes, setNotes] = useState("");

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.bg0 }}
      contentContainerStyle={{ padding: theme.layout.xl, gap: 14, paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={{ alignItems: "center", marginTop: 34 }}>
        <Text style={styles.h1}>Add Game</Text>
        <View style={styles.h1Underline} />
      </View>

      <TextInput
        placeholder="Opponent"
        placeholderTextColor={theme.colors.textLo}
        value={opponent}
        onChangeText={setOpponent}
        style={styles.input}
      />
      <View style={{ flexDirection: "row", gap: 10 }}>
        <TextInput
          placeholder="Goals (You)"
          placeholderTextColor={theme.colors.textLo}
          keyboardType="numeric"
          value={goalsUs}
          onChangeText={(t) => setGoalsUs(t.replace(/[^\d]/g, ""))}
          style={[styles.input, { flex: 1 }]}
        />
        <TextInput
          placeholder="Goals (Opp.)"
          placeholderTextColor={theme.colors.textLo}
          keyboardType="numeric"
          value={goalsThem}
          onChangeText={(t) => setGoalsThem(t.replace(/[^\d]/g, ""))}
          style={[styles.input, { flex: 1 }]}
        />
      </View>
      <TextInput
        placeholder="Minutes played"
        placeholderTextColor={theme.colors.textLo}
        keyboardType="numeric"
        value={minutes}
        onChangeText={(t) => setMinutes(t.replace(/[^\d]/g, ""))}
        style={styles.input}
      />
      <TextInput
        placeholder="Notes"
        placeholderTextColor={theme.colors.textLo}
        value={notes}
        onChangeText={setNotes}
        style={[styles.input, { height: 120, textAlignVertical: "top" }]}
        multiline
      />

      <Pressable onPress={() => router.back()} style={{ alignSelf: "flex-end", marginTop: 8 }}>
        <LinearGradient
          colors={["#0ddc45", "#258ac4"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cta}
        >
          <Text style={styles.ctaText}>Save Game</Text>
        </LinearGradient>
      </Pressable>
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
  cta: { borderRadius: 999, paddingHorizontal: 18, paddingVertical: 12 },
  ctaText: { color: "#052d1b", fontWeight: "900" },
});
