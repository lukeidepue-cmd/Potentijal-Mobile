import React, { useState } from "react";
import { SafeAreaView, View, Text, Pressable, TextInput, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { theme } from "../../../../constants/theme";

/* --- Font 2 (Geist) for heading --- */
import {
  useFonts as useGeist,
  Geist_700Bold,
  Geist_800ExtraBold,
} from "@expo-google-fonts/geist";

export default function AddPracticeScreen() {
  const [geistLoaded] = useGeist({ Geist_700Bold, Geist_800ExtraBold });

  const [when, setWhen] = useState("");
  const [drills, setDrills] = useState("");
  const [notes, setNotes] = useState("");

  const save = () => {
    Haptics.selectionAsync();
    router.back();
  };

  if (!geistLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.bg0, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg0 }}>
      {/* Back button */}
      <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
        <Ionicons name="chevron-back" size={22} color={theme.colors.textHi} />
      </Pressable>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Heading + rule (match Edit Profile) */}
        <Text style={styles.title}>Add Practice</Text>
        <View style={styles.rule} />

        {/* Inputs – 4px between each */}
        <View style={{ marginTop: 22 }}>
          <TextInput
            value={when}
            onChangeText={setWhen}
            placeholder="Date..."
            placeholderTextColor={theme.colors.textLo}
            style={styles.input}
          />
        </View>

        <View style={{ marginTop: 18 }}>
          <TextInput
            value={drills}
            onChangeText={setDrills}
            placeholder="Drills..."
            placeholderTextColor={theme.colors.textLo}
            multiline
            style={[styles.input, styles.inputBig]}
          />
        </View>

        <View style={{ marginTop: 18 }}>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Notes..."
            placeholderTextColor={theme.colors.textLo}
            multiline
            style={[styles.input, styles.inputBig]}
          />
        </View>

        {/* Save (8px under last box) */}
        <Pressable onPress={save} style={{ marginTop: 20, alignSelf: "flex-start" }}>
          <View style={styles.saveBtn}>
            <Text style={styles.saveText}>Save</Text>
          </View>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 16,
    marginTop: 16,
  },

  title: {
    color: theme.colors.textHi,
    fontSize: 28,
    marginTop: 18,
    fontFamily: "Geist_800ExtraBold",
    letterSpacing: 0.2,
  },
  rule: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 999,
    marginTop: 8,
  },

  input: {
    backgroundColor: "#0E1216",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    color: theme.colors.textHi,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inputBig: {
    minHeight: 160,
    textAlignVertical: "top",
  },

  saveBtn: {
    backgroundColor: theme.colors.primary600,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  saveText: {
    color: "#06160D",
    fontFamily: "Geist_700Bold",
    fontSize: 16,
  },
});





