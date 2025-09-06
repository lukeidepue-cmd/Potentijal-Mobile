// components/ProgressBar.tsx
import React from "react";
import { View } from "react-native";
import theme from "@/constants/theme";

type Props = {
  value: number;            // 0..1
  height?: number;          // optional
  barColor?: string;        // optional
  backgroundColor?: string; // optional
};

function ProgressBar({
  value,
  height = 10,
  barColor = theme.colors.secondary500,
  backgroundColor = "rgba(255,255,255,0.06)",
}: Props) {
  const v = Math.max(0, Math.min(1, value));
  return (
    <View
      style={{
        height,
        borderRadius: theme.radii.full,
        backgroundColor,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: theme.colors.strokeSoft,
      }}
    >
      <View
        style={{
          width: `${v * 100}%`,
          height: "100%",
          backgroundColor: barColor,
        }}
      />
    </View>
  );
}

export default ProgressBar;
export { ProgressBar };



