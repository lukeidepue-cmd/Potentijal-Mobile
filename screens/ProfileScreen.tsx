// screens/ProfileScreen.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  TextInput,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useMode } from "../providers/ModeContext";

// Shared header (make sure components/AppHeader.tsx exists)
import AppHeader from "../components/AppHeader";

/* ---- Theme ---- */
const DARK = "#0A0F14";
const CARD = "#111822";
const TEXT = "#E6F1FF";
const DIM = "#8AA0B5";
const GREEN = "#2BF996";
const STROKE = "#1A2430";

/* ---- Sports ---- */
type Sport =
  | "Lifting"
  | "Basketball"
  | "Running"
  | "Baseball"
  | "Soccer"
  | "Football"
  | "Hockey";

const SPORT_ICONS: Record<Sport, string> = {
  Lifting: "🏋️",
  Basketball: "🏀",
  Running: "🏃",
  Baseball: "⚾",
  Soccer: "⚽",
  Football: "🏈",
  Hockey: "🏒",
};

const GRID_SPORTS: Sport[] = ["Lifting", "Basketball", "Running", "Baseball"];

const POSITION_BY_SPORT: Partial<Record<Sport, string>> = {
  Basketball: "Point Guard",
  Soccer: "Right Wing",
  Football: "Wide Receiver",
  Baseball: "Shortstop",
  Hockey: "Center",
  Running: "Distance",
};

const BADGES = ["👑", "🏆", "🔥", "⭐️", "🥇"];

