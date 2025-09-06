// app/(tabs)/workouts-history.tsx
import React, { useMemo, useState } from "react";
import { SafeAreaView, View, Text, Pressable, ScrollView } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";

import { Card } from "../../components/Card";
import { theme } from "../../constants/theme";

type ModeKey = "lifting" | "basketball" | "running" | "football" | "soccer" | "baseball" | "hockey";
type Item = { id: string; mode: ModeKey; name: string; whenISO: string };

const iconFor: Record<ModeKey, React.ReactNode> = {
  lifting: <MaterialCommunityIcons name="dumbbell" size={14} color="#111" />,
  basketball: <Ionicons name="basketball-outline" size={14} color="#111" />,
  running: <MaterialCommunityIcons name="run" size={14} color="#111" />,
  football: <Ionicons name="american-football-outline" size={14} color="#111" />,
  soccer: <Ionicons name="football-outline" size={14} color="#111" />,
  baseball: <MaterialCommunityIcons name="baseball" size={14} color="#111" />,
  hockey: <MaterialCommunityIcons name="hockey-sticks" size={14} color="#111" />,
};

const seed: Item[] = [
  { id: "a1", mode: "lifting", name: "Shoulders & Biceps", whenISO: new Date(Date.now() - 86400000 * 1).toISOString() },
  { id: "a2", mode: "lifting", name: "Legs", whenISO: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: "b1", mode: "basketball", name: "3-Point Shots", whenISO: new Date(Date.now() - 86400000 * 1).toISOString() },
  { id: "b2", mode: "basketball", name: "Shooting Drills", whenISO: new Date(Date.now() - 86400000 * 4).toISOString() },
  { id: "r1", mode: "running", name: "3.1 mi @ 8:27/mi", whenISO: new Date(Date.now() - 86400000 * 1).toISOString() },
  { id: "bs1", mode: "baseball", name: "Hitting", whenISO: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: "hk1", mode: "hockey", name: "Skating speed", whenISO: new Date(Date.now() - 86400000 * 3).toISOString() },
];

export default function WorkoutsHistory() {
  const [mode, setMode] = useState<ModeKey | "all">("all");

  const items = useMemo(() => seed
    .filter((x) => (mode === "all" ? true : x.mode === mode))
    .sort((a, b) => +new Date(b.whenISO) - +new Date(a.whenISO)), [mode]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.color.bg }}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", padding: 16, gap: 8 }}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={{
            width: 40, height: 40, borderRadius: 10,
            alignItems: "center", justifyContent: "center",
            backgroundColor: "#0f1317", borderWidth: 1, borderColor: "#1a222b"
          }}
        >
          <Ionicons name="chevron-back" size={20} color={theme.color.text} />
        </Pressable>
        <Text style={{ color: theme.color.text, fontSize: 20, fontWeight: "900" }}>Workouts History</Text>
      </View>

      {/* Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        style={{ maxHeight: 46 }}
      >
        <ModeChip label="All" active={mode === "all"} onPress={() => setMode("all")} />
        <ModeChip label="Lifting" active={mode === "lifting"} onPress={() => setMode("lifting")} />
        <ModeChip label="Basketball" active={mode === "basketball"} onPress={() => setMode("basketball")} />
        <ModeChip label="Running" active={mode === "running"} onPress={() => setMode("running")} />
        <ModeChip label="Football" active={mode === "football"} onPress={() => setMode("football")} />
        <ModeChip label="Baseball" active={mode === "baseball"} onPress={() => setMode("baseball")} />
        <ModeChip label="Soccer" active={mode === "soccer"} onPress={() => setMode("soccer")} />
        <ModeChip label="Hockey" active={mode === "hockey"} onPress={() => setMode("hockey")} />
      </ScrollView>

      {/* List */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12 }}>
        {items.length === 0 && (
          <Card>
            <Text style={{ color: "#666", fontWeight: "700" }}>No history yet for this filter.</Text>
          </Card>
        )}

        {items.map((it) => (
          <Card key={it.id}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View
                style={{
                  minWidth: 30, height: 30, borderRadius: 999, backgroundColor: "#eef2ff",
                  alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#e6e6e6",
                }}
              >
                {iconFor[it.mode]}
              </View>
              <Text style={{ color: "#111", fontWeight: "900", flex: 1 }} numberOfLines={2}>{it.name}</Text>
              <Text style={{ color: "#666", fontWeight: "700" }}>{fmtDate(it.whenISO)}</Text>
            </View>
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function ModeChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={() => { Haptics.selectionAsync(); onPress(); }}
      style={{
        paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999,
        borderWidth: 2, borderColor: active ? theme.color.brand : "#1a1a1a",
        backgroundColor: active ? "#151b22" : "#0f1317",
      }}
    >
      <Text style={{ color: "#fff", fontWeight: "900" }}>{label}</Text>
    </Pressable>
  );
}
function fmtDate(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}/${String(d.getFullYear()).slice(-2)}`;
}

