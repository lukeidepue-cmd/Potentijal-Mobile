// components/StatBlock.tsx
import React from "react";
import { View, Text } from "react-native";
import theme from "@/constants/theme";

type Props = {
  label: string;
  value: string;
  color?: string;
};

function StatBlock({ label, value, color }: Props) {
  const barColor = color ?? theme.colors.secondary500; // use 500, not 400
  return (
    <View
      style={{
        borderRadius: theme.radii.md,
        backgroundColor: theme.colors.surface2,
        borderWidth: 1,
        borderColor: theme.colors.strokeSoft,
        padding: 12,
      }}
    >
      <Text style={{ color: theme.color.dim, fontWeight: "700" }}>{label}</Text>
      <Text
        style={{
          color: theme.color.text,
          fontWeight: "900",
          marginTop: 6,
          fontSize: 18,
        }}
      >
        {value}
      </Text>
      <View
        style={{
          height: 8,
          borderRadius: theme.radii.full,
          backgroundColor: "rgba(255,255,255,0.06)",
          overflow: "hidden",
          marginTop: 10,
          borderWidth: 1,
          borderColor: theme.colors.strokeSoft,
        }}
      >
        <View
          style={{
            width: "60%",
            height: "100%",
            backgroundColor: barColor,
          }}
        />
      </View>
    </View>
  );
}

export default StatBlock;
export { StatBlock };

