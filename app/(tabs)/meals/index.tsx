import React, { useEffect, useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  StyleSheet,
  LayoutChangeEvent,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../../constants/theme";
import {
  MEAL_TYPES,
  type MealType,
  useMeals,
  type Food,
  type FoodEntry,
} from "../../../providers/MealsContext";
import Svg, { G, Line as SvgLine, Path, Circle, Text as SvgText } from "react-native-svg";

/* Fonts */
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

const FONT = {
  uiRegular: "Geist_400Regular",
  uiMedium: "Geist_500Medium",
  uiSemi: "Geist_600SemiBold",
  uiBold: "Geist_700Bold",
  uiXBold: "Geist_800ExtraBold",
  displayMed: "SpaceGrotesk_600SemiBold",
  displayBold: "SpaceGrotesk_700Bold",
};

const TEXT = theme.colors.textHi;
const DIM = theme.colors.textLo;
const STROKE = theme.colors.strokeSoft;
const GREEN = theme.colors.primary600;
const CARD = theme.colors.surface1;

/* Helpers */
type MacroKey = "calories" | "protein" | "carbs" | "fat" | "sugar" | "sodium";
type RangeKey = "7d" | "30d" | "90d" | "180d" | "360d";

const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};
const md = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;
const yearOnly = (d: Date) => `${d.getFullYear()}`;

function binsFor(range: RangeKey) {
  switch (range) {
    case "7d": return { bins: 7, stepDays: 1 };
    case "30d": return { bins: 4, stepDays: 7 };
    case "90d": return { bins: 6, stepDays: 14 };
    case "180d": return { bins: 6, stepDays: 30 };
    case "360d": return { bins: 6, stepDays: 60 };
  }
}
function mockAverageFor(macro: MacroKey) {
  switch (macro) {
    case "calories": return 2400;
    case "protein":  return 120;
    case "carbs":    return 260;
    case "fat":      return 75;
    case "sugar":    return 60;
    case "sodium":   return 2000;
  }
}
const randomNear = (avg: number, spread: number) =>
  Math.max(0, Math.round(avg + (Math.random() * 2 - 1) * spread));

type Point = { x: number; y: number; date: Date };
function generateSeries(macro: MacroKey, range: RangeKey): { data: Point[]; avg: number } {
  const { bins, stepDays } = binsFor(range);
  const avg = mockAverageFor(macro);
  const spread = Math.max(6, Math.round(avg * 0.12));
  const data: Point[] = Array.from({ length: bins }).map((_, i) => {
    const daysBack = (bins - 1 - i) * stepDays;
    return { x: i + 1, y: randomNear(avg, spread), date: daysAgo(daysBack) };
  });
  return { data, avg };
}
function yTicksFrom(avg: number) {
  const step = Math.max(1, Math.round(avg * 0.05));
  const arr = [
    avg - step * 4, avg - step * 3, avg - step * 2, avg - step,
    avg, avg + step, avg + step * 2, avg + step * 3, avg + step * 4,
  ].map((n) => Math.max(0, n));
  return Array.from(new Set(arr)).sort((a, b) => a - b);
}

/* Small dropdown pill */
function Drop({
  label,
  open,
  onPress,
}: { label: string; open: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.dropdown, open && styles.dropdownActive]}>
      <Text style={styles.dropdownText}>{label}</Text>
      <Text style={{ color: open ? theme.colors.primary600 : theme.colors.textHi }}>▾</Text>
    </Pressable>
  );
}

