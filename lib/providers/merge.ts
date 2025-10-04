// lib/providers/merge.ts
import type { Food } from "../../providers/MealsContext";
import { TEXT, detectBrandAndItem } from "../search/brands";
import {
  searchOFFText,
  searchOFFBrandFiltered,
  searchOFFBrandFacet,
  mapOFF,
  type OFFProduct,
} from "./openfoodfacts";
import { searchFDC, mapFDC } from "./fdc";
import { searchSpoonacular } from "./spoonacular";

const simplify = TEXT.simplify;
const baseLabel = TEXT.baseLabel;

/* ---------------- Query expansion ---------------- */
function expandVariants(s: string): string[] {
  const base = simplify(s);
  const variants = new Set<string>([base]);
  const swaps: Array<[RegExp, string]> = [
    [/\b&\b/g, "and"],
    [/\band\b/g, ""], // jersey mikes turkey and swiss -> jersey mikes turkey swiss
    [/\bsandwich\b/g, ""],
    [/\bsubs?\b/g, "sub"],
    [/\bpb\b/g, "peanut butter"],
    [/\byoghurt\b/g, "yogurt"],
  ];
  for (const [re, rep] of swaps) {
    variants.add(base.replace(re, rep).replace(/\s+/g, " ").trim());
  }
  return [...variants].filter(Boolean);
}

function ngrams(item: string): string[] {
  const t = simplify(item).split(/\s+/).filter(Boolean);
  const out: string[] = [];
  for (let n = Math.min(4, t.length); n >= 2; n--) {
    for (let i = 0; i + n <= t.length; i++) out.push(t.slice(i, i + n).join(" "));
  }
  return out;
}

export function buildFallbackQueries(q: string): { tries: string[]; brand: string; item: string } {
  const { brand, item } = detectBrandAndItem(q);
  const set = new Set<string>();
  expandVariants(q).forEach((v: string) => set.add(v));
  if (item) expandVariants(item).forEach((v: string) => set.add(v));

  const tries: string[] = [];
  tries.push(...set);
  if (brand && item) for (const v of set) tries.push(`${brand} ${v}`);
  if (brand) tries.push(brand);
  if (item) tries.push(...ngrams(item), item);

  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of tries) {
    const k = simplify(s);
    if (k && !seen.has(k)) {
      seen.add(k);
      out.push(s);
    }
  }
  return { tries: out.slice(0, 12), brand, item };
}

/* ---------------- Clustering / de-dup ---------------- */
type WithScore = Food & { __score: number };

function scoreForTieBreak(f: Food): number {
  const hasServing = f.servingSize ? 1 : 0;
  const macros =
    (Number.isFinite(f.protein as number | null | undefined) ? 1 : 0) +
    (Number.isFinite(f.carbs as number | null | undefined) ? 1 : 0) +
    (Number.isFinite(f.fat as number | null | undefined) ? 1 : 0);
  const calOK = f.calories != null ? 1 : 0;
  const brandBonus = f.brand ? 1 : 0;
  const barcodeBonus = f.barcode ? 2 : 0;
  return hasServing * 4 + calOK * 3 + macros * 2 + brandBonus + barcodeBonus;
}

export function dedupeAndCluster(items: Food[], perGroupCap = 2): Food[] {
  const byBarcode = new Map<string, Food>();
  const sansBarcode: Food[] = [];

  for (const f of items) {
    const code = f.barcode && simplify(f.barcode);
    if (code) {
      if (!byBarcode.has(code)) {
        byBarcode.set(code, f);
      } else if (scoreForTieBreak(f) > scoreForTieBreak(byBarcode.get(code)!)) {
        byBarcode.set(code, f);
      }
    } else {
      sansBarcode.push(f);
    }
  }

  const groups = new Map<string, WithScore[]>();
  const seed: Food[] = [...byBarcode.values(), ...sansBarcode];

  for (const f of seed) {
    const key = `${simplify(f.brand || "")}:${simplify(baseLabel(f.name))}`;
    const scored: WithScore = Object.assign({}, f, { __score: scoreForTieBreak(f) });
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(scored);
  }

  const out: Food[] = [];
  for (const arr of groups.values()) {
    arr.sort((a: WithScore, b: WithScore) => b.__score - a.__score);
    for (let i = 0; i < Math.min(perGroupCap, arr.length); i++) {
      const { __score, ...rest } = arr[i] as WithScore & { __score: number };
      out.push(rest as Food);
    }
  }
  return out;
}

