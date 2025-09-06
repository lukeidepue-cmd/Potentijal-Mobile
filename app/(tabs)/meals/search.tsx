// app/(tabs)/meals/search.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { type Food, type MealType } from "../../../providers/MealsContext";

/* ---------- Theme (match Meals) ---------- */
const DARK = "#0A0F14";
const CARD = "#111822";
const TEXT = "#E6F1FF";
const DIM = "#8AA0B5";
const GREEN = "#2BF996"; // same as scanner rectangle
const STROKE = "#1A2430";

/* ---------- Types ---------- */
type OFFProduct = {
  product_name?: string;
  product_name_en?: string;
  brands?: string;
  code?: string;
  serving_size?: string;
  nutriments?: Record<string, any>;
  lang?: string;
  languages_tags?: string[]; // e.g., ["en:english", ...]
};

/* ---------- Fallback suggestions (offline) ---------- */
const OFFLINE_SUGGESTIONS: Array<{
  name: string;
  brand?: string;
  calories: number;
  servingSize?: string;
}> = [
  { name: "Banana", calories: 105, servingSize: "118 g" },
  { name: "Apple", calories: 95, servingSize: "182 g" },
  { name: "Greek Yogurt, plain", calories: 130, servingSize: "1 cup" },
  { name: "Chicken Breast, grilled", calories: 165, servingSize: "100 g" },
  { name: "White Rice, cooked", calories: 200, servingSize: "1 cup (158 g)" },
  { name: "Oatmeal, cooked", calories: 150, servingSize: "1 cup" },
  { name: "Whole Egg", calories: 70, servingSize: "1 large (50 g)" },
  { name: "Peanut Butter", calories: 190, servingSize: "2 tbsp (32 g)" },
  { name: "Pasta, cooked", calories: 210, servingSize: "1 cup (140 g)" },
  { name: "Protein Bar", calories: 200, servingSize: "1 bar" },
];

/* ---------- Helpers ---------- */
function firstNumber(...vals: Array<unknown>): number | null {
  for (const v of vals) {
    if (v == null) continue;
    const n = typeof v === "number" ? v : parseFloat(String(v));
    if (Number.isFinite(n)) return n;
  }
  return null;
}
function kJtoKcal(kj: number | null): number | null {
  if (kj == null) return null;
  return Math.round(kj / 4.184);
}
function pickCalories(nutr: Record<string, any> | undefined): number | null {
  if (!nutr) return null;
  const kcalServing = firstNumber(nutr["energy-kcal_serving"], nutr["energy_kcal_serving"]);
  if (kcalServing != null) return Math.round(kcalServing);
  const kjServing = firstNumber(nutr["energy_serving"]);
  if (kjServing != null) return kJtoKcal(kjServing);
  const kcal100 = firstNumber(nutr["energy-kcal_100g"], nutr["energy_kcal_100g"]);
  if (kcal100 != null) return Math.round(kcal100);
  const kj100 = firstNumber(nutr["energy_100g"]);
  if (kj100 != null) return kJtoKcal(kj100);
  return null;
}
function pickMacro(nutr: Record<string, any> | undefined, key: string): number | null {
  if (!nutr) return null;
  const perServing = firstNumber(nutr[`${key}_serving`]);
  if (perServing != null) return Math.round(perServing);
  const per100g = firstNumber(nutr[`${key}_100g`]);
  if (per100g != null) return Math.round(per100g);
  return null;
}

