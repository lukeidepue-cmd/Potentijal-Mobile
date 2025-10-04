// lib/providers/spoonacular.ts
// Spoonacular-backed provider that keeps the same exported name `searchSpoonacular`
// so the rest of your app stays untouched.

import type { Food } from "../../providers/MealsContext";

/* ---------------- ENV ---------------- */
const SPOON_KEY =
  process.env.EXPO_PUBLIC_SPOONACULAR_KEY ||
  (globalThis as any).EXPO_PUBLIC_SPOONACULAR_KEY ||
  "";

/* ---------------- Types (minimal) ---------------- */
type NixNutrient = { name?: string; amount?: number; unit?: string };
type MenuItemSearchHit = { id: number; title: string; restaurantChain?: string | null };
type MenuItemDetail = {
  id: number;
  title?: string;
  restaurantChain?: string | null;
  servings?: { number?: number; size?: number; unit?: string } | null;
  nutrition?: { nutrients?: NixNutrient[] } | null;
};
type ProductSearchHit = { id: number; title: string; brand?: string | null };
type ProductDetail = {
  id: number;
  title?: string;
  brand?: string | null;
  servings?: { number?: number; size?: number; unit?: string } | null;
  nutrition?: { nutrients?: NixNutrient[] } | null;
};

/* ---------------- Helpers ---------------- */
const norm = (s?: string | null) => (s || "").toLowerCase().trim();

function roundOrNull(n: unknown): number | null {
  const x = typeof n === "number" ? n : Number(n);
  return Number.isFinite(x) ? Math.round(x) : null;
}

function servingTextFrom(servings?: { number?: number; size?: number; unit?: string } | null) {
  if (!servings) return undefined;
  const count = servings.number && servings.number !== 1 ? `${servings.number}× ` : "";
  if (servings.size && servings.unit) return `${count}${servings.size} ${servings.unit}`;
  if (servings.size) return `${count}${servings.size}`;
  return count ? `${count}serving` : undefined;
}

function pickAmount(
  nutrients: NixNutrient[] | undefined,
  names: string[],
  preferredUnit?: string
): number | null {
  if (!nutrients || nutrients.length === 0) return null;
  const hay = nutrients;
  // exact-name pass
  for (const nm of names) {
    const hit = hay.find((n) => norm(n.name) === norm(nm));
    if (hit && Number.isFinite(hit.amount)) {
      if (!preferredUnit || !hit.unit || norm(hit.unit) === norm(preferredUnit)) return roundOrNull(hit.amount);
    }
  }
  // includes-name pass
  for (const nm of names) {
    const hit = hay.find((n) => norm(n.name).includes(norm(nm)));
    if (hit && Number.isFinite(hit.amount)) {
      if (!preferredUnit || !hit.unit || norm(hit.unit) === norm(preferredUnit)) return roundOrNull(hit.amount);
    }
  }
  return null;
}

function mapDetailToFood(
  title: string | undefined,
  brand: string | undefined | null,
  servings: MenuItemDetail["servings"] | ProductDetail["servings"],
  nutrients: NixNutrient[] | undefined
): Food | null {
  const name = (title || "").trim();
  if (!name) return null;

  const calories =
    pickAmount(nutrients, ["Calories", "Energy", "Calories, kcal", "Energy (kcal)"], "kcal") ??
    pickAmount(nutrients, ["Calories", "Energy"]);

  const protein = pickAmount(nutrients, ["Protein"], "g");
  const carbs = pickAmount(nutrients, ["Carbohydrates", "Carbs"], "g");
  const fat = pickAmount(nutrients, ["Fat", "Total Fat"], "g");
  const fiber = pickAmount(nutrients, ["Fiber", "Dietary Fiber"], "g");
  const sugar = pickAmount(nutrients, ["Sugar", "Sugars"], "g");
  const sodium = pickAmount(nutrients, ["Sodium"], "mg");

  if (calories == null && protein == null && carbs == null && fat == null) return null;

  return {
    name,
    brand: brand || undefined,
    barcode: undefined,
    servingSize: servingTextFrom(servings),
    calories: roundOrNull(calories),
    protein: roundOrNull(protein),
    carbs: roundOrNull(carbs),
    fat: roundOrNull(fat),
    fiber: roundOrNull(fiber),
    sugar: roundOrNull(sugar),
    sodium: roundOrNull(sodium),
    source: "search",
  };
}

