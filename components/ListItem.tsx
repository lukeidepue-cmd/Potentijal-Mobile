// components/ListItem.tsx
import React from "react";
import { View, Text, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "@/constants/theme";

type Props = {
  title: string;
  subtitle?: string;
  brand?: string;
  right?: React.ReactNode;
  onPress?: () => void;
};

function ListItem({ title, subtitle, brand, right, onPress }: Props) {
  const Content = (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: theme.layout.lg,
        paddingHorizontal: theme.layout.lg,
        backgroundColor: theme.colors.surface2,
        borderWidth: 1,
        borderColor: theme.colors.strokeSoft,
        borderRadius: theme.radii.lg,
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

      <View style={{ flex: 1 }}>
        <Text style={{ 
          color: theme.colors.textHi, 
          ...theme.text.title,
        }}>
          {title}
        </Text>
        {brand ? (
          <Text
            style={{ 
              color: theme.colors.textLo, 
              ...theme.text.muted,
              marginTop: theme.layout.xs,
            }}
            numberOfLines={1}
          >
            {brand}
          </Text>
        ) : subtitle ? (
          <Text
            style={{ 
              color: theme.colors.textLo, 
              ...theme.text.muted,
              marginTop: theme.layout.xs,
            }}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      
      {right && (
        <View style={{ 
          backgroundColor: theme.colors.primary600,
          paddingHorizontal: theme.layout.sm,
          paddingVertical: theme.layout.xs,
          borderRadius: theme.radii.pill,
          borderWidth: 1,
          borderColor: theme.colors.primary600,
          shadowColor: theme.colors.primary600,
          shadowOpacity: 0.3,
          shadowRadius: 4,
          elevation: 2,
        }}>
          {right}
        </View>
      )}
    </View>
  );

  return onPress ? (
    <Pressable 
      onPress={onPress}
      style={({ pressed }) => ({
        transform: [{ scale: pressed ? 0.98 : 1 }],
      })}
    >
      {Content}
    </Pressable>
  ) : (
    Content
  );
}

export default ListItem;
export { ListItem };
