// lib/providers/openfoodfacts.ts
import type { Food } from "../../providers/MealsContext";
import { TEXT } from "../search/brands";

export type OFFProduct = {
  code?: string;
  product_name?: string;
  product_name_en?: string;
  generic_name_en?: string;
  brands?: string;
  brands_tags?: string[];
  lc?: string;
  countries_tags_en?: string[];
  categories_tags_en?: string[];
  serving_size?: string;
  nutriments?: Record<string, any>;
};

const simplify = TEXT.simplify;

function firstNumber(...vals: Array<unknown>): number | null {
  for (const v of vals) {
    if (v == null) continue;
    const n = typeof v === "number" ? v : parseFloat(String(v));
    if (Number.isFinite(n)) return n;
  }
  return null;
}
const kJtoKcal = (kj: number | null) => (kj == null ? null : Math.round(kj / 4.184));
const gramsFromServing = (s?: string | null) => {
  if (!s) return null;
  const m = s.match(/(\d+(?:\.\d+)?)\s*g\b/i);
  return m ? Math.round(parseFloat(m[1])) : null;
};

export function mapOFF(p: OFFProduct): Food | null {
  const n = p?.nutriments || {};
  const serving = p.serving_size || undefined;

  const kcalServing = firstNumber(n["energy-kcal_serving"], n["energy_kcal_serving"]);
  const kjServing = firstNumber(n["energy_serving"]);
  const kcal100 = firstNumber(n["energy-kcal_100g"], n["energy_kcal_100g"]);
  const kj100 = firstNumber(n["energy_100g"]);

  const perServing =
    kcalServing ?? (kjServing != null ? kJtoKcal(kjServing) : null);
  const per100 = kcal100 ?? (kj100 != null ? kJtoKcal(kj100) : null);

  let calories: number | null = null;
  if (perServing != null) calories = Math.round(perServing);
  else if (per100 != null) {
    const g = gramsFromServing(serving);
    calories = Math.round(g ? (per100 * g) / 100 : per100);
  }

  const macro = (key: string) => {
    const s = firstNumber(n[`${key}_serving`]);
    const p100 = firstNumber(n[`${key}_100g`]);
    if (s != null) return Math.round(s);
    if (p100 != null) {
      const g = gramsFromServing(serving);
      return Math.round(g ? (p100 * g) / 100 : p100);
    }
    return null;
  };

  const name = (p.product_name_en || p.product_name || p.generic_name_en || "Food").trim();
  if (!name || calories == null) return null;

  return {
    name,
    brand: p.brands ? String(p.brands).split(",")[0].trim() : undefined,
    barcode: p.code || undefined,
    servingSize: serving,
    calories,
    protein: macro("proteins"),
    carbs: macro("carbohydrates"),
    fat: macro("fat"),
    fiber: null,
    sugar: null,
    sodium: null,
    source: "search",
  };
}

export async function searchOFFText(q: string, aborter?: AbortController): Promise<OFFProduct[]> {
  const url = new URL("https://world.openfoodfacts.org/cgi/search.pl");
  url.searchParams.set("action", "process");
  url.searchParams.set("json", "1");
  url.searchParams.set("search_simple", "1");
  url.searchParams.set("page_size", "80");
  url.searchParams.set("search_terms", q);
  url.searchParams.set("lc", "en");
  url.searchParams.set("lang", "en");
  url.searchParams.set("countries_tags_en", "united-states");
  url.searchParams.set("sort_by", "popularity_key");
  url.searchParams.set(
    "fields",
    "code,product_name,product_name_en,generic_name_en,brands,brands_tags,serving_size,lc,countries_tags_en,categories_tags_en,nutriments"
  );
  const res = await fetch(url.toString(), { signal: aborter?.signal });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data?.products) ? data.products : [];
}

export async function searchOFFBrandFacet(brand: string, aborter?: AbortController): Promise<OFFProduct[]> {
  const base = simplify(brand).replace(/\s+/g, "-");
  const candidates = new Set<string>([
    base,
    base.replace(/-cafe\b/, ""),
    base.replace(/-café\b/, ""),
    base.replace(/é/g, "e"),
  ]);
  const out: OFFProduct[] = [];
  for (const slug of candidates) {
    const u = new URL(`https://world.openfoodfacts.org/brand/${encodeURIComponent(slug)}.json`);
    u.searchParams.set("page_size", "80");
    u.searchParams.set(
      "fields",
      "code,product_name,product_name_en,generic_name_en,brands,brands_tags,serving_size,lc,countries_tags_en,categories_tags_en,nutriments"
    );
    const r = await fetch(u.toString(), { signal: aborter?.signal });
    if (!r.ok) continue;
    const json = await r.json();
    if (Array.isArray(json?.products)) out.push(...json.products);
  }
  return out;
}

export async function searchOFFBrandFiltered(brand: string, itemQuery: string, aborter?: AbortController) {
  const url = new URL("https://world.openfoodfacts.org/cgi/search.pl");
  url.searchParams.set("action", "process");
  url.searchParams.set("json", "1");
  url.searchParams.set("search_simple", "1");
  url.searchParams.set("page_size", "80");
  url.searchParams.set("search_terms", itemQuery);
  url.searchParams.set("lc", "en");
  url.searchParams.set("lang", "en");
  url.searchParams.set("countries_tags_en", "united-states");
  url.searchParams.set("sort_by", "popularity_key");
  url.searchParams.set("tagtype_0", "brands");
  url.searchParams.set("tag_contains_0", "contains");
  url.searchParams.set("tag_0", brand);
  url.searchParams.set(
    "fields",
    "code,product_name,product_name_en,generic_name_en,brands,brands_tags,serving_size,lc,countries_tags_en,categories_tags_en,nutriments"
  );
  const res = await fetch(url.toString(), { signal: aborter?.signal });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data?.products) ? data.products : [];
}
