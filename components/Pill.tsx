// components/Pill.tsx
import React from "react";
import { View, Text, StyleProp, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "@/constants/theme";

type Props = {
  label: string;
  color?: string; // optional override
  style?: StyleProp<ViewStyle>;
};

function Pill({ label, color, style }: Props) {
  const c = color ?? theme.colors.primary600;
  return (
    <View
      style={[
        {
          borderRadius: theme.radii.pill,
          borderWidth: 1,
          borderColor: c,
          overflow: "hidden",
          shadowColor: c,
          shadowOpacity: 0.3,
          shadowRadius: 4,
          elevation: 2,
        },
        style,
      ]}
    >
      <LinearGradient
        colors={[`${c}20`, `${c}10`]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          paddingVertical: theme.layout.sm,
          paddingHorizontal: theme.layout.lg,
          flexDirection: "row",
          alignItems: "center",
          gap: theme.layout.sm,
        }}
      >
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: theme.radii.sm,
            backgroundColor: c,
            shadowColor: c,
            shadowOpacity: 0.6,
            shadowRadius: 2,
            elevation: 1,
          }}
        />
        <Text style={{ 
          color: theme.colors.textHi, 
          ...theme.text.label,
        }}>
          {label}
        </Text>
      </LinearGradient>
    </View>
  );
}

export default Pill;
export { Pill };

