// components/MacroBoxes.tsx
import React from "react";
import { View, Text, Pressable } from "react-native";

export type MacroKey = "calories" | "protein" | "carbs" | "fat";

type Props = {
  active: MacroKey;
  totals: { calories: number; protein: number; carbs: number; fat: number };
  goals:  { calories: number; protein: number; carbs: number; fat: number };
  colors: Record<MacroKey, string>;
  onSelect?: (m: MacroKey) => void;
};

export default function MacroBoxes({ active, totals, goals, colors, onSelect }: Props) {
  const rows: Array<{ key: MacroKey; label: string }> = [
    { key: "calories", label: "Calories" },
    { key: "protein",  label: "Protein"  },
    { key: "fat",      label: "Fats"     },
    { key: "carbs",    label: "Carbs"    },
  ];

  const valueText = (key: MacroKey) => {
    switch (key) {
      case "calories": return `${Math.round(totals.calories)} / ${goals.calories} kcal`;
      case "protein":  return `${Math.round(totals.protein)} / ${goals.protein} g`;
      case "carbs":    return `${Math.round(totals.carbs)} / ${goals.carbs} g`;
      case "fat":      return `${Math.round(totals.fat)} / ${goals.fat} g`;
    }
  };

  return (
    <View style={{ gap: 10, alignSelf: "stretch" }}>
      {rows.map(({ key, label }) => {
        const isActive = key === active;
        return (
          <Pressable
            key={key}
            onPress={() => onSelect?.(key)}
            style={({ pressed }) => ({
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderRadius: 12,
              backgroundColor: "#fff",
              borderWidth: isActive ? 2 : 1,
              borderColor: isActive ? colors[key] : "#e8e8e8",
              opacity: pressed ? 0.95 : 1,
              shadowColor: "#000",
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 2,
            })}
          >
            {/* Top row: color square + label */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 4,
                  backgroundColor: colors[key],
                }}
              />
              <Text style={{ fontSize: 15, fontWeight: "800", color: "#111" }}>{label}</Text>
            </View>

            {/* Bottom line: value under the label (no overflow) */}
            <Text style={{ marginTop: 4, fontSize: 13, fontWeight: "700", color: "#666" }}>
              {valueText(key)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
