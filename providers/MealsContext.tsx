import React, { createContext, useContext, useMemo, useState } from "react";
import { nanoid } from "nanoid/non-secure";

export type MealType = "Breakfast" | "Lunch" | "Dinner" | "Snacks";
export const MEAL_TYPES: MealType[] = ["Breakfast", "Lunch", "Dinner", "Snacks"];

export type Food = {
  id?: string;             // optional on input; we create entryId below
  name: string;
  brand?: string;
  barcode?: string;
  servingSize?: string;
  calories: number | null;
  protein?: number | null;
  carbs?: number | null;
  fat?: number | null;
  fiber?: number | null;
  sugar?: number | null;
  sodium?: number | null;
  source?: "barcode" | "manual" | "search";
};

export type FoodEntry = Food & {
  entryId: string;
  servingPct: number; // 0..500 (percentage)
  createdAt?: string;
};

type MealsState = Record<MealType, FoodEntry[]>;

export type MealsCtx = {
  meals: MealsState;
  addFood: (meal: MealType, food: Food) => string; // returns entryId
  removeFood: (meal: MealType, entryId: string) => void;
  updateServingPct: (meal: MealType, entryId: string, pct: number) => void;
  totalsFor: (meal: MealType) => { calories: number; protein: number; carbs: number; fat: number };
  entryTotals: (e: FoodEntry) => { calories: number; protein: number; carbs: number; fat: number };

  // Burned calories
  burnedCalories: number;
  setBurnedCalories: (n: number) => void;
  addBurnedCalories: (n: number) => void;

  // Day totals
  dayCalories: number;   // sum of all meals (kcal)
  netCalories: number;   // dayCalories - burnedCalories
};

const MealsContext = createContext<MealsCtx | null>(null);

export function MealsProvider({ children }: { children: React.ReactNode }) {
  const [meals, setMeals] = useState<MealsState>({
    Breakfast: [],
    Lunch: [],
    Dinner: [],
    Snacks: [],
  });

  const [burnedCalories, setBurnedCalories] = useState<number>(0);

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
      [meal]: prev[meal].map((e) => (e.entryId === entryId ? { ...e, servingPct: pct } : e)),
    }));
  };

  const scale = (v: number | null | undefined, pct: number) =>
    v == null ? 0 : Math.round((v * pct) / 100);

  const entryTotals: MealsCtx["entryTotals"] = (e) => ({
    calories: scale(e.calories, e.servingPct),
    protein: scale(e.protein ?? 0, e.servingPct),
    carbs: scale(e.carbs ?? 0, e.servingPct),
    fat: scale(e.fat ?? 0, e.servingPct),
  });

  const totalsFor: MealsCtx["totalsFor"] = (meal) => {
    const arr = meals[meal];
    return arr.reduce(
      (acc, e) => {
        const t = entryTotals(e);
        acc.calories += t.calories;
        acc.protein += t.protein;
        acc.carbs += t.carbs;
        acc.fat += t.fat;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  const dayCalories = useMemo(
    () => MEAL_TYPES.reduce((sum, m) => sum + totalsFor(m).calories, 0),
    [meals]
  );

  const netCalories = useMemo(() => Math.max(0, dayCalories - burnedCalories), [dayCalories, burnedCalories]);

  const addBurnedCalories = (n: number) => setBurnedCalories((v) => Math.max(0, v + n));

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

export function useMeals() {
  const ctx = React.useContext(MealsContext);
  if (!ctx) throw new Error("useMeals must be used inside MealsProvider");
  return ctx;
}


