// components/Button.tsx
import React from "react";
import { Pressable, Text, ViewStyle, StyleProp } from "react-native";
import theme from "@/constants/theme";

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: "primary" | "hollow";
  style?: StyleProp<ViewStyle>;
};

function PrimaryButton({
  label,
  onPress,
  disabled,
  variant = "primary",
  style,
}: Props) {
  const isHollow = variant === "hollow";
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        {
          paddingVertical: 10,
          paddingHorizontal: 14,
          borderRadius: theme.radii.md,
          borderWidth: isHollow ? 1 : 0,
          borderColor: isHollow ? theme.colors.strokeSoft : "transparent",
          backgroundColor: isHollow
            ? pressed
              ? "#0E141C"
              : "#0B121A"
            : pressed
            ? theme.colors.primary700
            : theme.colors.primary600,
          opacity: disabled ? 0.6 : 1,
          alignItems: "center",
          justifyContent: "center",
          ...theme.shadow.soft,
        },
        style,
      ]}
    >
      <Text
        style={{
          color: isHollow ? theme.color.text : "#052d1b",
          fontWeight: "900",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default PrimaryButton;
export { PrimaryButton };


