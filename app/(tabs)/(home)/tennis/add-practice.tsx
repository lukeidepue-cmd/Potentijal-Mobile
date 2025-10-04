// app/(tabs)/(home)/tennis/add-practice.tsx
import React from "react";
import { ScrollView, Text, View, Pressable } from "react-native";
import { router } from "expo-router";
import { theme } from "../../../../constants/theme";

export default function TennisAddPractice() {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.bg0 }}
      contentContainerStyle={{ padding: theme.layout.xl, gap: theme.layout.lg }}
    >
      <Text style={{ color: theme.colors.textHi, fontSize: 24, fontWeight: "900" }}>
        Add Team Practice (placeholder)
      </Text>
      <Text style={{ color: theme.colors.textLo, fontWeight: "700" }}>
        Placeholder screen — same style as other sports.
      </Text>

      <View style={{ height: 14 }} />
      <Pressable
        onPress={() => router.back()}
        style={{
          alignSelf: "flex-start",
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
