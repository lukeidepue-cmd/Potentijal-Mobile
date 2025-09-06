// components/Card.tsx
import React from "react";
import { View, StyleProp, ViewStyle } from "react-native";
import theme from "@/constants/theme";

type Props = {
  children: React.ReactNode;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
};

function Card({ children, padded = true, style }: Props) {
  return (
    <View
      style={[
        {
          backgroundColor: theme.colors.surface1,
          borderRadius: theme.radii.lg,
          borderWidth: 1,
          borderColor: theme.colors.strokeSoft,
          overflow: "hidden",
          ...(padded ? { padding: 12 } : null),
          ...theme.shadow.soft,
        },
        style,
      ]}
    >
      {/* Faux top highlight (subtle) */}
      <View style={{ height: 10, backgroundColor: "rgba(255,255,255,0.03)" }} />
      {children}
    </View>
  );
}

export default Card;
export { Card };

