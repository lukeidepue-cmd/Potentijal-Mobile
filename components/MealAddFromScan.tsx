// components/MealAddFromScan.tsx — align with MealsContext Food type (no ts-expect-error)
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMeals, MEAL_TYPES, type MealType, type Food } from '../providers/MealsContext';

type Entry = {
  name: string;
  brand?: string;
  barcode?: string;
  servingSize?: string;
  calories?: number | null;
  protein?: number | null;
  carbs?: number | null;
  fat?: number | null;
  fiber?: number | null;
  sugar?: number | null;
  sodium?: number | null;
  source?: string;
  createdAt?: string;
};

export default function MealAddFromScan() {
  const router = useRouter();
  const params = useLocalSearchParams<{ add?: string }>();
  const [pending, setPending] = useState<Entry | null>(null);

  const { addFood } = useMeals(); // expects addFood(meal: MealType, food: Food)

  useEffect(() => {
    if (params.add) {
      try {
        const decoded = decodeURIComponent(params.add);
        const obj = JSON.parse(decoded) as Entry;
        setPending(obj);
      } catch {
        // ignore invalid payloads
      }
    }
  }, [params.add]);

  const macros = useMemo((): Array<[string, number | null | undefined, string]> => {
    if (!pending) return [];
    return [
      ['Calories', pending.calories, 'kcal'],
      ['Protein', pending.protein, 'g'],
      ['Carbs', pending.carbs, 'g'],
      ['Fat', pending.fat, 'g'],
      ['Fiber', pending.fiber, 'g'],
      ['Sugar', pending.sugar, 'g'],
      ['Sodium', pending.sodium, 'g'],
    ];
  }, [pending]);

  if (!pending) return null;

  const clearParam = () => router.replace('/(tabs)/meals');

  const makeId = () => `scan_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const buildFoodFromEntry = (e: Entry): Food => {
    // Minimal required fields for Food (id, name), plus extra fields attached at runtime.
    const food = { id: makeId(), name: e.name || 'Food item' } as Food;

    // Attach optional fields without upsetting TS (structural typing + cast already done).
    const extra: Record<string, any> = {
      brand: e.brand,
      barcode: e.barcode,
      servingSize: e.servingSize,
      calories: e.calories ?? 0,
      protein: e.protein ?? 0,
      carbs: e.carbs ?? 0,
      fat: e.fat ?? 0,
      fiber: e.fiber ?? 0,
      sugar: e.sugar ?? 0,
      sodium: e.sodium ?? 0,
      servingPct: 100,
      source: e.source || 'barcode',
      createdAt: e.createdAt ?? new Date().toISOString(),
    };

    Object.assign(food, extra);
    return food;
  };

  const handleAdd = (meal: MealType) => {
    try {
      const food: Food = buildFoodFromEntry(pending);
      addFood(meal, food); // exact signature your app expects
      Alert.alert('Added', `Saved to ${meal}`);
      clearParam();
    } catch (e) {
      console.error('addFood error', e);
      Alert.alert('Could not add automatically', 'Please add manually.');
      clearParam();
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{pending.name}</Text>
      {!!pending.brand && <Text style={styles.dim}>{pending.brand}</Text>}
      {!!pending.servingSize && <Text style={styles.dim}>Serving size: {pending.servingSize}</Text>}

      <View style={{ height: 8 }} />

      {macros.map(([label, val, unit]) => (
        <View key={label} style={styles.row}>
          <Text style={styles.rowLabel}>{label}</Text>
          <Text style={styles.rowValue}>
            {val != null ? `${Math.round((val as number) * 10) / 10} ${unit}` : '—'}
          </Text>
        </View>
      ))}

      <View style={{ height: 10 }} />

      <Text style={[styles.dim, { marginBottom: 6 }]}>Save to:</Text>
      <View style={styles.choices}>
        {MEAL_TYPES.map((meal) => (
          <TouchableOpacity key={meal} style={styles.choice} onPress={() => handleAdd(meal)}>
            <Text style={styles.choiceText}>{meal}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.secondary} onPress={clearParam}>
        <Text style={styles.secondaryText}>Dismiss</Text>
      </TouchableOpacity>
    </View>
  );
}

const CARD = '#111822';
const TEXT = '#e6f1ff';
const DIM = '#8aa0b5';
const GREEN = '#2bf996';

const styles = StyleSheet.create({
  wrap: { backgroundColor: CARD, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#1a2430', marginBottom: 12 },
  title: { color: TEXT, fontSize: 16, fontWeight: '800' },
  dim: { color: DIM, fontSize: 12, marginTop: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  rowLabel: { color: TEXT },
  rowValue: { color: GREEN, fontWeight: '800' },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  choice: { backgroundColor: GREEN, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 12 },
  choiceText: { color: '#052d1b', fontWeight: '900' },
  secondary: { backgroundColor: '#0b121a', borderRadius: 14, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: '#1a2430', marginTop: 8 },
  secondaryText: { color: TEXT, fontWeight: '700' },
});




