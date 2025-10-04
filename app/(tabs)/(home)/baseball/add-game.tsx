// app/(tabs)/(home)/baseball/add-game.tsx
import React from "react";
import { View, Text, ScrollView } from "react-native";
import { theme } from "../../../../constants/theme";

export default function AddBaseballGame() {
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
        Log Game (Baseball)
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
          Stub screen — we’ll add fields (AB, H, 2B/3B/HR, BB, SO, R, RBI, etc.) later.
        </Text>
      </View>
    </ScrollView>
  );
}
