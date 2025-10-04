import React, { createContext, useMemo, useState } from "react";
import { nanoid } from "nanoid/non-secure";

export type MealType = "Breakfast" | "Lunch" | "Dinner" | "Snacks";
export const MEAL_TYPES: MealType[] = ["Breakfast", "Lunch", "Dinner", "Snacks"];

/* ---------------- Types ---------------- */
export type Food = {
  id?: string;
  name: string;
  brand?: string;
  barcode?: string;
  servingSize?: string;

  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;

  /* optional extras */
  fiber?: number | null;
  sugar?: number | null;   // ← new macro we want everywhere
  sodium?: number | null;

  source?: "barcode" | "search";
};

export type FoodEntry = Food & {
  entryId: string;
  /** 100 means 1x serving. If omitted, treat as 100. */
  servingPct?: number;
  /** Not required anywhere; kept flexible */
  createdAt?: string;
};

export type Totals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sugar: number;           // ← included in all totals
};

type MealsState = Record<MealType, FoodEntry[]>;

export type MealsCtx = {
  meals: MealsState;

  addFood: (meal: MealType, food: Food) => string; // returns new entryId
  removeFood: (meal: MealType, entryId: string) => void;
  updateServingPct: (meal: MealType, entryId: string, pct: number) => void;

  totalsFor: (meal: MealType) => Totals;
  entryTotals: (e: FoodEntry) => Totals;

  // Burned calories (for "Net:")
  burnedCalories: number;
  setBurnedCalories: (n: number) => void;
  addBurnedCalories: (n: number) => void;

  // Day totals
  dayCalories: number; // sum of all meals (kcal)
  netCalories: number; // dayCalories - burnedCalories
};

const MealsContext = createContext<MealsCtx | null>(null);

/* -------------- Provider -------------- */
export function MealsProvider({ children }: { children: React.ReactNode }) {
  const [meals, setMeals] = useState<MealsState>({
    Breakfast: [],
    Lunch: [],
    Dinner: [],
    Snacks: [],
  });

  const [burnedCalories, setBurnedCalories] = useState<number>(0);

  /* ---------- CRUD ---------- */
  const addFood: MealsCtx["addFood"] = (meal, food) => {
    const entryId = nanoid();
    const entry: FoodEntry = {
      ...food,
      entryId,
      servingPct: (food as any).servingPct ?? 100,
      createdAt: new Date().toISOString(),
    };
    setMeals((prev) => ({ ...prev, [meal]: [entry, ...prev[meal]] }));
    return entryId;
  };

  const removeFood: MealsCtx["removeFood"] = (meal, entryId) => {
    setMeals((prev) => ({
      ...prev,
      [meal]: prev[meal].filter((e) => e.entryId !== entryId),
    }));
  };

  const updateServingPct: MealsCtx["updateServingPct"] = (meal, entryId, pct) => {
    setMeals((prev) => ({
      ...prev,
      [meal]: prev[meal].map((e) =>
        e.entryId === entryId ? { ...e, servingPct: pct } : e
      ),
    }));
  };

  /* ---------- Math helpers ---------- */
  const scale = (v: number | null | undefined, pct?: number) => {
    const p = pct ?? 100;
    const base = v ?? 0;
    return Math.max(0, Math.round((base * p) / 100));
  };

  /* ---------- Totals per entry & meal ---------- */
  const entryTotals: MealsCtx["entryTotals"] = (e) => {
    const p = e.servingPct ?? 100;
    return {
      calories: scale(e.calories, p),
      protein:  scale(e.protein,  p),
      carbs:    scale(e.carbs,    p),
      fat:      scale(e.fat,      p),
      sugar:    scale(e.sugar,    p),
    };
  };

  const totalsFor: MealsCtx["totalsFor"] = (meal) => {
    return meals[meal].reduce<Totals>(
      (acc, e) => {
        const t = entryTotals(e);
        acc.calories += t.calories;
        acc.protein  += t.protein;
        acc.carbs    += t.carbs;
        acc.fat      += t.fat;
        acc.sugar    += t.sugar;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0 }
    );
  };

  /* ---------- Day & net ---------- */
  const dayCalories = useMemo(
    () => MEAL_TYPES.reduce((sum, m) => sum + totalsFor(m).calories, 0),
    [meals]
  );

  const netCalories = useMemo(
    () => Math.max(0, dayCalories - burnedCalories),
    [dayCalories, burnedCalories]
  );

  const addBurnedCalories = (n: number) =>
    setBurnedCalories((v) => Math.max(0, v + n));

  const value: MealsCtx = {
    meals,
    addFood,
    removeFood,
    updateServingPct,
    totalsFor,
    entryTotals,
    burnedCalories,
    setBurnedCalories,
    addBurnedCalories,
    dayCalories,
    netCalories,
  };

  return <MealsContext.Provider value={value}>{children}</MealsContext.Provider>;
}

/* -------------- Hook -------------- */
export function useMeals() {
  const ctx = React.useContext(MealsContext);
  if (!ctx) throw new Error("useMeals must be used inside MealsProvider");
  return ctx;
}



