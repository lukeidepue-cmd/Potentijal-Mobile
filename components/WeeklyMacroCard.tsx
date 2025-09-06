// components/WeeklyMacroCard.tsx
import React from "react";
import { View, Text, Pressable } from "react-native";
import type { MacroKey } from "./MacroBoxes";

type Props = {
  macro: MacroKey;                 // "calories" | "protein" | "carbs" | "fat"
  color: string;                   // display color for current macro
  // We'll wire these later:
  avgThisWeek?: number | null;     // 7-day average for selected macro (this week)
  avgLastWeek?: number | null;     // 7-day average (last week) for % trend
  onPressDetails?: () => void;     // optional: open details screen later
};

export default function WeeklyMacroCard({
  macro,
  color,
  avgThisWeek = null,
  avgLastWeek = null,
  onPressDetails,
}: Props) {
  // Unit label per macro
  const unit = macro === "calories" ? "kcal" : "g";

  // Placeholder text since we'll compute later
  const hasData = avgThisWeek != null && avgLastWeek != null;

  // Basic % diff (guard for later when we wire data)
  let pctText = "—% vs last week";
  if (hasData && avgLastWeek && avgLastWeek !== 0) {
    const pct = ((avgThisWeek! - avgLastWeek) / avgLastWeek) * 100;
    const arrow = pct > 0 ? "▲" : pct < 0 ? "▼" : "—";
    pctText = `${arrow} ${Math.abs(pct).toFixed(0)}% vs last week`;
  }

  return (
    <Pressable
      onPress={onPressDetails}
      style={({ pressed }) => ({
        padding: 16,
        borderRadius: 16,
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#e8e8e8",
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
        opacity: pressed ? 0.96 : 1,
      })}
    >
      <Text style={{ fontSize: 12, fontWeight: "800", color: "#666", marginBottom: 8 }}>
        Weekly Average
      </Text>

      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
        <View
          style={{
            width: 10,
            height: 10,
            borderRadius: 2,
            backgroundColor: color,
            marginTop: 2,
          }}
        />
        <Text style={{ fontSize: 18, fontWeight: "900", color: "#111", textTransform: "capitalize" }}>
          {macro}
        </Text>
      </View>

      <Text style={{ marginTop: 6, fontSize: 16, fontWeight: "700", color: "#111" }}>
        {hasData ? `${Math.round(avgThisWeek!)} ${unit} (7-day avg)` : `— ${unit} (7-day avg)`}
      </Text>

      <Text style={{ marginTop: 2, fontSize: 13, fontWeight: "700", color: "#777" }}>
        {hasData ? pctText : "—% vs last week"}
      </Text>

      <Text style={{ marginTop: 10, fontSize: 12, color: "#999" }}>
        (We’ll compute this automatically once we wire up history.)
      </Text>
    </Pressable>
  );
}
