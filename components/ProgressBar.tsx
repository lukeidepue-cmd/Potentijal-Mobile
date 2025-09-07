// components/ProgressBar.tsx
import React from "react";
import { View, StyleProp, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "@/constants/theme";

type Props = {
  value: number;               // 0..1 (clamp internally)
  height?: number;             // default 10
  barColor?: string;           // default theme.colors.primary600
  trackColor?: string;         // default theme.colors.surface2 or neutral
  rounded?: number;            // default theme.radii.md
  // Back-compat:
  color?: string;              // alias of barColor (do NOT error if used)
};

function ProgressBar({
  value,
  height = 10,
  barColor,
  trackColor,
  rounded,
  color,
}: Props) {
  const v = Math.max(0, Math.min(1, value));
  const fill = barColor ?? color ?? theme.colors.primary600;
  const track = trackColor ?? theme.colors.surface2;
  const radius = rounded ?? theme.radii.md;

  return (
    <View
      style={{
        height,
        borderRadius: radius,
        backgroundColor: track,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: theme.colors.strokeSoft,
        ...theme.shadow.soft,
      } as StyleProp<ViewStyle>}
    >
      <View
        style={{
          width: `${v * 100}%`,
          height: "100%",
          backgroundColor: fill,
          borderRadius: radius,
        } as StyleProp<ViewStyle>}
      />
    </View>
  );
}

export default ProgressBar;
export { ProgressBar };