/* ---------------- Ranking for OFF ---------------- */
function scoreProduct(q: string, p: OFFProduct): number {
  const name = p.product_name || "";
  const gname = p.generic_name_en || "";
  const brands = p.brands || "";
  let score = 0;
  const qn = simplify(q);
  if (simplify(name).startsWith(qn)) score += 60;
  else if (simplify(name).includes(qn)) score += 35;
  if (simplify(gname).includes(qn)) score += 20;
  if (simplify(brands).includes(qn)) score += 12;
  if (p.serving_size) score += 4;
  const n = p.nutriments || {};
  const hasAny =
    n["energy-kcal_serving"] != null ||
    n["energy_serving"] != null ||
    n["energy-kcal_100g"] != null ||
    n["energy_100g"] != null;
  if (!hasAny) score -= 30;
  return score;
}

/* ---------------- Orchestrator ---------------- */
export async function searchAllProviders(query: string, aborter: AbortController): Promise<Food[]> {
  const { tries, brand, item } = buildFallbackQueries(query);
  const wantBrand = !!brand;

  const results: Food[] = [];
  const keyset = new Set<string>();

  const take = (arr: Food[], strictBrand: boolean): void => {
    for (const f of arr) {
      const isBrand = brand ? (f.brand && simplify(f.brand).includes(simplify(brand))) : false;
      if (strictBrand && wantBrand && !isBrand) continue;

      const k = `${simplify(f.barcode || "")}|${simplify(f.brand || "")}:${simplify(baseLabel(f.name))}`;
      if (!keyset.has(k)) {
        keyset.add(k);
        results.push(f);
      }
      if (results.length >= 25) break;
    }
  };

  // Phase 1: brand-first pathways
  if (wantBrand) {
    try {
      const facet: OFFProduct[] = await searchOFFBrandFacet(brand, aborter);
      const off1Pairs: Array<{ p: OFFProduct; s: number }> = facet.map((prod: OFFProduct) => ({
        p: prod,
        s: scoreProduct(`${brand} ${item || ""}`, prod),
      }));
      const off1Foods: Food[] = off1Pairs
        .sort((a: { p: OFFProduct; s: number }, b: { p: OFFProduct; s: number }) => b.s - a.s)
        .map(({ p }) => mapOFF(p))
        .filter((f: Food | null): f is Food => !!f);
      take(dedupeAndCluster(off1Foods, 2), true);
    } catch {/* ignore */}

    if (results.length < 25) {
      try {
        const off2Raw: OFFProduct[] = await searchOFFBrandFiltered(brand, item || query, aborter);
        const off2Pairs: Array<{ p: OFFProduct; s: number }> = off2Raw.map((prod: OFFProduct) => ({
          p: prod,
          s: scoreProduct(`${brand} ${item || ""}`, prod),
        }));
        const off2Foods: Food[] = off2Pairs
          .sort((a: { p: OFFProduct; s: number }, b: { p: OFFProduct; s: number }) => b.s - a.s)
          .map(({ p }) => mapOFF(p))
          .filter((f: Food | null): f is Food => !!f);
        take(dedupeAndCluster(off2Foods, 2), true);
      } catch {/* ignore */}
    }

    if (results.length < 25) {
      try {
        const spoonFoods: Food[] = await searchSpoonacular(query, aborter);
        take(dedupeAndCluster(spoonFoods, 2), true);
      } catch {/* ignore */}
    }
  }

  // Phase 2: iterate variants across providers
  for (const t of tries) {
    if (results.length >= 25) break;

    const [offRaw, fdcRaw, spoonRaw] = await Promise.all([
      searchOFFText(t, aborter).catch(() => [] as OFFProduct[]),
      searchFDC(t, aborter).catch(() => [] as any[]),
      searchSpoonacular(t, aborter).catch(() => [] as Food[]),
    ]);

    const offPairs: Array<{ p: OFFProduct; s: number }> = offRaw.map((prod: OFFProduct) => ({
      p: prod,
      s: scoreProduct(t, prod),
    }));
    const offFoods: Food[] = offPairs
      .sort((a: { p: OFFProduct; s: number }, b: { p: OFFProduct; s: number }) => b.s - a.s)
      .map(({ p }) => mapOFF(p))
      .filter((f: Food | null): f is Food => !!f);

    const fdcFoods: Food[] = fdcRaw.map((x: any) => mapFDC(x)).filter((f: Food | null): f is Food => !!f);
    const spoonFoods: Food[] = spoonRaw;

    take(dedupeAndCluster([...spoonFoods, ...offFoods, ...fdcFoods], 2), false);
  }

  return results.slice(0, 25);
}

