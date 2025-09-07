// components/StatBlock.tsx
import React from "react";
import { View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "@/constants/theme";

type Props = {
  label: string;
  value: string;
  color?: string;
  progress?: number; // 0..1 for micro progress bar
  icon?: React.ReactNode;
};

function StatBlock({ label, value, color, progress, icon }: Props) {
  const barColor = color ?? theme.colors.secondary500;
  const progressValue = progress ?? 0.6; // default 60% if not provided
  
  return (
    <View
      style={{
        borderRadius: theme.radii.lg,
        backgroundColor: theme.colors.surface2,
        borderWidth: 1,
        borderColor: theme.colors.strokeSoft,
        padding: theme.layout.lg,
        ...theme.shadow.soft,
        overflow: "hidden",
      }}
    >
      {/* Subtle gradient overlay */}
      <LinearGradient
        colors={theme.gradients.surface}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />

      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <View style={{ flex: 1 }}>
          <Text style={{ 
            color: theme.colors.textLo, 
            ...theme.text.muted,
          }}>
            {label}
          </Text>
          <Text
            style={{
              color: theme.colors.textHi,
              ...theme.text.h2,
              marginTop: theme.layout.xs,
            }}
          >
            {value}
          </Text>
        </View>
        
        {icon && (
          <View style={{ marginLeft: theme.layout.sm }}>
            {icon}
          </View>
        )}
      </View>

      {/* Micro progress bar */}
      <View
        style={{
          height: 6,
          borderRadius: theme.radii.pill,
          backgroundColor: theme.colors.surface1,
          overflow: "hidden",
          marginTop: theme.layout.lg,
          borderWidth: 1,
          borderColor: theme.colors.strokeSoft,
        }}
      >
        <View
          style={{
            width: `${Math.max(0, Math.min(1, progressValue)) * 100}%`,
            height: "100%",
            borderRadius: theme.radii.pill,
            shadowColor: barColor,
            shadowOpacity: 0.4,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          <LinearGradient
            colors={[barColor, `${barColor}CC`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              width: "100%",
              height: "100%",
              borderRadius: theme.radii.pill,
            }}
          />
        </View>
      </View>
    </View>
  );
}

export default StatBlock;
export { StatBlock };

