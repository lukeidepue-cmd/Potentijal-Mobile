// app/(tabs)/workout-history/[id].tsx
import React from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context"; // CHANGE
import { Card } from "../../../components/Card";
import { theme } from "../../../constants/theme";

export default function WorkoutDetail() {
  const { id, name, when /*, mode*/ } = useLocalSearchParams<{
    id: string;
    name: string;
    when: string;
    mode?: string;
  }>();
  const insets = useSafeAreaInsets(); // CHANGE

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.color.bg,
        paddingTop: insets.top + 106, // CHANGE: push everything down by +28px more than before
      }}
    >
      {/* Header row */}
      <View style={{ flexDirection: "row", alignItems: "center", padding: 16, gap: 8 }}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={{
            width: 40, height: 40, borderRadius: 10,
            alignItems: "center", justifyContent: "center",
            backgroundColor: "#0f1317", borderWidth: 1, borderColor: "#1a222b",
          }}
        >
          <Ionicons name="chevron-back" size={20} color={theme.color.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.titleLine}>
            {formatDate(when)} – {name}
          </Text>
        </View>
      </View>

      <View style={styles.rule} />

      {/* Content boxes (placeholders for sets / drills etc.) */}
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <Card><Text style={{ color: "#666", fontWeight: "700" }}>Workout details go here…</Text></Card>
        <Card><Text style={{ color: "#666", fontWeight: "700" }}>More details / notes…</Text></Card>
      </ScrollView>
    </View>
  );
}

function formatDate(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

const styles = StyleSheet.create({
  titleLine: {
    color: theme.color.text,
    fontSize: 22,
    fontWeight: "900",
  },
  rule: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
    marginHorizontal: 16,
  },
});

