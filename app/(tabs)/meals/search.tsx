// app/(tabs)/meals/search.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  SafeAreaView, View, Text, TextInput, Pressable, ScrollView,
  StyleSheet, TouchableWithoutFeedback, Keyboard, ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { type Food, type MealType } from "../../../providers/MealsContext";
import { searchAllProviders } from "../../../lib/providers/merge";

const DARK = "#0A0F14";
const CARD = "#111822";
const TEXT = "#E6F1FF";
const DIM = "#8AA0B5";
const GREEN = "#2BF996";
const STROKE = "#1A2430";

export default function MealsSearch() {
  const router = useRouter();
  const params = useLocalSearchParams<{ meal?: MealType }>();
  const meal = (params.meal as MealType) || "Breakfast";

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [results, setResults] = useState<Food[]>([]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = useRef<AbortController | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (inFlight.current) { inFlight.current.abort(); inFlight.current = null; }

    const q = query.trim();
    if (!q) { setResults([]); setErrorMsg(null); return; }

    debounceRef.current = setTimeout(() => {
      (async () => {
        const aborter = new AbortController();
        inFlight.current = aborter;
        try {
          setLoading(true);
          setErrorMsg(null);

          const items = await searchAllProviders(q, aborter);
          setResults(items);
          setErrorMsg(items.length === 0 ? "No results yet. Try brand + item (e.g., 'Jersey Mikes turkey')." : null);
        } catch (e: any) {
          if (e?.name !== "AbortError") {
            setErrorMsg("Network error. Try again.");
            setResults([]);
          }
        } finally {
          setLoading(false);
          inFlight.current = null;
        }
      })();
    }, 300);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: DARK }}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Text style={styles.backArrow}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Search Food</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={{ paddingHorizontal: 14 }}>
        <TextInput
          placeholder="Search foods… (brand + item works best)"
          placeholderTextColor={DIM}
          value={query}
          onChangeText={setQuery}
          autoFocus
          style={styles.searchInput}
          returnKeyType="search"
        />
      </View>

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

          {results.map((f, idx) => (
            <Pressable
              key={idx}
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/meals/food",
                  params: { meal, food: encodeURIComponent(JSON.stringify(f)) },
                })
              }
              style={[styles.resultCard, { marginBottom: 1 }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.resultName} numberOfLines={2}>{f.name}</Text>
                {f.brand ? <Text style={styles.resultServing} numberOfLines={1}>{f.brand}</Text> : null}
              </View>
              <Text style={styles.resultKcal}>
                {f.calories != null ? `${Math.round(f.calories)} Cal` : "—"}
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

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingTop: 6, paddingBottom: 8 },
  backBtn: { width: 36, height: 36, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  backArrow: { color: TEXT, fontSize: 26, lineHeight: 26, fontWeight: "700" },
  headerTitle: { flex: 1, color: TEXT, fontSize: 18, fontWeight: "900", textAlign: "center" },
  searchInput: { backgroundColor: CARD, color: TEXT, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: STROKE },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, marginBottom: 8 },
  statusText: { color: DIM },
  errorText: { color: "#ffb3b3", paddingHorizontal: 14, marginBottom: 8 },
  resultCard: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#0B121A", borderRadius: 12, borderWidth: 1, borderColor: GREEN, paddingVertical: 12, paddingHorizontal: 12 },
  resultName: { color: TEXT, fontWeight: "800" },
  resultServing: { color: DIM, marginTop: 2 },
  resultKcal: { color: GREEN, fontWeight: "900", marginLeft: 8 },
});












