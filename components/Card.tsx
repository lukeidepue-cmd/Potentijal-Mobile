// components/Card.tsx
import React from "react";
import { View, StyleProp, ViewStyle, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "@/constants/theme";

type Props = {
  children: React.ReactNode;
  padded?: boolean;
  flush?: boolean;
  accent?: boolean;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
};

function Card({ children, padded = true, flush = false, accent = false, style, onPress }: Props) {
  const CardContent = () => (
    <View
      style={[
        {
          backgroundColor: theme.colors.surface1,
          borderRadius: theme.radii.lg,
          borderWidth: 1,
          borderColor: theme.colors.strokeSoft,
          overflow: "hidden",
          ...(padded && !flush ? { padding: theme.layout.lg } : null),
          ...(flush ? { padding: 0 } : null),
          ...theme.shadow.soft,
          ...(accent ? { 
            shadowColor: theme.colors.primary600,
            shadowOpacity: 0.3,
            shadowRadius: 16,
            elevation: 8,
          } : null),
        },
        style,
      ]}
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

      {/* Top inner highlight */}
      <LinearGradient
        colors={[theme.topHighlight.gradientFrom, theme.topHighlight.gradientTo]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 1,
        }}
      />

      {children}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
          transform: [{ scale: pressed ? 0.98 : 1 }],
        })}
      >
        <CardContent />
      </Pressable>
    );
  }

  return <CardContent />;
}

export default Card;
export { Card };

