// app/(tabs)/meals/food.tsx
import React, { useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  useMeals,
  type MealType,
  type Food,
  type FoodEntry,
} from "../../../providers/MealsContext";

/* ---- Theme ---- */
const DARK = "#0A0F14";
const CARD = "#111822";
const TEXT = "#E6F1FF";
const DIM = "#8AA0B5";
const GREEN = "#2BF996";
const STROKE = "#1A2430";

/* ---- Helpers ---- */
const round = (n: number | null | undefined) => (n == null ? 0 : Math.round(n));
const scale = (v: number | null | undefined, pct: number) =>
  v == null ? 0 : Math.round((v * pct) / 100);
const kcalFromMacros = (p: number, c: number, f: number) => p * 4 + c * 4 + f * 9;

/** simple line style generator for a line between (x1,y1) and (x2,y2) */
function lineStyle(x1: number, y1: number, x2: number, y2: number, color: string) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
  return {
    position: "absolute" as const,
    left: x1,
    top: y1,
    width: len,
    height: 2,
    backgroundColor: color,
    transform: [{ rotateZ: `${ang}deg` }],
    borderRadius: 1,
  };
}

export default function FoodBioScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ meal?: string; food?: string; entryId?: string }>();

  const meal = (params.meal as MealType) || "Breakfast";
  const entryId = params.entryId as string | undefined;

  const { meals, addFood, updateServingPct } = useMeals();

  // A) from Meals list
  const existingEntry: FoodEntry | undefined = useMemo(
    () => (entryId ? meals[meal].find((e) => e.entryId === entryId) : undefined),
    [entryId, meal, meals]
  );

  // B) from Search
  const incomingFood: Food | null = useMemo(() => {
    if (!params.food) return null;
    try {
      return JSON.parse(decodeURIComponent(params.food)) as Food;
    } catch {
      return null;
    }
  }, [params.food]);

  // Portion %
  const [pct, setPct] = useState<number>(existingEntry?.servingPct ?? 100);
  const changePct = (delta: number) =>
    setPct((p) => Math.min(500, Math.max(1, p + delta)));

  // Base values
  const base = existingEntry ?? incomingFood ?? ({} as Food);
  const protein = round(base.protein ?? 0);
  const carbs = round(base.carbs ?? 0);
  const fat = round(base.fat ?? 0);
  const baseKcal = base.calories != null ? round(base.calories) : kcalFromMacros(protein, carbs, fat);

  // Display scaled
  const dispProtein = scale(protein, pct);
  const dispCarbs = scale(carbs, pct);
  const dispFat = scale(fat, pct);
  const dispKcal = scale(baseKcal, pct);

  const title = (existingEntry?.name ?? incomingFood?.name ?? "Food").trim();
  const brand = (existingEntry?.brand ?? incomingFood?.brand)?.trim();
  const servingSize = (existingEntry?.servingSize ?? incomingFood?.servingSize)?.trim();

  const onSaveExisting = () => {
    if (!existingEntry) return;
    updateServingPct(meal, existingEntry.entryId, pct);
    router.back();
  };
  const onAddFromSearch = () => {
    if (!incomingFood) return;
    const payload: Food = {
      ...incomingFood,
      id: undefined,
      ...( { servingPct: pct } as any ),
      source: incomingFood.source ?? "search",
    };
    addFood(meal, payload);
    router.back();
  };

  // Triangle geometry
  const W = 260; // width
  const H = 200; // height
  const pad = 14;
  const A = { x: pad, y: H - pad };        // left base
  const B = { x: W - pad, y: H - pad };    // right base
  const C = { x: W / 2, y: pad };          // apex

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: DARK }}>
      <KeyboardAvoidingView behavior={Platform.select({ ios: "padding", android: undefined })} style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
            <Text style={styles.backArrow}>‹</Text>
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
          <View style={{ width: 36 }} />
        </View>
        {/* Green underline */}
        <View style={styles.underline} />

        {/* Body */}
        <View style={{ padding: 16, gap: 18 }}>
          {/* Macro Triangle */}
          <View style={styles.triCard}>
            <View style={{ width: W, height: H, alignSelf: "center" }}>
              {/* sides */}
              <View style={lineStyle(A.x, A.y, B.x, B.y, "#ffd200")} />
              <View style={lineStyle(A.x, A.y, C.x, C.y, "#ff4c4c")} />
              <View style={lineStyle(B.x, B.y, C.x, C.y, "#6aa3ff")} />

              {/* labels */}
              <Text style={[styles.sideText, { left: 6, top: 30 }]}>{dispProtein}g{"\n"}Protein</Text>
              <Text style={[styles.sideText, { right: 6, top: 30, textAlign: "right" }]}>{dispCarbs}g{"\n"}Carbs</Text>
              <Text style={[styles.sideText, { bottom: 2, alignSelf: "center" }]}>{dispFat}g Fats</Text>

              {/* center kcal */}
              <View style={{ position: "absolute", left: 0, top: 0, width: W, height: H, alignItems: "center", justifyContent: "center" }}>
                <Text style={styles.centerKcal}>{dispKcal} Calories</Text>
              </View>
            </View>

            <View style={{ gap: 6 }}>
              {brand ? <Text style={{ color: DIM }}>{brand}</Text> : null}
              {servingSize ? <Text style={{ color: DIM }}>Serving size: {servingSize}</Text> : null}
            </View>
          </View>

          {/* % of Servings */}
          <View style={styles.sidePanel}>
            <Text style={styles.panelTitle}>% of Servings</Text>
            <View style={styles.pctRow}>
              <Pressable onPress={() => changePct(-10)} style={styles.pctBtn}>
                <Text style={styles.pctBtnText}>–10</Text>
              </Pressable>

              <TextInput
                value={String(pct)}
                onChangeText={(t) => {
                  const n = Number(t.replace(/[^\d]/g, ""));
                  setPct(Number.isFinite(n) ? Math.min(500, Math.max(1, n)) : 100);
                }}
                keyboardType="numeric"
                style={styles.pctInput}
                placeholder="100"
                placeholderTextColor={DIM}
              />
              <Text style={styles.pctSign}>%</Text>

              <Pressable onPress={() => changePct(+10)} style={styles.pctBtn}>
                <Text style={styles.pctBtnText}>+10</Text>
              </Pressable>
            </View>

            <Text style={[styles.panelTitle, { marginTop: 14 }]}>Rating:</Text>
            <View style={styles.ratingBox}>
              <Text style={{ color: DIM, fontStyle: "italic" }}>Future</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          {existingEntry ? (
            <Pressable onPress={onSaveExisting} style={styles.saveBtn}>
              <Text style={styles.saveText}>Save</Text>
            </Pressable>
          ) : (
            <Pressable onPress={onAddFromSearch} style={styles.saveBtn}>
              <Text style={styles.saveText}>Add to {meal}</Text>
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ---- Styles ---- */
const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingTop: 6,
    paddingBottom: 8,
  },
  backBtn: { width: 36, height: 36, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  backArrow: { color: TEXT, fontSize: 26, lineHeight: 26, fontWeight: "700" },
  headerTitle: { flex: 1, color: TEXT, fontSize: 20, fontWeight: "900", textAlign: "center" },
  underline: { height: 3, backgroundColor: GREEN, marginHorizontal: 16, borderRadius: 2 },

  triCard: {
    backgroundColor: CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: STROKE,
    padding: 14,
    gap: 10,
  },
  centerKcal: { color: TEXT, fontSize: 20, fontWeight: "900" },
  sideText: { position: "absolute", color: TEXT, fontWeight: "800" },

  sidePanel: {
    backgroundColor: CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: STROKE,
    padding: 14,
  },
  panelTitle: { color: TEXT, fontWeight: "900", marginBottom: 1 },
  pctRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center", // centered row
    gap: 8,
  },
  pctBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: STROKE,
    backgroundColor: "#0B121A",
  },
  pctBtnText: { color: TEXT, fontWeight: "800" },
  pctInput: {
    minWidth: 80,
    backgroundColor: "#0E141C",
    color: TEXT,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: STROKE,
    textAlign: "center",
    fontWeight: "900",
  },
  pctSign: { color: "#9FB2C5", fontWeight: "900" },
  ratingBox: {
    height: 40,
    borderWidth: 1,
    borderColor: STROKE,
    borderRadius: 10,
    backgroundColor: "#0B121A",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },

  footer: { padding: 16 },
  saveBtn: {
    backgroundColor: GREEN,
    borderRadius: 12,
    alignItems: "center",
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#0e3c24",
  },
  saveText: { color: "#052d1b", fontWeight: "900", fontSize: 16 },
});

