// components/Button.tsx
import React from "react";
import { Pressable, Text, ViewStyle, StyleProp } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "@/constants/theme";

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary";
  iconLeft?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

function PrimaryButton({
  label,
  onPress,
  disabled,
  variant = "primary",
  iconLeft,
  style,
}: Props) {
  const isSecondary = variant === "secondary";
  
  if (isSecondary) {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [
          {
            paddingVertical: theme.layout.lg,
            paddingHorizontal: theme.layout.xl,
            borderRadius: theme.radii.pill,
            borderWidth: 1,
            borderColor: theme.colors.primary600,
            backgroundColor: pressed ? "rgba(23, 214, 127, 0.08)" : "transparent",
            opacity: disabled ? 0.6 : 1,
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: theme.layout.sm,
            shadowColor: theme.colors.primary600,
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 4,
            transform: [{ scale: pressed ? 0.98 : 1 }],
          },
          style,
        ]}
      >
        {iconLeft}
        <Text
          style={{
            color: theme.colors.textHi,
            ...theme.text.label,
          }}
        >
          {label}
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        {
          borderRadius: theme.radii.pill,
          opacity: disabled ? 0.6 : 1,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: theme.layout.sm,
          shadowColor: theme.colors.primary600,
          shadowOpacity: pressed ? 0.4 : 0.3,
          shadowRadius: pressed ? 20 : 16,
          elevation: pressed ? 12 : 8,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
        style,
      ]}
    >
      <LinearGradient
        colors={theme.gradients.brand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          paddingVertical: theme.layout.lg,
          paddingHorizontal: theme.layout.xl,
          borderRadius: theme.radii.pill,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: theme.layout.sm,
        }}
      >
        {iconLeft}
        <Text
          style={{
            color: "#FFFFFF",
            ...theme.text.label,
          }}
        >
          {label}
        </Text>
      </LinearGradient>
    </Pressable>
  );
}

export default PrimaryButton;
export { PrimaryButton };


