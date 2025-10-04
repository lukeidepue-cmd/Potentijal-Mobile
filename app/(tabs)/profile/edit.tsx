import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "../../../constants/theme";

export default function EditProfile() {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg0, paddingTop: insets.top + 16 }}>
      {/* simple back */}
      <Pressable
        onPress={() => router.back()}
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.15)",
          alignItems: "center",
          justifyContent: "center",
          marginLeft: 16,
        }}
      >
        <Ionicons name="chevron-back" size={22} color={theme.colors.textHi} />
      </Pressable>

      <View style={{ paddingHorizontal: 16, marginTop: 18 }}>
        <Text style={styles.title}>Edit Profile</Text>
        <Text style={styles.sub}>
          We’ll set up this screen in the future (name, username, avatar, bio, badges, goals…)
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    color: theme.colors.textHi,
    fontSize: 28,
    fontFamily: "SpaceGrotesk_700Bold",
    marginBottom: 6,
  },
  sub: { color: theme.colors.textLo, fontSize: 18, lineHeight: 26 },
});


