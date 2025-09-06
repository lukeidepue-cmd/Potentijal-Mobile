// components/ListItem.tsx
import React from "react";
import { View, Text, Pressable } from "react-native";
import theme from "@/constants/theme";

type Props = {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
};

function ListItem({ title, subtitle, right, onPress }: Props) {
  const Content = (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 12,
        backgroundColor: theme.colors.surface2,
        borderWidth: 1,
        borderColor: theme.colors.strokeSoft,
        borderRadius: theme.radii.md,
        ...theme.shadow.soft,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.color.text, fontWeight: "800" }}>
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={{ color: theme.color.dim, marginTop: 2 }}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
    </View>
  );

  return onPress ? (
    <Pressable onPress={onPress}>{Content}</Pressable>
  ) : (
    Content
  );
}

export default ListItem;
export { ListItem };
