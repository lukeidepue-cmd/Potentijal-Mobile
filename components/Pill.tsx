// components/Pill.tsx
import React from "react";
import { View, Text, StyleProp, ViewStyle } from "react-native";
import theme from "@/constants/theme";

type Props = {
  label: string;
  color?: string; // optional override
  style?: StyleProp<ViewStyle>;
};

function Pill({ label, color, style }: Props) {
  const c = color ?? theme.colors.purple; // we added purple to theme.colors
  return (
    <View
      style={[
        {
          paddingVertical: 8,
          paddingHorizontal: 12,
          borderRadius: theme.radii.full,
          backgroundColor: "rgba(255,255,255,0.02)",
          borderWidth: 1,
          borderColor: theme.colors.strokeSoft,
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
        },
        style,
      ]}
    >
      <View
        style={{
          width: 10,
          height: 10,
          borderRadius: 2,
          backgroundColor: c,
        }}
      />
      <Text style={{ color: theme.color.text, fontWeight: "800" }}>{label}</Text>
    </View>
  );
}

export default Pill;
export { Pill };

