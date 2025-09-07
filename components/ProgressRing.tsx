import React from "react";
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from "react-native-svg";
import { View, Text } from "react-native";
import { theme } from "@/constants/theme";

type Props = {
  size?: number;
  progress: number;            // 0..1
  strokeWidth?: number;
  /** preferred name */
  color?: string;
  /** aliases accepted by callers */
  progressColor?: string;
  baseColor?: string;
  trackColor?: string;
  centerText?: string;
  label?: string;
  variant?: "brand" | "warn" | "neutral";
};

export default function ProgressRing({
  size = 180,
  strokeWidth = 14,
  progress,
  color,
  progressColor,
  baseColor,
  trackColor,
  centerText,
  label,
  variant = "brand",
}: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(1, progress));
  const offset = circumference * (1 - clamped);

  const resolvedTrack = trackColor ?? baseColor ?? theme.colors.surface2;

  // Decide the gradient colors
  let grad: string[];
  const explicit = progressColor ?? color;
  if (explicit) {
    grad = [explicit, explicit];
  } else {
    switch (variant) {
      case "warn":
        grad = [theme.colors.warning, theme.colors.secondary500];
        break;
      case "neutral":
        grad = [theme.colors.textLo, theme.colors.strokeSoft];
        break;
      case "brand":
      default:
        grad = Array.from(theme.gradients.brand);
        break;
    }
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
        ...theme.shadow.soft,
      }}
    >
      {label ? (
        <Text
          style={{
            position: "absolute",
            top: 8,
            ...theme.text.label,
            color: theme.colors.textLo,
          }}
        >
          {label}
        </Text>
      ) : null}

      <Svg width={size} height={size}>
        <Defs>
          <SvgLinearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={grad[0]} />
            <Stop offset="100%" stopColor={grad[1] ?? grad[0]} />
          </SvgLinearGradient>
        </Defs>

        {/* Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={resolvedTrack}
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Progress */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#progressGradient)"
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
        <Text
          style={{
            position: "absolute",
            ...theme.text.title,
            color: theme.colors.textHi,
          }}
        >
          {centerText}
        </Text>
      ) : null}
    </View>
  );
}


