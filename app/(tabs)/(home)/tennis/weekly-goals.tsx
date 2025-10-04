// app/(tabs)/(home)/tennis/weekly-goals.tsx
import React from "react";
import { ScrollView, Text, Pressable } from "react-native";
import { router } from "expo-router";
import { theme } from "../../../../constants/theme";

export default function TennisWeeklyGoals() {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.bg0 }}
      contentContainerStyle={{ padding: theme.layout.xl, gap: theme.layout.lg }}
    >
      <Text style={{ color: theme.colors.textHi, fontSize: 24, fontWeight: "900" }}>
        Weekly Goals (placeholder)
      </Text>
      <Text style={{ color: theme.colors.textLo, fontWeight: "700" }}>
        Define tennis goals here (Aces, 1st Serve %, Matches, etc.).
      </Text>

      <Pressable
        onPress={() => router.back()}
        style={{
          alignSelf: "flex-start",
          marginTop: 12,
          backgroundColor: theme.colors.primary600,
          borderRadius: 12,
          paddingHorizontal: 16,
          paddingVertical: 10,
        }}
      >
        <Text style={{ color: "#052d1b", fontWeight: "900" }}>Done</Text>
      </Pressable>
    </ScrollView>
  );
}
