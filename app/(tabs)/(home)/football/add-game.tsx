import React from "react";
import { View, Text } from "react-native";
import { theme } from "../../../../constants/theme";

export default function AddFootballGame() {
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg0, padding: theme.layout.xl }}>
      <Text style={{ color: "#fff", fontSize: 20, fontWeight: "800" }}>Add Football Game</Text>
      <Text style={{ color: theme.colors.textLo, marginTop: 8 }}>
        (Placeholder — we’ll wire this up later.)
      </Text>
    </View>
  );
}