export default function ProfileScreen() {
  const { mode } = useMode();
  const initialSport =
    ((mode?.charAt(0).toUpperCase() + mode.slice(1)) as Sport) || "Lifting";

  const [selectedSport, setSelectedSport] = useState<Sport>(initialSport);

  const [displayName] = useState("Troy Hornbeck");
  const [handle] = useState("@TheTroyHornbeck26");

  // Bio fields
  const [height, setHeight] = useState("6'2\"");
  const [weight, setWeight] = useState("185 lb");
  const [klass, setKlass] = useState("Class of 2026");

  // Team
  const [teamName, setTeamName] = useState("Utah Falcons");
  const [teamRecord, setTeamRecord] = useState("10–7");

  // Account
  const [daysOnApp] = useState(167);
  const [streak] = useState(67);

  // PFP
  const [pfpUri, setPfpUri] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (Platform.OS !== "web") {
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      }
    })();
  }, []);

  const pickPfp = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });
    if (!res.canceled) setPfpUri(res.assets[0].uri);
  };

  const showPosition = selectedSport !== "Lifting";
  const positionLabel = showPosition
    ? POSITION_BY_SPORT[selectedSport] ?? "—"
    : "";

  return (
    <View style={{ flex: 1, backgroundColor: DARK }}>
      {/* Unified page header */}
      <AppHeader title="Profile" icon={{ lib: "ion", name: "person-circle-outline" }} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 14,
          paddingBottom: 24,
          paddingTop: 16, // spacing under the header
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* ===== HEADER: name (left) + badges grid (right) ===== */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.displayName}>{displayName}</Text>
            <Text style={styles.handle}>{handle}</Text>
          </View>

          <View style={styles.badgeGrid}>
            {BADGES.map((b, i) => (
              <View key={i} style={styles.badgeItem}>
                <Text style={{ fontSize: 14 }}>{b}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ===== HERO: big PFP (65%) + Bio (35%) ===== */}
        <View style={{ flexDirection: "row", gap: 12, marginTop: 8 }}>
          {/* Big PFP section ~65% */}
          <View style={[styles.card, { flex: 0.65, alignItems: "center" }]}>
            <View style={styles.pfpOuterBig}>
              {pfpUri ? (
                <Image source={{ uri: pfpUri }} style={styles.pfp} />
              ) : (
                <View style={[styles.pfp, styles.pfpPlaceholder]}>
                  <Text style={{ color: DIM }}>No photo</Text>
                </View>
              )}
            </View>

            <Pressable onPress={pickPfp} style={styles.pfpSmallBtn}>
              <Text style={styles.pfpSmallBtnText}>
                {pfpUri ? "Change Profile Picture" : "+ Add Profile Picture"}
              </Text>
            </Pressable>
          </View>

          {/* Bio ~35% */}
          <View style={[styles.card, { flex: 0.35 }]}>
            <Text style={styles.cardTitle}>Bio</Text>

            <TextInput
              value={height}
              onChangeText={setHeight}
              style={styles.bioInput}
              placeholder="Height"
              placeholderTextColor={DIM}
            />
            <TextInput
              value={weight}
              onChangeText={setWeight}
              style={styles.bioInput}
              placeholder="Weight"
              placeholderTextColor={DIM}
            />
            <TextInput
              value={klass}
              onChangeText={setKlass}
              style={styles.bioInput}
              placeholder="Class"
              placeholderTextColor={DIM}
            />
            {showPosition && (
              <TextInput
                value={positionLabel}
                editable={false}
                style={[styles.bioInput, { opacity: 0.9 }]}
                placeholder="Position"
                placeholderTextColor={DIM}
              />
            )}
          </View>
        </View>

        {/* ===== SPORTS GRID ===== */}
        <View style={[styles.card, { marginTop: 10 }]}>
          <Text style={styles.cardTitle}>Sports</Text>
          <View style={styles.sportGrid}>
            {GRID_SPORTS.map((sport) => {
              const active = selectedSport === sport;
              return (
                <Pressable
                  key={sport}
                  onPress={() => setSelectedSport(sport)}
                  style={[
                    styles.sportCell,
                    {
                      borderColor: active ? GREEN : STROKE,
                      backgroundColor: active ? "#0c1a13" : "#0B121A",
                    },
                  ]}
                >
                  <Text style={styles.sportIcon}>{SPORT_ICONS[sport]}</Text>
                  <Text style={styles.sportLabel} numberOfLines={1}>
                    {sport}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ===== PROGRESS ===== */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Progress — {selectedSport}</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <View style={[styles.smallPanel, { flex: 1 }]}>
              <Text style={styles.panelTitle}>Weekly</Text>
              <Text style={styles.panelBody}>Workouts: 4 → 5</Text>
              <Text style={styles.panelBody}>Hours: 8.4 → 9.1</Text>
            </View>
            <View style={[styles.smallPanel, { flex: 1 }]}>
              <Text style={styles.panelTitle}>Monthly</Text>
              <Text style={styles.panelBody}>Vertical: 20" → 22"</Text>
              <Text style={styles.panelBody}>3PT%: 33% → 38%</Text>
            </View>
          </View>
        </View>

        {/* ===== ACCOUNT (left) + TEAM (right) ===== */}
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={[styles.card, { flex: 1 }]}>
            <Text style={styles.cardTitle}>Account</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
              <View>
                <Text style={styles.dimSmall}>Day</Text>
                <Text style={styles.valueText}>{daysOnApp}</Text>
              </View>
              <View style={{ alignItems: "center" }}>
                <Text style={styles.dimSmall}>Streak</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Text style={[styles.valueText, { color: GREEN, fontWeight: "900" }]}>
                    {streak}
                  </Text>
                  <Text style={{ fontSize: 16 }}>🔥</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={[styles.card, { flex: 1 }]}>
            <Text style={styles.cardTitle}>Team</Text>
            <TextInput
              value={teamName}
              onChangeText={setTeamName}
              style={styles.bioInput}
              placeholder="Team"
              placeholderTextColor={DIM}
            />
            <TextInput
              value={teamRecord}
              onChangeText={setTeamRecord}
              style={styles.bioInput}
              placeholder="Record"
              placeholderTextColor={DIM}
            />
          </View>
        </View>

        {/* ===== STATS ===== */}
        <View style={[styles.card, { marginTop: 10, marginBottom: 18 }]}>
          <Text style={styles.cardTitle}>2025–26 Stats — {selectedSport}</Text>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Points per game</Text>
            <Text style={styles.statValue}>18.4</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Assists per game</Text>
            <Text style={styles.statValue}>5.2</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Rebounds per game</Text>
            <Text style={styles.statValue}>7.1</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Minutes per game</Text>
            <Text style={styles.statValue}>28.9</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

/* ---- Styles ---- */
const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },

  // Bigger display name
  displayName: { color: TEXT, fontSize: 36, fontWeight: "900" },
  handle: { color: DIM, marginTop: 2 },

  // Badges now flow left->right
  badgeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "flex-start",
  },
  badgeItem: {
    borderWidth: 1,
    borderColor: STROKE,
    borderRadius: 8,
    width: 40,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0B121A",
  },

  card: {
    backgroundColor: CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: STROKE,
    padding: 12,
    marginTop: 10,
  },
  cardTitle: { color: TEXT, fontWeight: "900", marginBottom: 8 },

  // Make image fill the card width; keep square ratio
  pfpOuterBig: {
    width: "100%",
    aspectRatio: 1, // keeps square
    borderRadius: 16,
    borderWidth: 1,
    borderColor: STROKE,
    overflow: "hidden",
    backgroundColor: "#0C0F14",
  },
  pfp: { width: "100%", height: "100%", resizeMode: "cover" },
  pfpPlaceholder: { alignItems: "center", justifyContent: "center" },

  pfpSmallBtn: {
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: STROKE,
    backgroundColor: "#0B121A",
  },
  pfpSmallBtnText: { color: TEXT, fontSize: 12, fontWeight: "700" },

  bioInput: {
    backgroundColor: "#0C0F14",
    color: TEXT,
    borderWidth: 1,
    borderColor: STROKE,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginTop: 8,
  },

  sportGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  sportCell: {
    flexBasis: "31%", // ~3 per row with gaps
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  sportIcon: { fontSize: 16 },
  sportLabel: { color: TEXT, fontSize: 12, fontWeight: "800", maxWidth: 80 },

  smallPanel: {
    borderWidth: 1,
    borderColor: STROKE,
    borderRadius: 10,
    padding: 10,
    backgroundColor: "#0B121A",
  },
  panelTitle: { color: DIM, fontWeight: "800", marginBottom: 6 },
  panelBody: { color: TEXT, marginBottom: 2 },

  dimSmall: { color: DIM, fontSize: 12 },
  valueText: { color: TEXT, fontWeight: "900", fontSize: 18 },

  statRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: STROKE,
  },
  statLabel: { color: DIM, marginRight: 10 },
  statValue: { color: TEXT, fontWeight: "900" },
});