export default function MealsHome() {
  const [geistLoaded] = useGeist({
    Geist_400Regular, Geist_500Medium, Geist_600SemiBold, Geist_700Bold, Geist_800ExtraBold,
  });
  const [sgLoaded] = useSpaceGrotesk({ SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold });
  const fontsReady = geistLoaded && sgLoaded;

  const router = useRouter();
  const params = useLocalSearchParams<{ add?: string; to?: MealType }>();

  const {
    meals, totalsFor, entryTotals, addFood,
    burnedCalories, setBurnedCalories, dayCalories, netCalories,
  } = useMeals();

  // ingest scanned item
  const [incoming, setIncoming] = useState<Food | null>(null);
  useEffect(() => {
    if (params.add) {
      try {
        const parsed = JSON.parse(decodeURIComponent(params.add));
        const asFood = ({
          name: parsed.name ?? "Food item",
          brand: parsed.brand ?? undefined,
          barcode: parsed.barcode ?? undefined,
          servingSize: parsed.servingSize ?? undefined,
          calories: parsed.calories ?? null,
          protein: parsed.protein ?? null,
          carbs: parsed.carbs ?? null,
          fat: parsed.fat ?? null,
          sugar: parsed.sugar ?? null,
          sodium: parsed.sodium ?? null,
          source: "barcode",
          servingPct: parsed.servingPct ?? 100,
        } as Food & { servingPct?: number });

        const target = params.to;
        if (target && (MEAL_TYPES as readonly MealType[]).includes(target)) {
          addFood(target, { ...asFood, id: undefined } as Food);
        } else {
          setIncoming(asFood as Food);
        }
      } catch {}
      router.replace("/(tabs)/meals");
    }
  }, [params.add, params.to, router, addFood]);

  const addIncomingTo = (meal: MealType) => {
    if (!incoming) return;
    addFood(meal, { ...incoming, id: undefined } as Food);
    setIncoming(null);
  };

  // burned cals
  const [burnEdit, setBurnEdit] = useState<string>("");
  useEffect(() => setBurnEdit(String(burnedCalories || "")), [burnedCalories]);
  const commitBurn = () => {
    const n = Number(burnEdit.replace(/[^\d]/g, ""));
    setBurnedCalories(Number.isFinite(n) ? n : 0);
  };

  // day totals (robust sugar/sodium)
  const dayTotals = useMemo(() => {
    const scalePct = (v: number | null | undefined, pct: number | undefined) =>
      v == null ? 0 : Math.round((v * (pct ?? 100)) / 100);

    const getSugar = (e: any) =>
      e?.sugar ?? e?.sugars ?? e?.added_sugars ?? 0;

    const getSodium = (e: any) => {
      if (e?.sodium != null) return e.sodium;               // g
      if (e?.sodium_mg != null) return e.sodium_mg / 1000;  // mg -> g
      if (e?.salt != null) return e.salt / 2.5;             // salt -> sodium
      return 0;
    };

    let calories = 0, protein = 0, carbs = 0, fat = 0, sugar = 0, sodium = 0;
    for (const m of MEAL_TYPES) {
      for (const e of meals[m]) {
        const t = entryTotals(e);
        calories += t.calories;
        protein += t.protein;
        carbs += t.carbs;
        fat += t.fat;
        sugar  += scalePct(getSugar(e as any), (e as FoodEntry).servingPct);
        sodium += scalePct(getSodium(e as any), (e as FoodEntry).servingPct);
      }
    }
    return { calories, protein, carbs, fat, sugar, sodium };
  }, [meals, entryTotals]);

  const GOAL = { calories: 2500, protein: 160, carbs: 400, fat: 90, sugar: 80, sodium: 2300 };

  // graph
  const [macro, setMacro] = useState<MacroKey>("calories");
  const [range, setRange] = useState<RangeKey>("7d");
  const [openMacro, setOpenMacro] = useState(false);
  const [openRange, setOpenRange] = useState(false);

  const { data: series, avg } = useMemo(() => generateSeries(macro, range), [macro, range]);
  const yTicks = useMemo(() => yTicksFrom(avg), [avg]);
  const yMin = yTicks[0];
  const yMax = yTicks[yTicks.length - 1];

  const [w, setW] = useState(0);
  const H = 240;
  const M = { top: 10, bottom: 38, left: 40, right: 18 };
  const innerW = Math.max(0, w - M.left - M.right);
  const innerH = H - M.top - M.bottom;
  const onLayoutChart = (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width);
  const xFor = (i: number) => M.left + (series.length <= 1 ? 0 : (i * innerW) / (series.length - 1));
  const yFor = (val: number) => M.top + innerH - (innerH * (val - yMin)) / Math.max(1, yMax - yMin);
  const linePath = useMemo(() => {
    if (!series.length) return "";
    return series.map((p, i) => `${i === 0 ? "M" : "L"} ${xFor(i)} ${yFor(p.y)}`).join(" ");
  }, [series, w, yMin, yMax]);

  if (!fontsReady) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.bg0, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg0 }}>
      {/* Header */}
      <View style={{ alignItems: "center", marginTop: 32, paddingHorizontal: theme.layout.xl }}>
        <Text style={styles.headerMeals}>Meals</Text>
        <View style={styles.headerUnderline} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: theme.layout.lg, paddingBottom: theme.layout.xxl }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Scan button */}
        <Pressable
          onPress={() => router.push("/(tabs)/meals/scan")}
          style={styles.scanBtn}
          accessibilityRole="button"
          accessibilityLabel="Scan Barcode"
        >
          <Ionicons name="barcode-outline" size={32} color={theme.colors.textHi} />
          <Text style={styles.scanBtnText}>Scan Barcode</Text>
        </Pressable>

        {/* Meals list */}
        {MEAL_TYPES.map((meal, i) => {
          const total = totalsFor(meal).calories;
          return (
            <View key={meal} style={{ marginTop: i === 0 ? 18 : theme.layout.lg }}>
              <Pressable
                onPress={() => router.push({ pathname: "/(tabs)/meals/search", params: { meal } })}
                style={styles.mealBar}
              >
                <Text style={[styles.mealBarText, { fontFamily: FONT.uiSemi }]}>+ Add to {meal}</Text>
                <Text style={[styles.mealBarKcal, { fontFamily: FONT.displayBold }]}>{total}</Text>
              </Pressable>

              <View style={styles.itemsCard}>
                {meals[meal].length === 0 ? (
                  <Text style={styles.emptyText}>No items yet</Text>
                ) : (
                  meals[meal].map((e) => {
                    const t = entryTotals(e);
                    const portion =
                      e.servingPct && e.servingPct !== 100 ? ` (${Math.round(e.servingPct) / 100})` : "";
                    return (
                      <Pressable
                        key={e.entryId}
                        onPress={() =>
                          router.push({ pathname: "/(tabs)/meals/food", params: { meal, entryId: e.entryId } })
                        }
                        style={styles.itemRow}
                      >
                        <Text style={styles.itemName} numberOfLines={2}>
                          – {e.name}
                          {portion}
                        </Text>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                          <Text style={[styles.kcalRight, { fontFamily: FONT.displayBold }]}>{t.calories}</Text>
                          <View style={styles.removeBtn}>
                            <Text style={{ color: TEXT, fontFamily: FONT.uiBold }}>×</Text>
                          </View>
                        </View>
                      </Pressable>
                    );
                  })
                )}
              </View>
            </View>
          );
        })}

        {/* Burned calories */}
        <View style={{ marginTop: 22 }}>
          <View style={styles.burnBar}>
            <Text style={[styles.burnText, { fontFamily: FONT.displayBold }]}>+ Burned Calories</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <TextInput
                value={burnEdit}
                onChangeText={setBurnEdit}
                onBlur={commitBurn}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={"#2f1a00AA"}
                style={styles.burnInput}
              />
              <Pressable onPress={commitBurn} style={styles.burnSave}>
                <Text style={{ color: "#2f1a00", fontFamily: FONT.displayBold }}>Save</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLeft, { fontFamily: FONT.uiRegular }]}>Total: {dayCalories} kcal</Text>
            <Text style={[styles.summaryRight, { fontFamily: FONT.uiBold }]}>Net: {netCalories} kcal</Text>
          </View>
        </View>

        {/* Macro Bars (includes Sodium & Sugar) */}
        <View style={styles.barsCard}>
          <MacroBar label="Calories" color="#7CFF4F" value={dayTotals.calories} goal={GOAL.calories} />
          <MacroBar label="Protein"  color="#FF4C4C" value={dayTotals.protein}  goal={GOAL.protein} />
          <MacroBar label="Carbs"    color="#6AA3FF" value={dayTotals.carbs}    goal={GOAL.carbs} />
          <MacroBar label="Fats"     color="#FFE14E" value={dayTotals.fat}      goal={GOAL.fat} />
          <MacroBar label="Sugar"    color="#C07CFF" value={dayTotals.sugar}    goal={GOAL.sugar} />
          <MacroBar label="Sodium"   color="#FFA64D" value={dayTotals.sodium}   goal={GOAL.sodium} />
        </View>

        {/* Progress graph */}
        <View style={styles.graphCard}>
          <Text style={styles.kicker}>Health</Text>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
            <Text style={styles.progressTitle}>Progress</Text>
          </View>

          {/* Two dropdowns */}
          <View style={styles.dropRow}>
            {/* Macro */}
            <View style={{ flex: 1, position: "relative" }}>
              <Drop
                open={openMacro}
                label={
                  macro === "calories" ? "Calories" :
                  macro === "protein"  ? "Protein"  :
                  macro === "carbs"    ? "Carbs"    :
                  macro === "fat"      ? "Fats"     :
                  macro === "sugar"    ? "Sugar"    : "Sodium"
                }
                onPress={() => { setOpenMacro(v => !v); setOpenRange(false); }}
              />
              {openMacro && (
                <View style={styles.menu}>
                  {(["calories","protein","carbs","fat","sugar","sodium"] as MacroKey[]).map(k => (
                    <Pressable key={k} onPress={() => { setMacro(k); setOpenMacro(false); }} style={styles.menuItem}>
                      <Text style={styles.menuText}>
                        {k === "calories" ? "Calories" : k === "protein" ? "Protein" : k === "carbs" ? "Carbs" :
                         k === "fat" ? "Fats" : k === "sugar" ? "Sugar" : "Sodium"}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            {/* Range */}
            <View style={{ flex: 1, position: "relative" }}>
              <Drop
                open={openRange}
                label={range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : range === "90d" ? "90 Days" : range === "180d" ? "180 Days" : "360 Days"}
                onPress={() => { setOpenRange(v => !v); setOpenMacro(false); }}
              />
              {openRange && (
                <View style={styles.menu}>
                  {(["7d","30d","90d","180d","360d"] as RangeKey[]).map(k => (
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

          {/* chart */}
          <View
            onLayout={onLayoutChart}
            style={{
              height: 240,
              backgroundColor: "#0B121A",
              borderRadius: 14,
              borderWidth: 1,
              borderColor: STROKE,
              overflow: "hidden",
            }}
          >
            <Svg width="100%" height="100%">
              <G>
                {yTicks.map((t, i) => {
                  const y = yFor(t);
                  return (
                    <SvgLine key={`gy-${i}`} x1={M.left} x2={w - M.right} y1={y} y2={y} stroke="#16222c" strokeWidth={1} />
                  );
                })}
                {yTicks.map((t, i) => {
                  const y = yFor(t);
                  return (
                    <SvgText key={`gt-${i}`} x={M.left - 6} y={y + 3} fill="#8AA0B5" fontSize={10} textAnchor="end">
                      {t}
                    </SvgText>
                  );
                })}
                {series.map((p, i) => {
                  const x = xFor(i);
                  const label = range === "180d" || range === "360d" ? yearOnly(p.date) : md(p.date);
                  return (
                    <SvgText key={`xl-${i}`} x={x} y={240 - 14} fill="#8AA0B5" fontSize={10} textAnchor="middle">
                      {label}
                    </SvgText>
                  );
                })}
                <SvgLine x1={M.left} x2={w - M.right} y1={240 - M.bottom} y2={240 - M.bottom} stroke="#22303d" strokeWidth={1} />
                <SvgLine x1={M.left} x2={M.left} y1={M.top} y2={240 - M.bottom} stroke="#22303d" strokeWidth={1} />
              </G>

              {linePath ? <Path d={linePath} fill="none" stroke={GREEN} strokeWidth={2} /> : null}

              {series.map((p, i) => (
                <Circle key={`pt-${i}`} cx={xFor(i)} cy={yFor(p.y)} r={4.5} stroke="#0a1a13" strokeWidth={2} fill={GREEN} />
              ))}
            </Svg>
          </View>
        </View>
      </ScrollView>

      {/* Incoming chooser */}
      {incoming && (
        <View style={styles.sheetBackdrop}>
          <View style={styles.sheet}>
            <Text style={{ color: TEXT, fontSize: 16, fontFamily: FONT.displayBold }}>
              Add “{incoming.name}” to:
            </Text>
            <View style={styles.sheetButtons}>
              {MEAL_TYPES.map((m) => (
                <Pressable key={m} onPress={() => addIncomingTo(m)} style={styles.sheetBtn}>
                  <Text style={{ color: TEXT, fontFamily: FONT.displayBold }}>{m}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable onPress={() => setIncoming(null)} style={styles.sheetCancel}>
              <Text style={{ color: DIM, fontFamily: FONT.uiBold }}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

/* Macro bar */
function MacroBar({ label, color, value, goal }: { label: string; color: string; value: number; goal: number }) {
  const pct = Math.max(0, Math.min(1, goal > 0 ? value / goal : 0));
  return (
    <View style={{ marginBottom: 16 }}>
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8, justifyContent: "space-between" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View style={{ width: 3, height: 16, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.35)" }} />
          <Text style={{ color: "#FFFFFF", fontSize: 16, fontFamily: FONT.displayMed }}>{label}</Text>
        </View>
        <Text style={{ color: "#FFFFFF", fontSize: 16, fontFamily: "Geist_700Bold" }}>
          {value} / {goal}
        </Text>
      </View>
      <View
        style={{
          height: 12,
          borderRadius: 10,
          backgroundColor: "#0F1418",
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: "rgba(255,255,255,0.08)",
          overflow: "hidden",
        }}
      >
        <View style={{ width: `${pct * 100}%`, height: "100%", backgroundColor: color }} />
      </View>
    </View>
  );
}

/* Styles */
const styles = StyleSheet.create({
  headerMeals: {
    color: theme.colors.textHi,
    fontSize: 28,
    letterSpacing: 0.2,
    fontFamily: "Geist_800ExtraBold",
  },
  headerUnderline: {
    height: 3,
    alignSelf: "stretch",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 999,
    marginTop: 6,
  },

  scanBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
    borderRadius: theme.radii.lg,
    backgroundColor: "#0C1014",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    ...theme.shadow.soft,
    marginTop: 6,
  },
  scanBtnText: { color: theme.colors.textHi, fontSize: 18, fontFamily: "Geist_700Bold" },

  mealBar: {
    backgroundColor: theme.colors.surface2,
    borderWidth: 1,
    borderColor: theme.colors.strokeSoft,
    borderRadius: theme.radii.lg,
    paddingVertical: theme.layout.lg,
    paddingHorizontal: theme.layout.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    ...theme.shadow.soft,
  },
  mealBarText: { color: theme.colors.textHi, fontSize: 20 },
  mealBarKcal: { color: theme.colors.primary600, fontSize: 20 },

  itemsCard: {
    backgroundColor: theme.colors.surface1,
    borderWidth: 1,
    borderColor: theme.colors.strokeSoft,
    borderRadius: theme.radii.lg,
    padding: theme.layout.lg,
    marginTop: theme.layout.sm,
    ...theme.shadow.soft,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#11202b",
  },
  itemName: { color: TEXT, fontSize: 14, fontFamily: "Geist_400Regular" }, // slightly smaller to keep kcal + × visible
  kcalRight: { color: TEXT },
  removeBtn: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: STROKE,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: { color: DIM, fontStyle: "italic", fontFamily: "Geist_400Regular" },

  // Burned calories
  burnBar: {
    backgroundColor: "#FFC970",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#D48B1B",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  burnText: { color: "#2f1a00", fontSize: 16 },
  burnInput: {
    minWidth: 64,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: "#FFE6BF",
    color: "#2f1a00",
    fontFamily: "Geist_800ExtraBold",
    textAlign: "center",
  },
  burnSave: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "#FFDCA3",
    borderWidth: 1,
    borderColor: "#D48B1B",
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    marginTop: 8,
  },
  summaryLeft: { color: DIM, fontSize: 12 },
  summaryRight: { color: GREEN, fontSize: 12 },

  barsCard: {
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: STROKE,
    borderRadius: theme.radii.lg,
    padding: theme.layout.lg,
    marginTop: 18,
    ...theme.shadow.soft,
  },

  graphCard: {
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: STROKE,
    borderRadius: theme.radii.lg,
    padding: theme.layout.lg,
    marginTop: 18,
    ...theme.shadow.soft,
  },
  kicker: {
    color: theme.colors.textLo,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    fontSize: 12,
    fontFamily: FONT.displayBold,
    marginBottom: 2,
  },
  progressTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: Platform.select({ ios: "800", android: "700" }) as any,
  },

  /* Dropdowns */
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
    top: 42, left: 0, right: 0,
    backgroundColor: "#0E1216",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    overflow: "hidden",
    zIndex: 20,
  },
  menuItem: { paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)" },
  menuText: { color: theme.colors.textHi, fontSize: 12, fontFamily: FONT.uiSemi },

  // Bottom sheet for incoming
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  sheet: {
    width: "100%",
    backgroundColor: CARD,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderTopWidth: 1,
    borderColor: STROKE,
    padding: 16,
    gap: 12,
  },
  sheetButtons: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  sheetBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: STROKE,
    backgroundColor: "#0B121A",
  },
  sheetCancel: { alignSelf: "flex-end", padding: 8 },
});






































