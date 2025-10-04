// app/(tabs)/(home)/hockey/add-game.tsx
import React from "react";
import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";
import { theme } from "../../../../constants/theme";

export default function HockeyAddGame() {
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg0, padding: theme.layout.xl, gap: 12 }}>
      <Text style={{ color: theme.colors.textHi, fontSize: 22, fontWeight: "900" }}>Add Game (Hockey)</Text>
      <Text style={{ color: theme.colors.textLo }}>
        Placeholder screen. We’ll wire this to your real form later.
      </Text>

      <Pressable
        onPress={() => router.back()}
        style={{
          alignSelf: "flex-start",
          marginTop: 10,
          paddingVertical: 10,
          paddingHorizontal: 14,
          backgroundColor: theme.colors.surface1,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: theme.colors.strokeSoft,
        }}
      >
        <Text style={{ color: theme.colors.textHi, fontWeight: "800" }}>← Back</Text>
      </Pressable>
    </View>
  );
}
