// app/(tabs)/(home)/basketball/add-game.tsx
import React, { useState } from "react";
import { SafeAreaView, View, Text, Pressable, TextInput, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";

import { Card } from "../../../../components/Card"; // <-- named export
import { PrimaryButton } from "../../../../components/Button"; // <-- only what's used
import { theme } from "../../../../constants/theme";

export default function AddGameScreen() {
  const [when, setWhen] = useState(new Date().toISOString().slice(0, 16).replace("T", " "));
  const [opponent, setOpponent] = useState("");
  const [location, setLocation] = useState("");
  const [result, setResult] = useState<"W" | "L" | "">("");
  const [pts, setPts] = useState("");
  const [reb, setReb] = useState("");
  const [ast, setAst] = useState("");

  const save = () => {
    Haptics.selectionAsync();
    // persist later; for now just go back
    router.back();
  };

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
        <Text style={{ color: theme.color.text, fontSize: 20, fontWeight: "900" }}>Add Game</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 16 }} keyboardShouldPersistTaps="handled">
        <Card>
          <Text style={{ fontSize: 16, fontWeight: "900", color: "#111", marginBottom: 10 }}>Details</Text>

          <LabeledInput label="When" value={when} onChangeText={setWhen} placeholder="YYYY-MM-DD HH:mm" />
          <LabeledInput label="Opponent" value={opponent} onChangeText={setOpponent} placeholder="Opponent name" />
          <LabeledInput label="Location" value={location} onChangeText={setLocation} placeholder="Gym / Arena" />

          <Text style={{ color: "#111", fontWeight: "800", marginBottom: 6 }}>Result</Text>
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}>
            <Chip label="W" active={result === "W"} onPress={() => setResult("W")} />
            <Chip label="L" active={result === "L"} onPress={() => setResult("L")} />
          </View>

          <View style={{ flexDirection: "row", gap: 10 }}>
            <LabeledNumber label="PTS" value={pts} onChangeText={setPts} />
            <LabeledNumber label="REB" value={reb} onChangeText={setReb} />
            <LabeledNumber label="AST" value={ast} onChangeText={setAst} />
          </View>

          <View style={{ alignItems: "flex-end", marginTop: 12 }}>
            <PrimaryButton label="Save Game" onPress={save} />
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999,
        borderWidth: 2, borderColor: active ? theme.color.brand : "#e6e6e6",
        backgroundColor: active ? "#eef2ff" : "#fff",
      }}
    >
      <Text style={{ fontWeight: "900", color: "#111" }}>{label}</Text>
    </Pressable>
  );
}

function LabeledInput({
  label, value, onChangeText, placeholder,
}: { label: string; value: string; onChangeText: (t: string) => void; placeholder?: string }) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={{ color: "#111", fontWeight: "800", marginBottom: 6 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        style={{
          borderWidth: 1, borderColor: "#e6e6e6", backgroundColor: "#fff", color: "#111",
          borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
        }}
      />
    </View>
  );
}

function LabeledNumber({
  label, value, onChangeText,
}: { label: string; value: string; onChangeText: (t: string) => void }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ color: "#111", fontWeight: "800", marginBottom: 6 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={(t) => onChangeText(t.replace(/[^\d]/g, ""))}
        placeholder="0"
        placeholderTextColor="#9CA3AF"
        keyboardType="numeric"
        style={{
          borderWidth: 1, borderColor: "#e6e6e6", backgroundColor: "#fff", color: "#111",
          borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
        }}
      />
    </View>
  );
}


