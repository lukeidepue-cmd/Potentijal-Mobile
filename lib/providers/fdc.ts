// lib/providers/fdc.ts
import type { Food } from "../../providers/MealsContext";

const FDC_KEY =
  process.env.EXPO_PUBLIC_FDC_API_KEY ||
  (globalThis as any).EXPO_PUBLIC_FDC_API_KEY ||
  "";

type FDCFood = {
  fdcId: number;
  description?: string;
  brandOwner?: string;
  brandName?: string;
  gtinUpc?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  householdServingFullText?: string;
  labelNutrients?: Record<string, { value: number }>;
  foodNutrients?: Array<{ nutrientId?: number; nutrientName?: string; unitName?: string; value?: number }>;
};

const N = { energy: 1008, protein: 1003, carbs: 1005, fat: 1004, sugars: 2000, fiber: 1079, sodium: 1093 };

function pickN(foods: FDCFood, nid: number, nameContains?: string) {
  const arr = foods.foodNutrients || [];
  const byId = arr.find(n => n.nutrientId === nid);
  if (byId && typeof byId.value === "number") return { value: byId.value, unit: byId.unitName };
  if (nameContains) {
    const byName = arr.find(n => n.nutrientName && n.nutrientName.toLowerCase().includes(nameContains));
    if (byName && typeof byName.value === "number") return { value: byName.value, unit: byName.unitName };
  }
  return null;
}
const kJtoKcal = (kj: number | null) => (kj == null ? null : Math.round(kj / 4.184));
const per100ToServing = (v: number | null, g: number | null) => (v == null ? null : Math.round(g ? (v * g) / 100 : v));

export function mapFDC(f: FDCFood): Food | null {
  const ln = f.labelNutrients || {};
  const grams = f.servingSize && f.servingSizeUnit?.toLowerCase() === "g" ? f.servingSize : null;

  const label = (k: string) => (ln[k]?.value != null ? Math.round(ln[k]!.value) : null);

  const nrg = pickN(f, N.energy, "energy");
  const kcal100 = nrg ? (nrg.unit?.toLowerCase() === "kj" ? kJtoKcal(nrg.value) : Math.round(nrg.value)) : null;
  const protein100 = pickN(f, N.protein, "protein")?.value ?? null;
  const carbs100 = pickN(f, N.carbs, "carbohydrate")?.value ?? null;
  const fat100 = pickN(f, N.fat, "fat")?.value ?? null;
  const sugar100 = pickN(f, N.sugars, "sugar")?.value ?? null;
  const fiber100 = pickN(f, N.fiber, "fiber")?.value ?? null;
  const sodium100 = pickN(f, N.sodium, "sodium")?.value ?? null;

  const calories = label("calories") ?? per100ToServing(kcal100, grams);
  const protein = label("protein") ?? per100ToServing(protein100, grams);
  const carbs = label("carbohydrates") ?? per100ToServing(carbs100, grams);
  const fat = label("fat") ?? per100ToServing(fat100, grams);
  const sugar = label("sugars") ?? per100ToServing(sugar100, grams);
  const fiber = label("fiber") ?? per100ToServing(fiber100, grams);
  const sodium = label("sodium") ?? (sodium100 != null && grams ? Math.round((sodium100 * grams) / 100) : sodium100);

  const name = (f.description || f.brandName || "Food").trim();
  if (!name || calories == null) return null;

  const servingText =
    f.householdServingFullText ||
    (f.servingSize && f.servingSizeUnit ? `${f.servingSize} ${f.servingSizeUnit}` : undefined);

  return {
    name,
    brand: f.brandOwner || f.brandName || undefined,
    barcode: f.gtinUpc || undefined,
    servingSize: servingText,
    calories,
    protein, carbs, fat, fiber, sugar, sodium,
    source: "search",
  };
}

export async function searchFDC(query: string, aborter?: AbortController): Promise<FDCFood[]> {
  if (!FDC_KEY) return [];
  const url = new URL("https://api.nal.usda.gov/fdc/v1/foods/search");
  url.searchParams.set("api_key", FDC_KEY);
  url.searchParams.set("query", query);
  url.searchParams.set("pageSize", "60");
  url.searchParams.set("dataType", "Branded,Foundation,SR Legacy");
  const res = await fetch(url.toString(), { signal: aborter?.signal });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data?.foods) ? data.foods : [];
}
