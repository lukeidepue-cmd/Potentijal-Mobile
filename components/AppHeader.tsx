// components/AppHeader.tsx
import React from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { theme } from "@/constants/theme";

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
    <View style={{ position: "relative" }}>
      {/* Background with vignette */}
      <LinearGradient
        colors={[theme.colors.surface1, theme.colors.surface1]}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />
      
      {/* Corner vignette overlay */}
      <LinearGradient
        colors={[theme.gradients.vignetteCorners, "transparent", "transparent", theme.gradients.vignetteCorners]}
        locations={[0, 0.3, 0.7, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />

      {/* Bottom glow bar */}
      <LinearGradient
        colors={[theme.colors.primary600, theme.colors.secondary500]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 2,
          opacity: 0.1,
        }}
      />

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: theme.layout.xl,
          paddingVertical: theme.layout.lg,
        }}
      >
        {/* Left icon (optional) */}
        <View style={{ width: 52 }}>
          {icon ? (
            <Pressable
              onPress={onPressIcon}
              style={({ pressed }) => ({
                width: 48,
                height: 48,
                borderRadius: theme.radii.pill,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: pressed ? theme.colors.surface2 : theme.colors.surface1,
                borderWidth: 1,
                borderColor: theme.colors.strokeSoft,
                ...theme.shadow.soft,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              })}
            >
              {/* Inner highlight */}
              <View
                style={{
                  position: "absolute",
                  top: 1,
                  left: 1,
                  right: 1,
                  height: 12,
                  borderTopLeftRadius: theme.radii.pill,
                  borderTopRightRadius: theme.radii.pill,
                  backgroundColor: theme.topHighlight.gradientFrom,
                }}
              />
              <Ionicons
                name={icon.name}
                size={24}
                color={icon.color ?? theme.colors.textHi}
              />
            </Pressable>
          ) : null}
        </View>

        {/* Title */}
        <Text
          style={{
            color: theme.colors.textHi,
            ...theme.text.h1,
            textAlign: "center",
            flex: 1,
          }}
          numberOfLines={1}
        >
          {title}
        </Text>

        {/* Right accessory with glass bubble */}
        <View style={{ width: 52, alignItems: "flex-end" }}>
          {right ? (
            <BlurView
              intensity={16}
              tint="dark"
              style={{
                borderRadius: theme.radii.lg,
                borderWidth: 1,
                borderColor: theme.colors.strokeSoft,
                overflow: "hidden",
              }}
            >
              <View style={{ padding: theme.layout.sm }}>
                {right}
              </View>
            </BlurView>
          ) : null}
        </View>
      </View>
    </View>
  );
}

export default AppHeader;
export { AppHeader };


