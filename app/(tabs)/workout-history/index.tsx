// app/(tabs)/workout-history/index.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  StyleSheet,
  Platform,
  LayoutChangeEvent, // (keep) measuring sticky bar height
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useNavigation } from "expo-router";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Card } from "../../../components/Card";
import { theme } from "../../../constants/theme";

/* --------------------- Fonts (ADDED per request) --------------------- */
// CHANGE: load the three font roles you specified (Font 1/2/3)
import {
  useFonts as useGeist,
  Geist_500Medium, // Font 1
  Geist_600SemiBold, // Font 2
} from "@expo-google-fonts/geist";
import {
  useFonts as useSpaceGrotesk,
  SpaceGrotesk_700Bold, // Font 3
} from "@expo-google-fonts/space-grotesk";

const FONT = {
  // Font 1 = medium UI
  uiMedium: "Geist_500Medium",
  // Font 2 = semibold UI
  uiSemi: "Geist_600SemiBold",
  // Font 3 = display bold
  displayBold: "SpaceGrotesk_700Bold",
} as const;

/* --------------------- Types & helpers --------------------- */
type ModeKey =
  | "lifting"
  | "basketball"
  | "running"
  | "football"
  | "soccer"
  | "baseball"
  | "hockey";

type Item = { id: string; mode: ModeKey; name: string; whenISO: string };

const iconFor: Record<ModeKey, React.ReactNode> = {
  lifting: <MaterialCommunityIcons name="dumbbell" size={16} color="#111" />,
  basketball: <Ionicons name="basketball-outline" size={16} color="#111" />,
  running: <MaterialCommunityIcons name="run" size={16} color="#111" />,
  football: <Ionicons name="american-football-outline" size={16} color="#111" />,
  soccer: <Ionicons name="football-outline" size={16} color="#111" />,
  baseball: <MaterialCommunityIcons name="baseball" size={16} color="#111" />,
  hockey: <MaterialCommunityIcons name="hockey-sticks" size={16} color="#111" />,
};

// sample data
const seed: Item[] = [
  { id: "a1", mode: "lifting", name: "Shoulders & Biceps", whenISO: new Date(Date.now() - 86400000 * 1).toISOString() },
  { id: "a2", mode: "lifting", name: "Legs", whenISO: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: "b1", mode: "basketball", name: "3-Point Shots", whenISO: new Date(Date.now() - 86400000 * 1).toISOString() },
  { id: "b2", mode: "basketball", name: "Shooting Drills", whenISO: new Date(Date.now() - 86400000 * 4).toISOString() },
  { id: "r1", mode: "running", name: "3.1 mi @ 8:27/mi", whenISO: new Date(Date.now() - 86400000 * 1).toISOString() },
  { id: "bs1", mode: "baseball", name: "Hitting", whenISO: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: "hk1", mode: "hockey", name: "Skating speed", whenISO: new Date(Date.now() - 86400000 * 3).toISOString() },
];

