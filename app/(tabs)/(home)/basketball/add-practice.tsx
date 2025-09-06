// app/(tabs)/(home)/basketball/add-practice.tsx
import React, { useState } from "react";
import { SafeAreaView, View, Text, Pressable, TextInput, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";

import { Card } from "../../../../components/Card";           // <-- named export
import { PrimaryButton } from "../../../../components/Button"; // <-- only what's used
import { theme } from "../../../../constants/theme";

export default function AddPracticeScreen() {
  const [when, setWhen] = useState(new Date().toISOString().slice(0, 16).replace("T", " "));
  const [focus, setFocus] = useState("");        // e.g., “Shooting”, “Defense”
  const [location, setLocation] = useState("");  // Gym / Court
  const [durationMin, setDurationMin] = useState(""); // minutes
  const [notes, setNotes] = useState("");

  const save = () => {
    Haptics.selectionAsync();
    // Persist later; for now just go back
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
        <Text style={{ color: theme.color.text, fontSize: 20, fontWeight: "900" }}>Add Practice</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, gap: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        <Card>
          <Text style={{ fontSize: 16, fontWeight: "900", color: "#111", marginBottom: 10 }}>
            Practice Details
          </Text>

          <LabeledInput
            label="When"
            value={when}
            onChangeText={setWhen}
            placeholder="YYYY-MM-DD HH:mm"
          />

          <LabeledInput
            label="Focus"
            value={focus}
            onChangeText={setFocus}
            placeholder="Shooting, Defense, Conditioning…"
          />

          <LabeledInput
            label="Location"
            value={location}
            onChangeText={setLocation}
            placeholder="Gym / Court"
          />

          <LabeledNumber
            label="Duration (min)"
            value={durationMin}
            onChangeText={setDurationMin}
          />

          <LabeledMultiline
            label="Notes"
            value={notes}
            onChangeText={setNotes}
            placeholder="Optional notes…"
          />

          <View style={{ alignItems: "flex-end", marginTop: 12 }}>
            <PrimaryButton label="Save Practice" onPress={save} />
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function LabeledInput({
  label,
  value,
  onChangeText,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
}) {
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
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
}) {
  return (
    <View style={{ marginBottom: 10 }}>
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

function LabeledMultiline({
  label,
  value,
  onChangeText,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
}) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={{ color: "#111", fontWeight: "800", marginBottom: 6 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        multiline
        numberOfLines={4}
        style={{
          borderWidth: 1, borderColor: "#e6e6e6", backgroundColor: "#fff", color: "#111",
          borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, minHeight: 96,
          textAlignVertical: "top",
        }}
      />
    </View>
  );
}


