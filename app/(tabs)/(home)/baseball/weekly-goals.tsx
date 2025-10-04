// app/(tabs)/(home)/baseball/weekly-goals.tsx
import React from "react";
import { View, Text, ScrollView } from "react-native";
import { theme } from "../../../../constants/theme";

export default function BaseballWeeklyGoals() {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.bg0 }}
      contentContainerStyle={{
        paddingHorizontal: theme.layout.xl,
        paddingTop: 34,
        paddingBottom: 40,
        gap: theme.layout.lg,
      }}
    >
      <Text style={{ color: theme.colors.textHi, fontSize: 28, fontWeight: "900" }}>
        Weekly Goals (Baseball)
      </Text>

      <View
        style={{
          backgroundColor: theme.colors.surface1,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: theme.colors.strokeSoft,
          padding: 16,
        }}
      >
        <Text style={{ color: theme.colors.textLo, fontWeight: "800" }}>
          We’ll wire this up when the data layer is ready. For now, this is a
          placeholder screen so navigation works smoothly.
        </Text>
      </View>
    </ScrollView>
  );
}
