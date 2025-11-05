// app/(tabs)/(home)/football/index.tsx
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
import Svg, { G, Line as SvgLine, Path, Circle, Text as SvgText } from "react-native-svg";

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

/* ---------- Progress chart helpers (graph) ---------- */
type MetricKey = "reps" | "filler1" | "filler2";
type RangeKey = "7d" | "30d" | "90d" | "180d" | "360d";
type Pt = { x: number; y: number; date: Date };

function binsFor(range: RangeKey) {
  switch (range) {
    case "7d": return { bins: 7, stepDays: 1 };
    case "30d": return { bins: 5, stepDays: 6 };
    case "90d": return { bins: 9, stepDays: 10 };
    case "180d": return { bins: 6, stepDays: 30 };
    case "360d": return { bins: 6, stepDays: 60 };
  }
}
function baseAvgFor(metric: MetricKey) {
  if (metric === "reps") return 120;
  if (metric === "filler1") return 50;
  return 80; // filler2
}
function randomNear(avg: number, spread: number) {
  return Math.max(0, Math.round(avg + (Math.random() * 2 - 1) * spread));
}
function makeSeries(metric: MetricKey, range: RangeKey, _exercise: string): { data: Pt[]; avg: number } {
  const { bins, stepDays } = binsFor(range);
  const avg = baseAvgFor(metric);
  const spread = Math.max(4, Math.round(avg * 0.18));
  const data: Pt[] = Array.from({ length: bins }).map((_, i) => {
    const daysBack = (bins - 1 - i) * stepDays;
    const d = new Date();
    d.setDate(d.getDate() - daysBack);
    return { x: i + 1, y: randomNear(avg, spread), date: d };
  });
  return { data, avg };
}
function yTicksFrom(avg: number) {
  const step = Math.max(1, Math.round(avg * 0.06));
  const arr = [
    avg - step * 4, avg - step * 3, avg - step * 2, avg - step,
    avg, avg + step, avg + step * 2, avg + step * 3, avg + step * 4,
  ].map((n) => Math.max(0, n));
  return Array.from(new Set(arr)).sort((a, b) => a - b);
}
const md = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;
const yOnly = (d: Date) => `${d.getFullYear()}`;

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

  // existing state kept for parity
  const [interval, setInterval] = useState<"7" | "30" | "90" | "180">("7");
  const [query, setQuery] = useState("");

  // ===== Graph state =====
  const [metric, setMetric] = useState<MetricKey>("reps");
  const [range, setRange] = useState<RangeKey>("90d");

  const { data: series, avg } = useMemo(
    () => makeSeries(metric, range, query),
    [metric, range, query]
  );
  const yTicks = useMemo(() => yTicksFrom(avg), [avg]);

  // Chart layout
  const H = 220;
  const M = { top: 10, bottom: 32, left: 42, right: 16 };
  const [w, setW] = useState(0);
  const innerW = Math.max(0, w - M.left - M.right);
  const innerH = H - M.top - M.bottom;
  const yMin = yTicks[0];
  const yMax = yTicks[yTicks.length - 1];
  const xFor = (i: number) => M.left + (series.length <= 1 ? 0 : (i * innerW) / (series.length - 1));
  const yFor = (val: number) => M.top + innerH - (innerH * (val - yMin)) / Math.max(1, yMax - yMin);
  const linePath = useMemo(() => {
    if (!series.length) return "";
    return series.map((p, i) => `${i === 0 ? "M" : "L"} ${xFor(i)} ${yFor(p.y)}`).join(" ");
  }, [series, w, yMin, yMax]);

  // Dropdown menus
  const [openMetric, setOpenMetric] = useState(false);
  const [openRange, setOpenRange] = useState(false);

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

      {/* ===================== Progress (GRAPH) ===================== */}
      <View style={styles.progressWrap}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
          <View style={styles.leftTick} />
          <Text style={styles.progressTitle}>Progress</Text>
        </View>

        {/* Search first */}
        <TextInput
          placeholder="Type a Drill or Exercise…"
          placeholderTextColor={theme.colors.textLo}
          value={query}
          onChangeText={setQuery}
          style={styles.search}
        />

        {/* Two dropdowns */}
        <View style={styles.dropRow}>
          {/* Metric */}
          <View style={{ flex: 1, position: "relative" }}>
            <Pressable
              onPress={() => {
                setOpenMetric((v) => !v);
                setOpenRange(false);
              }}
              style={[styles.dropdown, openMetric && styles.dropdownActive]}
            >
              <Text style={styles.dropdownText}>
                {metric === "reps" ? "Reps" : metric === "filler1" ? "Filler 1" : "Filler 2"}
              </Text>
              <Ionicons name="chevron-down" size={12} color={openMetric ? theme.colors.primary600 : theme.colors.textHi} />
            </Pressable>
            {openMetric && (
              <View style={styles.menu}>
                {(["reps", "filler1", "filler2"] as MetricKey[]).map((k) => (
                  <Pressable key={k} onPress={() => { setMetric(k); setOpenMetric(false); }} style={styles.menuItem}>
                    <Text style={styles.menuText}>{k === "reps" ? "Reps" : k === "filler1" ? "Filler 1" : "Filler 2"}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {/* Range */}
          <View style={{ flex: 1, position: "relative" }}>
            <Pressable
              onPress={() => {
                setOpenRange((v) => !v);
                setOpenMetric(false);
              }}
              style={[styles.dropdown, openRange && styles.dropdownActive]}
            >
              <Text style={styles.dropdownText}>
                {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : range === "90d" ? "90 Days" : range === "180d" ? "180 Days" : "360 Days"}
              </Text>
              <Ionicons name="chevron-down" size={12} color={openRange ? theme.colors.primary600 : theme.colors.textHi} />
            </Pressable>
            {openRange && (
              <View style={styles.menu}>
                {(["7d", "30d", "90d", "180d", "360d"] as RangeKey[]).map((k) => (
                  <Pressable key={k} onPress={() => { setRange(k); setOpenRange(false); }} style={styles.menuItem}>
                    <Text style={styles.menuText}>
                      {k === "7d" ? "7 Days" : k === "30d" ? "30 Days" : k === "90d" ? "90 Days" : k === "180d" ? "180 Days" : "360 Days"}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Chart */}
        <View style={styles.chartWrap} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
          <Svg width="100%" height="100%">
            <G>
              {yTicks.map((t, i) => {
                const y = yFor(t);
                return (
                  <React.Fragment key={`y-${i}`}>
                    <SvgLine x1={M.left} x2={w - M.right} y1={y} y2={y} stroke="#16222c" strokeWidth={1} />
                    <SvgText x={M.left - 6} y={y + 3} fill="#8AA0B5" fontSize={10} textAnchor="end">
                      {t}
                    </SvgText>
                  </React.Fragment>
                );
              })}
              {series.map((p, i) => {
                const x = xFor(i);
                const lbl = range === "180d" || range === "360d" ? yOnly(p.date) : md(p.date);
                return (
                  <SvgText key={`x-${i}`} x={x} y={H - 12} fill="#8AA0B5" fontSize={10} textAnchor="middle">
                    {lbl}
                  </SvgText>
                );
              })}
              <SvgLine x1={M.left} x2={w - M.right} y1={H - M.bottom} y2={H - M.bottom} stroke="#22303d" strokeWidth={1} />
              <SvgLine x1={M.left} x2={M.left} y1={M.top} y2={H - M.bottom} stroke="#22303d" strokeWidth={1} />
            </G>

            {linePath ? <Path d={linePath} fill="none" stroke={theme.colors.primary600} strokeWidth={2} /> : null}
            {series.map((p, i) => (
              <Circle key={`pt-${i}`} cx={xFor(i)} cy={yFor(p.y)} r={4.5} stroke="#0a1a13" strokeWidth={2} fill={theme.colors.primary600} />
            ))}
          </Svg>
        </View>
      </View>
      {/* =================== /Progress (GRAPH) =================== */}

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
    fontFamily: "Geist_800ExtraBold", // 3rd
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

  /* === graph-specific styles (match Basketball/Baseball) === */
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
  dropRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "#0A0F12",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  dropdownActive: { borderColor: theme.colors.primary600, backgroundColor: "#0E1316" },
  dropdownText: { color: theme.colors.textHi, fontSize: 12, letterSpacing: 0.2, fontFamily: FONT.uiSemi },
  menu: {
    position: "absolute",
    top: 42,
    left: 0,
    right: 0,
    backgroundColor: "#0E1216",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    overflow: "hidden",
    zIndex: 20,
  },
  menuItem: { paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)" },
  menuText: { color: theme.colors.textHi, fontSize: 12, fontFamily: FONT.uiSemi },
  chartWrap: {
    height: 220,
    backgroundColor: "#0B121A",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1a2230",
    overflow: "hidden",
  },

  /* Chips kept (component still defined even if not used in Progress) */
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

  rowLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 10,
  },
  rowMark: {
    width: 3,
    height: 16,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
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

