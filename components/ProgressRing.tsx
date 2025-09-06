import React from "react";
import Svg, { Circle } from "react-native-svg";
import { View, Text } from "react-native";

type Props = {
  size?: number;
  strokeWidth?: number;
  progress: number;           // 0..1
  baseColor?: string;         // track color
  progressColor?: string;     // filled arc color
  label?: string;             // small caption above
  centerText?: string;        // big text in the middle
};

export default function ProgressRing({
  size = 180,
  strokeWidth = 14,
  progress,
  baseColor = "#FFFFFF",        // white track as requested
  progressColor = "#111111",
  label,
  centerText,
}: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(1, progress));
  const offset = circumference * (1 - clamped);

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      {label ? (
        <Text style={{ position: "absolute", top: 8, fontSize: 12, color: "#666" }}>{label}</Text>
      ) : null}
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={baseColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={progressColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          rotation="-90"
          originX={size / 2}
          originY={size / 2}
        />
      </Svg>
      {centerText ? (
        <Text style={{ position: "absolute", fontSize: 22, fontWeight: "900", color: "#111" }}>
          {centerText}
        </Text>
      ) : null}
    </View>
  );
}