/* ---------- Component ---------- */
export default function MealsSearch() {
  const router = useRouter();
  const params = useLocalSearchParams<{ meal?: MealType }>();
  const meal = (params.meal as MealType) || "Breakfast";

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [results, setResults] = useState<Food[]>([]);

  // Debounce search
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const q = query.trim();
    if (!q) {
      setResults([]);
      setErrorMsg(null);
      return;
    }

    debounceRef.current = setTimeout(() => {
      (async () => {
        try {
          setLoading(true);
          setErrorMsg(null);

          // English-only query + fields for language filtering
          const url =
            "https://world.openfoodfacts.org/cgi/search.pl" +
            "?search_simple=1&action=process&json=1" +
            "&page_size=30&lc=en&lang=en" +
            "&fields=product_name,product_name_en,brands,code,serving_size,nutriments,lang,languages_tags" +
            "&search_terms=" +
            encodeURIComponent(q);

          const resp = await fetch(url);
          const data = await resp.json();
          const products: OFFProduct[] = Array.isArray(data?.products) ? data.products : [];

          const mapped: Food[] = products
            // Filter to English entries
            .filter((p) => {
              const tags = p.languages_tags || [];
              const isEn = p.lang === "en" || tags.includes("en:english") || !!p.product_name_en;
              return isEn;
            })
            .map((p) => {
              const calories = pickCalories(p.nutriments);
              const f: Food = {
                name: (p.product_name_en || p.product_name || "").trim() || "Food",
                brand: p.brands ? String(p.brands).split(",")[0].trim() : undefined,
                barcode: p.code || undefined,
                servingSize: p.serving_size || undefined,
                calories,
                protein: pickMacro(p.nutriments, "proteins"),
                carbs: pickMacro(p.nutriments, "carbohydrates"),
                fat: pickMacro(p.nutriments, "fat"),
                fiber: pickMacro(p.nutriments, "fiber"),
                sugar: pickMacro(p.nutriments, "sugars"),
                sodium: pickMacro(p.nutriments, "sodium"),
                source: "search",
              };
              return f;
            })
            .filter((f) => f.name && f.calories != null);

          setResults(mapped);
          if (mapped.length === 0) setErrorMsg("No results found. Try a simpler term (e.g., brand + item).");
          else setErrorMsg(null);
        } catch {
          setErrorMsg("Network error. Showing quick suggestions.");
          const fallback: Food[] = OFFLINE_SUGGESTIONS.map((s) => ({
            name: s.name,
            brand: s.brand,
            barcode: undefined,
            servingSize: s.servingSize,
            calories: s.calories,
            protein: null,
            carbs: null,
            fat: null,
            fiber: null,
            sugar: null,
            sodium: null,
            source: "search",
          }));
          setResults(fallback);
        } finally {
          setLoading(false);
        }
      })();
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: DARK }}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Text style={styles.backArrow}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Search Food</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Search input */}
      <View style={{ paddingHorizontal: 14 }}>
        <TextInput
          placeholder="Search foods… (e.g., 'chicken breast', 'Ben & Jerry’s')"
          placeholderTextColor={DIM}
          value={query}
          onChangeText={setQuery}
          autoFocus
          style={styles.searchInput}
          returnKeyType="search"
        />
      </View>

      {/* Tap anywhere to dismiss keyboard */}
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView
          style={{ flex: 1, marginTop: 10 }}
          contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          {loading && (
            <View style={styles.statusRow}>
              <ActivityIndicator color={GREEN} />
              <Text style={styles.statusText}>Searching…</Text>
            </View>
          )}

          {!loading && errorMsg && results.length === 0 && (
            <Text style={styles.errorText}>{errorMsg}</Text>
          )}

          {/* Results */}
          {results.map((f, idx) => (
            <Pressable
              key={idx}
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/meals/food",
                  params: { meal, food: encodeURIComponent(JSON.stringify(f)) },
                })
              }
              style={[styles.resultCard, { marginBottom: 1 }]} // 1px spacing
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.resultName} numberOfLines={2}>
                  {f.name}
                </Text>
                {f.brand ? (
                  <Text style={styles.resultServing} numberOfLines={1}>
                    {f.brand}
                  </Text>
                ) : null}
              </View>
              <Text style={styles.resultKcal}>
                {f.calories != null ? `${Math.round(f.calories)} Cal:` : "—"}
              </Text>
            </Pressable>
          ))}

          {!loading && !errorMsg && results.length === 0 && (
            <Text style={{ color: DIM, textAlign: "center", marginTop: 24 }}>
              Start typing to search the database.
            </Text>
          )}
        </ScrollView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

/* ---------------- Styles ---------------- */
const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingTop: 6,
    paddingBottom: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  backArrow: { color: TEXT, fontSize: 26, lineHeight: 26, fontWeight: "700" },
  headerTitle: {
    flex: 1,
    color: TEXT,
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
  },

  searchInput: {
    backgroundColor: CARD,
    color: TEXT,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: STROKE,
  },

  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  statusText: { color: DIM },
  errorText: { color: "#ffb3b3", paddingHorizontal: 14, marginBottom: 8 },

  resultCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#0B121A",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GREEN,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  resultName: { color: TEXT, fontWeight: "800" },
  resultServing: { color: DIM, marginTop: 2 },
  resultKcal: { color: GREEN, fontWeight: "900", marginLeft: 8 },
});





