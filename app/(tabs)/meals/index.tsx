// app/(tabs)/meals/index.tsx
import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import AppHeader from "../../../components/AppHeader";
import {
  MEAL_TYPES,
  type MealType,
  useMeals,
  type Food,
} from "../../../providers/MealsContext";

const DARK = "#0A0F14";
const CARD = "#111822";
const TEXT = "#E6F1FF";
const DIM = "#8AA0B5";
const GREEN = "#2BF996";
const STROKE = "#1A2430";
const ORANGE = "#FF9F1C";

export default function MealsHome() {
  const router = useRouter();
  const params = useLocalSearchParams<{ add?: string }>();

  const {
    meals,
    totalsFor,
    entryTotals,
    removeFood,
    addFood,
    burnedCalories,
    setBurnedCalories,
    dayCalories,
    netCalories,
  } = useMeals();

  // --- Handle "Add from Scan" incoming payload ---
  const [incoming, setIncoming] = useState<Food | null>(null);
  useEffect(() => {
    if (params.add) {
      try {
        const parsed = JSON.parse(decodeURIComponent(params.add));
        const asFood: Food = {
          name: parsed.name ?? "Food item",
          brand: parsed.brand ?? undefined,
          barcode: parsed.barcode ?? undefined,
          servingSize: parsed.servingSize ?? undefined,
          calories: parsed.calories ?? null,
          protein: parsed.protein ?? null,
          carbs: parsed.carbs ?? null,
          fat: parsed.fat ?? null,
          fiber: parsed.fiber ?? null,
          sugar: parsed.sugar ?? null,
          sodium: parsed.sodium ?? null,
          source: "barcode",
        };
        setIncoming(asFood);
      } catch {}
      router.replace("/(tabs)/meals");
    }
  }, [params.add, router]);

  const addIncomingTo = (meal: MealType) => {
    if (!incoming) return;
    addFood(meal, { ...incoming, id: undefined } as Food);
    setIncoming(null);
  };

  // --- Burned calories inline editor ---
  const [burnEdit, setBurnEdit] = useState<string>("");
  useEffect(() => {
    setBurnEdit(String(burnedCalories || ""));
  }, [burnedCalories]);

  const commitBurn = () => {
    const n = Number(burnEdit.replace(/[^\d]/g, ""));
    setBurnedCalories(Number.isFinite(n) ? n : 0);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: DARK }}>
      <AppHeader title="Meals" />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, padding: 14, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* ===== Each Meal Section ===== */}
        {MEAL_TYPES.map((meal) => {
          const total = totalsFor(meal).calories;
          return (
            <View key={meal} style={{ marginTop: 14 }}>
              {/* "Add to Meal" bar */}
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/(tabs)/meals/search",
                    params: { meal },
                  })
                }
                style={styles.mealBar}
              >
                <Text style={styles.mealBarText}>+ Add to {meal}</Text>
                <Text style={styles.mealBarKcal}>{total}</Text>
              </Pressable>

              {/* Items list */}
              <View style={styles.itemsCard}>
                {meals[meal].length === 0 ? (
                  <Text style={styles.emptyText}>No items yet</Text>
                ) : (
                  meals[meal].map((e) => {
                    const t = entryTotals(e);
                    const portion =
                      e.servingPct && e.servingPct !== 100
                        ? ` (${Math.round(e.servingPct) / 100})`
                        : "";
                    return (
                      <Pressable
                        key={e.entryId}
                        onPress={() =>
                          router.push({
                            pathname: "/(tabs)/meals/food",
                            params: { meal, entryId: e.entryId },
                          })
                        }
                        style={styles.itemRow}
                      >
                        <Text style={styles.itemName}>
                          – {e.name}
                          {portion}
                        </Text>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                          <Text style={styles.kcalRight}>{t.calories}</Text>
                          <Pressable
                            onPress={() => removeFood(meal, e.entryId)}
                            style={styles.removeBtn}
                          >
                            <Text style={{ color: TEXT, fontWeight: "800" }}>×</Text>
                          </Pressable>
                        </View>
                      </Pressable>
                    );
                  })
                )}
              </View>
            </View>
          );
        })}

        {/* ===== Burned calories bar ===== */}
        <View style={{ marginTop: 22 }}>
          <View style={[styles.burnBar, { borderColor: "#C57612" }]}>
            <Text style={styles.burnText}>+ Burned Calories</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <TextInput
                value={burnEdit}
                onChangeText={setBurnEdit}
                onBlur={commitBurn}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#442c00"
                style={styles.burnInput}
              />
              <Pressable onPress={commitBurn} style={styles.burnSave}>
                <Text style={{ color: "#351d00", fontWeight: "900" }}>Save</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLeft}>Total: {dayCalories} kcal</Text>
            <Text style={styles.summaryRight}>Net: {netCalories} kcal</Text>
          </View>
        </View>
      </ScrollView>

      {/* ===== Incoming from Scan: meal chooser ===== */}
      {incoming && (
        <View style={styles.sheetBackdrop}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Add “{incoming.name}” to:</Text>
            <View style={styles.sheetButtons}>
              {MEAL_TYPES.map((m) => (
                <Pressable key={m} onPress={() => addIncomingTo(m)} style={styles.sheetBtn}>
                  <Text style={styles.sheetBtnText}>{m}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable onPress={() => setIncoming(null)} style={styles.sheetCancel}>
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

/* ---------------- Styles ---------------- */
const styles = StyleSheet.create({
  mealBar: {
    backgroundColor: "#1b2a1f",
    borderWidth: 1,
    borderColor: STROKE,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  mealBarText: { color: TEXT, fontWeight: "900", fontSize: 16 },
  mealBarKcal: { color: GREEN, fontWeight: "900", fontSize: 18 },

  itemsCard: {
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: STROKE,
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#11202b",
  },
  itemName: { color: TEXT, fontSize: 16 },
  kcalRight: { color: TEXT, fontWeight: "800" },
  removeBtn: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: STROKE,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: { color: DIM, fontStyle: "italic" },

  burnBar: {
    backgroundColor: ORANGE,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  burnText: { color: "#351d00", fontWeight: "900", fontSize: 16 },
  burnInput: {
    minWidth: 64,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: "#ffd39b",
    color: "#351d00",
    fontWeight: "900",
  },
  burnSave: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "#ffe1b9",
    borderWidth: 1,
    borderColor: "#d48b1b",
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    marginTop: 8,
  },
  summaryLeft: { color: DIM, fontSize: 12 },
  summaryRight: { color: GREEN, fontSize: 12, fontWeight: "800" },

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
  sheetTitle: { color: TEXT, fontWeight: "900", fontSize: 16 },
  sheetButtons: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  sheetBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: STROKE,
    backgroundColor: "#0B121A",
  },
  sheetBtnText: { color: TEXT, fontWeight: "800" },
  sheetCancel: { alignSelf: "flex-end", padding: 8 },
  sheetCancelText: { color: DIM, fontWeight: "700" },
});











