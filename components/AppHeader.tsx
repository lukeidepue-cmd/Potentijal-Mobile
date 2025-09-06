// components/AppHeader.tsx
import React from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import theme from "@/constants/theme";

type IconSpec = {
  lib: "ion";
  name: keyof typeof Ionicons.glyphMap;
  color?: string;
};

type Props = {
  title: string;
  icon?: IconSpec;
  right?: React.ReactNode;
  onPressIcon?: () => void;
};

function AppHeader({ title, icon, right, onPressIcon }: Props) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 10,
      }}
    >
      {/* Left icon (optional) */}
      <View style={{ width: 52 }}>
        {icon ? (
          <Pressable
            onPress={onPressIcon}
            style={({ pressed }) => ({
              width: 44,
              height: 44,
              borderRadius: theme.radii.full,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: pressed ? "#0d1117" : "#0a0f14",
              borderWidth: 1,
              borderColor: theme.colors.strokeSoft,
            })}
          >
            <Ionicons
              name={icon.name}
              size={22}
              color={icon.color ?? theme.color.text}
            />
          </Pressable>
        ) : null}
      </View>

      {/* Title */}
      <Text
        style={{
          color: theme.color.text,
          fontSize: 20,
          fontWeight: "900",
          textAlign: "center",
          flex: 1,
        }}
        numberOfLines={1}
      >
        {title}
      </Text>

      {/* Right accessory (optional) */}
      <View style={{ width: 52, alignItems: "flex-end" }}>{right}</View>
    </View>
  );
}

export default AppHeader;
export { AppHeader };


