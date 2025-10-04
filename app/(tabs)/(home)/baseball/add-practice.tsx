// app/(tabs)/(home)/baseball/add-practice.tsx
import React from "react";
import { View, Text, ScrollView } from "react-native";
import { theme } from "../../../../constants/theme";

export default function AddBaseballPractice() {
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
        Log Team Practice (Baseball)
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
          Stub screen — later we’ll add volume counters for hitting, throwing, fielding.
        </Text>
      </View>
    </ScrollView>
  );
}
