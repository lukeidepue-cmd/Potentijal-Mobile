import React, { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Image,
  ActivityIndicator,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { theme } from "../../../../constants/theme";

// Fonts already used in Basketball (Geist + Space Grotesk)
import {
  useFonts as useGeist,
  Geist_400Regular,
  Geist_500Medium,
  Geist_600SemiBold,
  Geist_700Bold,
  Geist_800ExtraBold,
} from "@expo-google-fonts/geist";
import {
  useFonts as useSpaceGrotesk,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from "@expo-google-fonts/space-grotesk";

/* ----------------------------- Mock / sample ----------------------------- */
type Goal = { id: string; name: string; done: number; total: number };
const SAMPLE_GOALS: Goal[] = [
  { id: "g1", name: "Passing Yards", done: 850, total: 3000 },
  { id: "g2", name: "Rushing Attempts", done: 42, total: 150 },
  { id: "g3", name: "Catches", done: 28, total: 100 },
];

/* -------------------------------- Layout -------------------------------- */
const { width: SCREEN_W } = Dimensions.get("window");
const OUTER_PAD = theme.layout.xl;
const SECTION_PAD = 16;
const CARD_GAP = 12;
const INNER_W = SCREEN_W - 2 * OUTER_PAD - 2 * SECTION_PAD;
const CARD_W = Math.max(240, INNER_W - 20);
const SNAP = CARD_W + CARD_GAP;
const EDGE_PAD = Math.max(0, Math.floor((INNER_W - CARD_W) / 2));

/* -------------------------------- Utils --------------------------------- */
function pct(n: number, d: number) {
  if (!d) return 0;
  return Math.max(0, Math.min(1, n / d));
}

/* -------- Fonts (same mapping as Basketball) --------
   3rd = Space Grotesk (display for "Home", "Weekly", row labels)
   1st = System (no fontFamily) for "Goals", "+ Add Weekly Goal", "Progress", card titles/subs
   2nd = Geist for the time chips
------------------------------------------------------*/
const FONT = {
  displayMed: "SpaceGrotesk_600SemiBold",
  displayBold: "SpaceGrotesk_700Bold",
  uiRegular: "Geist_400Regular",
  uiMedium: "Geist_500Medium",
  uiSemi: "Geist_600SemiBold",
  uiBold: "Geist_700Bold",
  uiXBold: "Geist_800ExtraBold",
};

/* --------------------------------- UI ----------------------------------- */
function IntervalChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        active && { borderColor: theme.colors.primary600, backgroundColor: "#0E1316" },
      ]}
    >
      {/* Time chips = 2nd font (Geist) */}
      <Text
        style={[
          styles.chipText,
          { fontFamily: FONT.uiSemi },
          active && { color: theme.colors.primary600 },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/* ------------------------------- Screen --------------------------------- */
export default function FootballHome() {
  const [geistLoaded] = useGeist({
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
    Geist_700Bold,
    Geist_800ExtraBold,
  });
  const [sgLoaded] = useSpaceGrotesk({
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  });
  const fontsReady = geistLoaded && sgLoaded;

  const [goals] = useState<Goal[]>(SAMPLE_GOALS);
  const [page, setPage] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const idx = Math.round(x / SNAP);
    setPage(Math.max(0, Math.min(idx, goals.length - 1)));
  };

  const [interval, setInterval] = useState<"7" | "30" | "90" | "180">("7");
  const [query, setQuery] = useState("");

  const totals = useMemo(
    () => ({ reps: 807, workouts: 9, growthFrom: 12, growthTo: 18 }),
    [interval, query]
  );

  if (!fontsReady) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.bg0, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.bg0 }}
      contentContainerStyle={{ padding: theme.layout.xl, gap: theme.layout.lg, paddingBottom: 20 }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={{ alignItems: "center", marginTop: 34 }}>
        <Text style={styles.header}>Home</Text>
        <View style={styles.headerUnderline} />
      </View>

      {/* Weekly (gradient section) */}
      <LinearGradient
        colors={["#0B0E10", "#10161B"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.sectionWrap}
      >
        <Text style={styles.kicker}>Weekly</Text>
        <Text style={styles.sectionTitle}>Goals</Text>

        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={SNAP}
          decelerationRate="fast"
          onMomentumScrollEnd={onMomentumEnd}
          contentContainerStyle={{ paddingHorizontal: EDGE_PAD }}
        >
          {goals.map((g) => {
            const p = pct(g.done, g.total);
            return (
              <View key={g.id} style={[styles.goalCard, { width: CARD_W, marginRight: CARD_GAP }]}>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                  <View style={styles.leftBar} />
                  <Text style={styles.goalName} numberOfLines={1}>
                    {g.name}
                  </Text>
                  <View style={{ flex: 1 }} />
                  <Text style={styles.goalSubtle}>
                    {g.done} / {g.total}
                  </Text>
                </View>
                <View style={styles.trackBox}>
                  <View style={[styles.fill, { width: `${p * 100}%` }]} />
                </View>
              </View>
            );
          })}
        </ScrollView>
      </LinearGradient>

      {/* pager dots */}
      {goals.length > 1 && (
        <View style={{ alignItems: "center", marginTop: 6, marginBottom: 6 }}>
          <View style={styles.dotsRow}>
            {goals.map((_, i) => (
              <View key={`dot-${i}`} style={[styles.dot, i === page && styles.dotActive]} />
            ))}
          </View>
        </View>
      )}

      {/* + Add Weekly Goal */}
      <Pressable
        style={{ alignSelf: "flex-end", marginTop: 8, marginBottom: 24 }}
        onPress={() => router.push("/(tabs)/(home)/football/weekly-goals")}
      >
        <LinearGradient
          colors={[theme.colors.primary600, "#3BAA6F"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.addBtnGrad}
        >
          <Ionicons name="add" size={18} color="#06160D" />
          <Text style={styles.addBtnText}>Add Weekly Goal</Text>
        </LinearGradient>
      </Pressable>

      {/* Progress */}
      <View style={styles.progressWrap}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
          <View style={styles.leftTick} />
          <Text style={styles.progressTitle}>Progress</Text>
        </View>

        <View style={styles.intervalRow}>
          {(["7", "30", "90", "180"] as const).map((k) => (
            <IntervalChip key={k} label={`${k} Days`} active={interval === k} onPress={() => setInterval(k)} />
          ))}
        </View>

        <TextInput
          placeholder="Type a Drill or Exercise…"
          placeholderTextColor={theme.colors.textLo}
          value={query}
          onChangeText={setQuery}
          style={styles.search}
        />

        <View style={styles.rowLine}>
          <View style={styles.rowMark} />
          <Text style={styles.rowLabel}>Total Reps</Text>
          <Text style={styles.rowValue}>{totals.reps}</Text>
        </View>

        <View style={styles.rowLine}>
          <View style={styles.rowMark} />
          <Text style={styles.rowLabel}>Total Workouts</Text>
          <Text style={styles.rowValue}>{totals.workouts}</Text>
        </View>

        <View style={styles.rowLine}>
          <View style={styles.rowMark} />
          <Text style={styles.rowLabel}>Growth</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={styles.rowValue}>{totals.growthFrom}</Text>
            <Text style={{ color: theme.colors.textLo, fontFamily: FONT.uiBold }}>→</Text>
            <Text style={styles.rowValue}>{totals.growthTo}</Text>
          </View>
        </View>
      </View>

      {/* Cards */}
      <View style={{ gap: 20, marginTop: 12 }}>
        {/* Log Game (Justin Jefferson) */}
        <View style={styles.bigCard}>
          <Image
            source={require("../../../../assets/players/jefferson.jpg")}
            style={styles.heroImageTop}
            resizeMode="cover"
          />
          <View style={styles.bigContent}>
            <Text style={styles.bigTitle}>Log Game</Text>
            <Text style={styles.bigSub}>For Optimized Training</Text>
            <Pressable
              style={{ alignSelf: "flex-start", marginTop: 12 }}
              onPress={() => router.push("/(tabs)/(home)/football/add-game")}
            >
              <LinearGradient
                colors={[theme.colors.primary600, "#3BAA6F"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cta}
              >
                <Text style={styles.ctaText}>+ Add Game</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>

        {/* Log Team Practices (Josh Allen) */}
        <View style={styles.bigCard}>
          <Image
            source={require("../../../../assets/players/allen.webp")}
            style={styles.heroImageTop}
            resizeMode="cover"
          />
          <View style={styles.bigContent}>
            <Text style={styles.bigTitle}>Log Team Practices</Text>
            <Text style={styles.bigSub}>To Add Additional Training</Text>
            <Pressable
              style={{ alignSelf: "flex-start", marginTop: 12 }}
              onPress={() => router.push("/(tabs)/(home)/football/add-practice")}
            >
              <LinearGradient
                colors={[theme.colors.primary600, "#3BAA6F"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cta}
              >
                <Text style={styles.ctaText}>+ Add Practice</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

/* -------------------------------- Styles -------------------------------- */
const styles = StyleSheet.create({
  header: {
    color: theme.colors.textHi,
    fontSize: 28,
    letterSpacing: 0.2,
    fontFamily: FONT.displayBold, // 3rd
  },
  headerUnderline: {
    height: 3,
    alignSelf: "stretch",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 999,
    marginTop: 6,
  },

  sectionWrap: {
    borderRadius: 20,
    padding: SECTION_PAD,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.06)",
  },
  kicker: {
    color: theme.colors.textLo,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    fontSize: 12,
    fontFamily: FONT.displayBold, // 3rd
    marginBottom: 2,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 26,
    letterSpacing: 0.2,
    // 1st (system)
    fontWeight: Platform.select({ ios: "900", android: "700" }) as any,
    marginBottom: 10,
  },

  goalCard: {
    backgroundColor: "rgba(12,16,20,0.85)",
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 14,
  },
  leftBar: {
    width: 4,
    height: 18,
    borderRadius: 4,
    backgroundColor: theme.colors.primary600,
    marginRight: 10,
  },
  goalName: {
    color: "#EAF3EE",
    fontSize: 18,
    fontFamily: FONT.uiBold,
    maxWidth: "60%",
  },
  goalSubtle: { color: "#BFC8C3", fontSize: 12, fontFamily: FONT.uiMedium },

  trackBox: {
    marginTop: 10,
    height: 14,
    borderRadius: 10,
    backgroundColor: "#0F1418",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  fill: { height: "100%", backgroundColor: theme.colors.primary600 },

  dotsRow: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "transparent",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.35)",
  },
  dotActive: {
    backgroundColor: theme.colors.primary600,
    borderColor: theme.colors.primary600,
  },

  addBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  addBtnText: {
    color: "#06160D",
    fontWeight: "900", // 1st (system)
  },

  progressWrap: {
    borderRadius: 16,
    backgroundColor: "#0E1216",
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.06)",
  },
  leftTick: {
    width: 3,
    height: 16,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.35)",
    marginRight: 10,
  },
  progressTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800", // 1st (system)
  },

  intervalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  chip: {
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#0A0F12",
  },
  chipText: {
    color: theme.colors.textHi,
    fontSize: 12,
    letterSpacing: 0.2,
  },

  search: {
    backgroundColor: "#0C1014",
    color: theme.colors.textHi,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
    marginTop: 8,
    marginBottom: 10,
    fontFamily: FONT.uiRegular,
  },

  rowLine: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 10 },
  rowMark: { width: 3, height: 16, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.35)" },
  rowLabel: { color: "#FFFFFF", fontSize: 16, fontFamily: FONT.displayMed, flex: 1 }, // 3rd
  rowValue: { color: "#FFFFFF", fontSize: 16, fontFamily: FONT.uiBold },

  bigCard: {
    backgroundColor: "#0E1216",
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.06)",
    overflow: "hidden",
  },
  heroImageTop: { width: "100%", height: 188 },
  bigContent: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 14 },
  bigTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    letterSpacing: 0.2,
    fontWeight: Platform.select({ ios: "800", android: "700" }) as any, // 1st (system)
  },
  bigSub: {
    color: theme.colors.textLo,
    fontWeight: "600", // 1st (system)
    marginTop: 4,
  },
  cta: { borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10 },
  ctaText: { color: "#06160D", fontFamily: FONT.uiXBold },
});