/* ---------------- HTTP helpers ---------------- */
async function getJSON<T>(url: string, aborter?: AbortController): Promise<T | null> {
  try {
    const u = new URL(url);
    u.searchParams.set("apiKey", SPOON_KEY);
    const r = await fetch(u.toString(), { signal: aborter?.signal });
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

/* ---------------- Spoonacular endpoints ---------------- */
async function searchMenuItems(query: string, aborter?: AbortController): Promise<MenuItemSearchHit[]> {
  const u = `https://api.spoonacular.com/food/menuItems/search?query=${encodeURIComponent(query)}&number=30`;
  const j = await getJSON<{ menuItems?: MenuItemSearchHit[] }>(u, aborter);
  return j?.menuItems ?? [];
}

async function getMenuItem(id: number, aborter?: AbortController): Promise<MenuItemDetail | null> {
  const u = `https://api.spoonacular.com/food/menuItems/${id}`;
  return await getJSON<MenuItemDetail>(u, aborter);
}

async function searchProducts(query: string, aborter?: AbortController): Promise<ProductSearchHit[]> {
  const u = `https://api.spoonacular.com/food/products/search?query=${encodeURIComponent(query)}&number=30`;
  const j = await getJSON<{ products?: ProductSearchHit[] }>(u, aborter);
  return j?.products ?? [];
}

async function getProduct(id: number, aborter?: AbortController): Promise<ProductDetail | null> {
  const u = `https://api.spoonacular.com/food/products/${id}`;
  return await getJSON<ProductDetail>(u, aborter);
}

/* ---------------- Main search ---------------- */
export async function searchSpoonacular(query: string, aborter?: AbortController): Promise<Food[]> {
  const q = query.trim();
  if (!q) return [];
  if (!SPOON_KEY) {
    console.warn("[Spoonacular] Missing EXPO_PUBLIC_SPOONACULAR_KEY");
    return [];
  }

  // 1) Search restaurants and grocery in parallel
  const [menuHits, productHits] = await Promise.all([
    searchMenuItems(q, aborter),
    searchProducts(q, aborter),
  ]);

  // 2) Hydrate top N results from each (detail endpoints have nutrition)
  const takeMenu = menuHits.slice(0, 15);
  const takeProd = productHits.slice(0, 15);

  const menuDetails = await Promise.allSettled(takeMenu.map((h) => getMenuItem(h.id, aborter)));
  const prodDetails = await Promise.allSettled(takeProd.map((h) => getProduct(h.id, aborter)));

  const foods: Food[] = [];

  for (const r of menuDetails) {
    if (r.status !== "fulfilled" || !r.value) continue;
    const d = r.value;
    const f = mapDetailToFood(d.title, d.restaurantChain ?? undefined, d.servings ?? null, d.nutrition?.nutrients);
    if (f) foods.push(f);
  }
  for (const r of prodDetails) {
    if (r.status !== "fulfilled" || !r.value) continue;
    const d = r.value;
    const f = mapDetailToFood(d.title, d.brand ?? undefined, d.servings ?? null, d.nutrition?.nutrients);
    if (f) foods.push(f);
  }

  // 3) De-dupe by brand|name, keep top 25
  const out: Food[] = [];
  const seen = new Set<string>();
  for (const f of foods) {
    const key = `${norm(f.brand)}|${norm(f.name)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(f);
    if (out.length >= 25) break;
  }

  return out;
}





