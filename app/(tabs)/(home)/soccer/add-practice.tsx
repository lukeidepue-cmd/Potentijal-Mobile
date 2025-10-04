import React, { useState } from "react";
import { View, Text, ScrollView, TextInput, Pressable, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { theme } from "../../../../constants/theme";

export default function AddSoccerPractice() {
  const [focus, setFocus] = useState("");
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.bg0 }}
      contentContainerStyle={{ padding: theme.layout.xl, gap: 14, paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={{ alignItems: "center", marginTop: 34 }}>
        <Text style={styles.h1}>Add Practice</Text>
        <View style={styles.h1Underline} />
      </View>

      <TextInput
        placeholder="Focus (e.g., Passing, Finishing, Agility)"
        placeholderTextColor={theme.colors.textLo}
        value={focus}
        onChangeText={setFocus}
        style={styles.input}
      />
      <TextInput
        placeholder="Duration (min)"
        placeholderTextColor={theme.colors.textLo}
        keyboardType="numeric"
        value={duration}
        onChangeText={(t) => setDuration(t.replace(/[^\d]/g, ""))}
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
          <Text style={styles.ctaText}>Save Practice</Text>
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