function fmtDate(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}/${String(d.getFullYear()).slice(-2)}`;
}
function computeStreak(items: Item[]) {
  const byDay = new Set(items.map((i) => new Date(i.whenISO).toDateString()));
  let streak = 0;
  const one = 24 * 60 * 60 * 1000;
  for (let t = Date.now(); ; t -= one) {
    const dayStr = new Date(t).toDateString();
    if (byDay.has(dayStr)) streak += 1;
    else break;
  }
  return streak;
}

/* --------------------------- Screen --------------------------- */
export default function WorkoutHistoryIndex() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [barH, setBarH] = useState(0);

  // CHANGE: load fonts (no gating UI; will just apply when ready)
  useGeist({ Geist_500Medium, Geist_600SemiBold });
  useSpaceGrotesk({ SpaceGrotesk_700Bold });

  // Tab icon override (book)
  useEffect(() => {
    navigation.setOptions?.({
      tabBarIcon: (
        { color, size }: { color: string; size: number }
      ) => <Ionicons name="book-outline" size={size} color={color} />,
    });
  }, [navigation]);

  const [mode, setMode] = useState<ModeKey | "all">("all");
  const [query, setQuery] = useState("");

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return seed
      .filter((x) => (mode === "all" ? true : x.mode === mode))
      .filter((x) => {
        if (!q) return true;
        const byName = x.name.toLowerCase().includes(q);
        const byDate = fmtDate(x.whenISO).includes(q);
        return byName || byDate;
      })
      .sort((a, b) => +new Date(b.whenISO) - +new Date(a.whenISO));
  }, [mode, query]);

  const totalWorkouts = seed.length;
  const streak = computeStreak(seed);

  // CHANGE: +4px more space between list and bottom section -> keep GAP at 16
  const GAP = 14;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.color.bg }}>
      {/* Header */}
      <View style={{ alignItems: "center", paddingHorizontal: 16, paddingTop: 8 }}>
        <Text style={styles.header}>Workout History</Text>
        <View style={styles.headerUnderline} />
      </View>

      {/* Search + dropdown row */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, gap: 10, marginTop: 10 }}>
        <View style={{ flex: 13 }}>{/* CHANGE: 65% width (was 7) */}
          <View style={styles.searchWrap}>
            <Ionicons name="search" size={16} color={theme.color.dim} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search for a workout" // CHANGE: new placeholder
              placeholderTextColor={theme.color.dim}
              style={styles.searchInput}
            />
          </View>
        </View>
        <View style={{ flex: 7 }}>{/* CHANGE: 35% width (was 3) */}
          <ModeDropdown value={mode} onChange={setMode} />
        </View>
      </View>

      {/* Scrollable list */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: 16,
          // keep reveal system; list ends behind sticky section
          paddingBottom: Math.max(0, barH - GAP),
        }}
        showsVerticalScrollIndicator={false}
      >
        {items.length === 0 && (
          <Card>
            <Text style={{ color: "#666", fontWeight: "700" }}>No history yet for this filter.</Text>
          </Card>
        )}

        {items.map((it) => (
          <Pressable
            key={it.id}
            onPress={() => {
              Haptics.selectionAsync();
              router.push({
                pathname: "/(tabs)/workout-history/[id]",
                params: { id: it.id, name: it.name, when: it.whenISO, mode: it.mode },
              });
            }}
            style={{ marginBottom: 12 }}
          >
            <Card>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={styles.dateText}>{fmtDate(it.whenISO)}</Text>
                <Text style={styles.itemName} numberOfLines={1}>
                  {it.name}
                </Text>
                <View style={styles.sportPill}>{iconFor[it.mode]}</View>
              </View>
            </Card>
          </Pressable>
        ))}
      </ScrollView>

      {/* Sticky bottom stats */}
      <View
        style={[
          styles.stickyBar,
          {
            // CHANGE: reduce space to the tabs (smaller bottom padding) – kept from last pass
            paddingBottom: Math.max(4, insets.bottom - 16),
            // visible gap above cards (GAP=16)
            paddingTop: GAP,
          },
        ]}
        onLayout={(e: LayoutChangeEvent) => setBarH(e.nativeEvent.layout.height)}
      >
        {/* CHANGE: New horizontal layout – labels on left, BIG number on right */}
        <View style={[styles.statCard, { marginRight: 8 }]}>
          <View style={styles.statRow}>{/* CHANGE: row container */}
            <View style={{ flex: 1 }}>
              <Text style={styles.statKicker}>{/* CHANGE: Font 3 */}Total</Text>
              <Text style={styles.statTitle}>{/* CHANGE: Font 1 */}Workouts</Text>
            </View>
            <Text style={styles.statValueRight}>{/* CHANGE: Font 2, on right */}{totalWorkouts}</Text>
          </View>
        </View>

        <View style={[styles.statCard, { marginLeft: 8 }]}>
          <View style={styles.statRow}>{/* CHANGE: row container */}
            <View style={{ flex: 1 }}>
              <Text style={styles.statKicker}>{/* CHANGE: Font 3 */}Workout</Text>
              <Text style={styles.statTitle}>{/* CHANGE: Font 1 */}Streak</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text style={styles.statValueRight}>{/* CHANGE: Font 2, on right */}{streak}</Text>
              <MaterialCommunityIcons name="fire" size={16} color={theme.color.brand} />
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

/* ---------------------- Small components ---------------------- */
function ModeDropdown({
  value,
  onChange,
}: {
  value: ModeKey | "all";
  onChange: (m: ModeKey | "all") => void;
}) {
  const [open, setOpen] = useState(false);
  const all: (ModeKey | "all")[] = ["all", "basketball", "lifting", "running", "football", "baseball", "soccer", "hockey"];

  return (
    <View>
      <Pressable
        onPress={() => {
          Haptics.selectionAsync();
          setOpen((s) => !s);
        }}
        style={styles.ddTrigger}
      >
        <Text
          style={styles.ddText}
          numberOfLines={1}
          ellipsizeMode="clip"
        >
          {label(value)}
        </Text>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={16} color="#cbd5e1" />
      </Pressable>

      {open && (
        <View style={styles.ddMenu}>
          {all.map((m) => (
            <Pressable
              key={m}
              onPress={() => {
                onChange(m);
                setOpen(false);
              }}
              style={[styles.ddItem, value === m && { backgroundColor: "#0f1317", borderColor: theme.color.brand }]}
            >
              <Text
                style={[
                  styles.ddItemText,
                  value === m && { color: theme.color.brand },
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {label(m)}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

function label(m: ModeKey | "all") {
  if (m === "all") return "All";
  return m[0].toUpperCase() + m.slice(1);
}

/* ----------------------------- Styles ----------------------------- */
const styles = StyleSheet.create({
  header: {
    color: theme.color.text,
    fontSize: 28,
    letterSpacing: 0.2,
    fontWeight: Platform.select({ ios: "900", android: "700" }) as any,
    fontFamily: FONT.displayBold, // CHANGE: Font 3 for header
  },
  headerUnderline: {
    height: 3,
    alignSelf: "stretch",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 999,
    marginTop: 6,
  },

  /* search + dropdown */
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#0f1317",
    borderWidth: 1,
    borderColor: "#1a222b",
  },
  searchInput: {
    color: theme.color.text,
    flex: 1,
    fontFamily: FONT.uiMedium, // CHANGE: Font 1 for input (affects placeholder too)
  },

  ddTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#0f1317",
    borderWidth: 1,
    borderColor: "#1a222b",
  },
  ddText: {
    color: "#e2e8f0",
    fontWeight: "800",
    fontSize: 13, // (unchanged)
    lineHeight: 16,
  },

  ddMenu: {
    position: "absolute",
    top: 46,
    left: 0,
    right: 0,
    borderRadius: 12,
    backgroundColor: "#0b0f13",
    borderWidth: 1,
    borderColor: "#1a222b",
    overflow: "hidden",
    zIndex: 10,
  },
  ddItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#1a222b",
  },
  ddItemText: {
    color: "#e2e8f0",
    fontWeight: "800",
    fontSize: 13, // (unchanged size)
    lineHeight: 16,
    fontFamily: FONT.uiSemi, // CHANGE: Font 2 for dropdown options
  },

  /* list row */
  dateText: {
    color: theme.color.brand,
    fontWeight: "900",
    marginRight: 12,
    minWidth: 64,
    fontFamily: FONT.uiSemi, // CHANGE: Font 2 for dates
  },
  itemName: {
    flex: 1,
    color: theme.color.text,
    fontWeight: "900",
    fontFamily: FONT.uiSemi, // CHANGE: Font 2 for names
  },
  sportPill: {
    marginLeft: 12,
    minWidth: 34,
    height: 34,
    borderRadius: 999,
    backgroundColor: "#fef08a",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e7e4b3",
  },

  /* sticky bottom stats */
  stickyBar: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 0,
    flexDirection: "row",
    backgroundColor: theme.color.bg,
    zIndex: 50,
    elevation: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: "transparent",
    borderColor: theme.color.brand,
    borderWidth: 1,
    borderRadius: 16,
    padding: 10,
  },
  // CHANGE: left labels area uses Font 3 + Font 1
  statKicker: {
    color: theme.color.dim,
    fontSize: 11,
    marginBottom: 2,
    fontFamily: FONT.displayBold, // Font 3 (“Total” / “Workout”)
  },
  statTitle: {
    color: theme.color.text,
    fontSize: 16,
    marginBottom: 0,
    fontFamily: FONT.uiMedium, // Font 1 (“Workouts” / “Streak”)
  },
  // CHANGE: new right-side number style (Font 2)
  statValueRight: {
    color: theme.color.text,
    fontSize: 24,
    fontFamily: FONT.uiSemi, // Font 2 (numbers)
  },
  // CHANGE: row container inside each stat card
  statRow: {
    flexDirection: "row",
    alignItems: "center",
  },
});







