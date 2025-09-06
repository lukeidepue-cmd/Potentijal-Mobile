// lib/nutrition.ts

//
// Unified food type used in the app
//
export type Food = {
    id: string;
    name: string;
    calories: number; // currently per 100g for OFF & quick picks; we can normalize later per provider
    protein: number;
    carbs: number;
    fat: number;
  };
  
  export type NutritionProvider = {
    id: string;
    label: string;
    search: (query: string) => Promise<Food[]>;
  };
  
  //
  // ----------------- Helpers (ranking & quick picks) -----------------
  const normalize = (s: string) => s.toLowerCase().trim();
  
  function startsWithWord(hay: string, needle: string) {
    const h = normalize(hay);
    const n = normalize(needle);
    return h.startsWith(n);
  }
  function includesWord(hay: string, needle: string) {
    const h = normalize(hay);
    const n = normalize(needle);
    return h.includes(n);
  }
  
  const NEGATIVE_KEYWORDS: Record<string, string[]> = {
    chicken: ["ramen", "noodle", "flavor", "broth", "soup", "seasoning"],
    apple: ["pouch", "baby", "purée", "puree", "formula", "applesauce"],
    rice: ["noodle", "ramen", "cup noodles"],
    beef: ["ramen", "noodle", "flavor"],
  };
  
  const CATEGORY_HINTS: Record<string, string[]> = {
    chicken: ["meats", "poultries", "chicken"],
    apple: ["fruits", "apples"],
    banana: ["fruits", "bananas"],
    beef: ["meats", "beef"],
    salmon: ["fish", "seafood", "salmon"],
    rice: ["cereals and potatoes", "cereal", "rice"],
    egg: ["eggs", "dairy and eggs substitutes", "eggs and derivatives"],
    yogurt: ["dairies", "yogurts"],
  };
  
  type OFFProduct = {
    code?: string;
    id?: string;
    product_name?: string;
    generic_name_en?: string;
    brands?: string;
    lc?: string;
    countries_tags_en?: string[]; // e.g. ["united-states"]
    categories_tags_en?: string[]; // e.g. ["meats","poultries","chicken"]
    nutriments?: Record<string, any>;
  };
  
  // Simple canonical “quick picks” for generic whole foods (per 100g)
  // Source values are typical averages; we can swap to USDA later.
  const GENERIC_QUICK_PICKS: Record<string, Food> = {
    apple: { id: "generic-apple-100g", name: "Apple (raw, 100g)", calories: 52, protein: 0, carbs: 14, fat: 0 },
    banana: { id: "generic-banana-100g", name: "Banana (raw, 100g)", calories: 89, protein: 1, carbs: 23, fat: 0 },
    "chicken breast": { id: "generic-chicken-breast-100g", name: "Chicken breast, cooked, skinless (100g)", calories: 165, protein: 31, carbs: 0, fat: 4 },
    rice: { id: "generic-rice-cooked-100g", name: "White rice, cooked (100g)", calories: 130, protein: 2, carbs: 28, fat: 0 },
    egg: { id: "generic-egg-100g", name: "Egg (whole), cooked (100g)", calories: 155, protein: 13, carbs: 1, fat: 11 },
    salmon: { id: "generic-salmon-100g", name: "Salmon, cooked (100g)", calories: 208, protein: 20, carbs: 0, fat: 13 },
    yogurt: { id: "generic-yogurt-100g", name: "Yogurt, plain nonfat (100g)", calories: 59, protein: 10, carbs: 3, fat: 0 },
  };
  
  function quickPicksFor(query: string): Food[] {
    const q = normalize(query);
    const candidates: Food[] = [];
    // exact keys
    for (const key of Object.keys(GENERIC_QUICK_PICKS)) {
      if (q === key || q.startsWith(key)) candidates.push(GENERIC_QUICK_PICKS[key]);
    }
    // looser single-word matches (e.g., "apple", "chicken")
    if (q in GENERIC_QUICK_PICKS) return candidates;
    const words = Object.keys(GENERIC_QUICK_PICKS);
    for (const w of words) {
      if (q.includes(w) && !candidates.find((c) => c.id === GENERIC_QUICK_PICKS[w].id)) {
        candidates.push(GENERIC_QUICK_PICKS[w]);
      }
    }
    return candidates.slice(0, 2);
  }
  
  function scoreOFFProduct(query: string, p: OFFProduct) {
    const q = normalize(query);
    const name = p.product_name || "";
    const gname = p.generic_name_en || "";
    const brands = p.brands || "";
    const cats = p.categories_tags_en || [];
    const country = p.countries_tags_en || [];
    const lang = p.lc || "";
  
    let score = 0;
  
    // Strong name relevance
    if (startsWithWord(name, q)) score += 60;
    else if (includesWord(name, q)) score += 35;
  
    if (includesWord(gname, q)) score += 25;
    if (includesWord(brands, q)) score += 5;
  
    // Category hints boost
    const hints = CATEGORY_HINTS[q];
    if (hints) {
      for (const c of cats) {
        if (hints.some((h) => includesWord(c, h))) score += 15;
      }
    }
  
    // English/US bias
    if (lang === "en") score += 10;
    if (country.includes("united-states")) score += 10;
  
    // De-boost likely irrelevant matches (ramen/flavor/baby pouches)
    const neg = NEGATIVE_KEYWORDS[q] || [];
    const hay = `${name} ${gname} ${brands}`.toLowerCase();
    if (neg.some((kw) => hay.includes(kw))) score -= 40;
  
    // Prefer entries with nutriments present
    const n = p.nutriments || {};
    const hasAny =
      n["energy-kcal_100g"] !== undefined ||
      n["proteins_100g"] !== undefined ||
      n["carbohydrates_100g"] !== undefined ||
      n["fat_100g"] !== undefined;
    if (!hasAny) score -= 30;
  
    return score;
  }
  
  function mapOFFToFood(p: OFFProduct): Food | null {
    const n = p?.nutriments || {};
    const kcal =
      n["energy-kcal_100g"] ??
      n["energy-kcal_value"] ??
      (typeof n["energy-kcal"] === "number" ? n["energy-kcal"] : undefined);
  
    const protein = n["proteins_100g"];
    const carbs = n["carbohydrates_100g"];
    const fat = n["fat_100g"];
  
    const f: Food = {
      id: String(p.code ?? p.id ?? Math.random()),
      name: String(p.product_name || p.generic_name_en || "Unnamed product"),
      calories: Number.isFinite(kcal) ? Math.round(kcal) : 0,
      protein: Number.isFinite(protein) ? Math.round(protein) : 0,
      carbs: Number.isFinite(carbs) ? Math.round(carbs) : 0,
      fat: Number.isFinite(fat) ? Math.round(fat) : 0,
    };
  
    if (!f.name) return null;
    if (!(f.calories || f.protein || f.carbs || f.fat)) return null;
    return f;
  }
  
  function dedupeFoods(items: Food[]): Food[] {
    const seen = new Set<string>();
    const out: Food[] = [];
    for (const f of items) {
      const key = normalize(f.name);
      if (!seen.has(key)) {
        seen.add(key);
        out.push(f);
      }
    }
    return out;
  }
  
  //
  // ----------------- Provider: Open Food Facts (smart search) -----------------
  // We use the classic endpoint with search_terms, and pull extra fields for ranking.
  async function searchFoodsOFF(query: string): Promise<Food[]> {
    const q = query.trim();
    if (q.length < 2) return [];
  
    const url = new URL("https://world.openfoodfacts.org/cgi/search.pl");
    url.searchParams.set("action", "process");
    url.searchParams.set("json", "1");
    url.searchParams.set("page_size", "40"); // more candidates to rank
    url.searchParams.set("search_terms", q);
  
    // Bias toward English/US
    url.searchParams.set("lc", "en");
    url.searchParams.set("countries_tags_en", "united-states");
  
    // Pull extra fields to help ranking
    url.searchParams.set(
      "fields",
      "code,product_name,generic_name_en,brands,lc,countries_tags_en,categories_tags_en,nutriments"
    );
    url.searchParams.set("sort_by", "popularity_key");
  
    const res = await fetch(url.toString());
    if (!res.ok) return [];
  
    const data = await res.json();
    const products: OFFProduct[] = data?.products ?? [];
  
    // Score & sort products
    const ranked = products
      .map((p) => ({ p, score: scoreOFFProduct(q, p) }))
      .sort((a, b) => b.score - a.score)
      .map(({ p }) => mapOFFToFood(p))
      .filter((f): f is Food => !!f);
  
    // Prepend quick picks for obvious generic queries
    const picks = quickPicksFor(q);
  
    // Merge, de-duplicate by name, and cap result length
    return dedupeFoods([...picks, ...ranked]).slice(0, 25);
  }
  
  const offProvider: NutritionProvider = {
    id: "off",
    label: "Open Food Facts",
    search: searchFoodsOFF,
  };
  
  //
  // ----------------- Stubs: Future providers -----------------
  async function searchFoodsFDC(_query: string): Promise<Food[]> {
    // TODO: Implement with USDA FDC (requires API key), then map to Food[]
    return [];
  }
  const fdcProvider: NutritionProvider = {
    id: "fdc",
    label: "USDA FoodData Central",
    search: searchFoodsFDC,
  };
  
  async function searchFoodsNutritionix(_query: string): Promise<Food[]> {
    // TODO: Implement with Nutritionix Instant/Item endpoints, then map to Food[]
    return [];
  }
  const nutritionixProvider: NutritionProvider = {
    id: "nutritionix",
    label: "Nutritionix",
    search: searchFoodsNutritionix,
  };
  
  //
  // ----------------- Provider registry & public API -----------------
  const PROVIDERS: Record<string, NutritionProvider> = {
    off: offProvider,
    fdc: fdcProvider,
    nutritionix: nutritionixProvider,
  };
  
  export type ProviderId = keyof typeof PROVIDERS;
  
  export async function searchFoods(query: string, provider: ProviderId = "off") {
    const p = PROVIDERS[provider] ?? offProvider;
    return p.search(query);
  }
  
  export function listProviders() {
    return Object.values(PROVIDERS).map(({ id, label }) => ({ id, label }));
  }
  
  
  