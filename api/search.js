// api/search.js — serverless food search (Vercel / Node.js)

const UA = "NoDaysApp/1.0 (food search; contact: nodaystest@example.com)";

// Quick picks for obvious generics
const QUICK_PICKS = [
  { name: "Banana (100 g)", calories: 89, protein: 1, carbs: 23, fat: 0 },
  { name: "Apple (100 g)", calories: 52, protein: 0, carbs: 14, fat: 0 },
  { name: "White rice, cooked (100 g)", calories: 130, protein: 2, carbs: 28, fat: 0 },
  { name: "Chicken breast, cooked, skinless (100 g)", calories: 165, protein: 31, carbs: 0, fat: 4 },
  { name: "Greek yogurt, plain nonfat (100 g)", calories: 59, protein: 10, carbs: 3, fat: 0 },
];

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  // small CDN cache so repeated queries are snappy
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
}

const norm = (s = "") => String(s).toLowerCase().trim();
const baseLabel = (n = "") => n.replace(/\(.+?\)/g, "").replace(/,/g, "").trim(); // "White rice, cooked (100 g)" -> "White rice cooked"

const dedupe = (items) => {
  const seen = new Set();
  const out = [];
  for (const f of items) {
    const key = norm(`${f.name}|${f.brand || ""}|${f.barcode || ""}`);
    if (!seen.has(key)) {
      seen.add(key);
      out.push(f);
    }
  }
  return out;
};

// ---------------- Open Food Facts ----------------
function mapOFFProduct(p) {
  const n = p?.nutriments || {};
  const kcal =
    num(n["energy-kcal_serving"]) ??
    kjToKcal(num(n["energy_serving"])) ??
    num(n["energy-kcal_100g"]) ??
    kjToKcal(num(n["energy_100g"]));

  const food = {
    name: (p.product_name_en || p.product_name || p.generic_name_en || "Food").trim(),
    brand: p.brands ? String(p.brands).split(",")[0].trim() : undefined,
    barcode: p.code || undefined,
    servingSize: p.serving_size || undefined,
    calories: safeInt(kcal),
    protein: safeInt(num(n["proteins_serving"]) ?? num(n["proteins_100g"])),
    carbs:   safeInt(num(n["carbohydrates_serving"]) ?? num(n["carbohydrates_100g"])),
    fat:     safeInt(num(n["fat_serving"]) ?? num(n["fat_100g"])),
    fiber:   safeInt(num(n["fiber_serving"]) ?? num(n["fiber_100g"])),
    sugar:   safeInt(num(n["sugars_serving"]) ?? num(n["sugars_100g"])),
    sodium:  safeInt(num(n["sodium_serving"]) ?? num(n["sodium_100g"])),
    source: "search",
  };
  if (!food.name) return null;
  if (food.calories == null) return null;
  return food;
}

async function searchOFF(q) {
  const url = new URL("https://world.openfoodfacts.org/cgi/search.pl");
  url.searchParams.set("action", "process");
  url.searchParams.set("json", "1");
  url.searchParams.set("search_simple", "1"); // plain-text search
  url.searchParams.set("page_size", "40");
  url.searchParams.set("search_terms", q);
  url.searchParams.set("lc", "en");
  url.searchParams.set("lang", "en");
  url.searchParams.set("sort_by", "popularity_key");
  url.searchParams.set(
    "fields",
    "code,product_name,product_name_en,generic_name_en,brands,serving_size,nutriments,lc,languages_tags"
  );

  try {
    const r = await fetch(url.toString(), {
      headers: { "User-Agent": UA, Accept: "application/json" },
    });
    if (!r.ok) {
      console.error("OFF fetch not ok:", r.status, r.statusText);
      return [];
    }
    const data = await r.json();
    const products = Array.isArray(data?.products) ? data.products : [];
    return products.map(mapOFFProduct).filter(Boolean).slice(0, 25);
  } catch (e) {
    console.error("OFF fetch error:", e);
    return [];
  }
}

// ---------------- USDA FDC (optional) ----------------
const FDC_KEY = process.env.FDC_API_KEY;

function mapFDCFood(f) {
  const nutrients = f.foodNutrients || [];
  const byName = (n) =>
    nutrients.find((x) => norm(x.nutrientName).includes(n)) ||
    nutrients.find((x) => String(x.nutrientId) === n);

  const kcal    = val(byName("energy"), "KCAL");
  const protein = val(byName("protein"), "G");
  const carbs   = val(byName("carbohydrate"), "G");
  const fat     = val(byName("fat"), "G");
  const sugar   = val(byName("sugar"), "G");
  const fiber   = val(byName("fiber"), "G");
  const sodium  = val(byName("sodium"), "MG");

  const serving = f.servingSize && f.servingSizeUnit ? `${f.servingSize} ${f.servingSizeUnit}` : undefined;

  const food = {
    name: (f.description || f.brandOwner || "Food").trim(),
    brand: f.brandOwner || f.brandName || undefined,
    barcode: f.gtinUpc || undefined,
    servingSize: serving,
    calories: safeInt(kcal),
    protein: safeInt(protein),
    carbs:   safeInt(carbs),
    fat:     safeInt(fat),
    fiber:   safeInt(fiber),
    sugar:   safeInt(sugar),
    sodium:  safeInt(sodium),
    source: "search",
  };
  if (!food.name) return null;
  if (food.calories == null) return null;
  return food;
}

async function searchFDC(q) {
  if (!FDC_KEY) return [];
  const url = new URL("https://api.nal.usda.gov/fdc/v1/foods/search");
  url.searchParams.set("api_key", FDC_KEY);
  url.searchParams.set("query", q);
  url.searchParams.set("pageSize", "40");
  url.searchParams.set("dataType", "Branded,Foundation,SR%20Legacy");

  try {
    const r = await fetch(url.toString(), { headers: { "User-Agent": UA } });
    if (!r.ok) {
      console.error("FDC fetch not ok:", r.status, r.statusText);
      return [];
    }
    const data = await r.json();
    const foods = Array.isArray(data?.foods) ? data.foods : [];
    return foods.map(mapFDCFood).filter(Boolean).slice(0, 40);
  } catch (e) {
    console.error("FDC fetch error:", e);
    return [];
  }
}

// ---------------- helpers ----------------
function num(x) {
  const n = typeof x === "number" ? x : parseFloat(String(x));
  return Number.isFinite(n) ? n : null;
}
function kjToKcal(kj) {
  return kj == null ? null : Math.round(kj / 4.184);
}
function safeInt(n) {
  return n == null ? null : Math.round(n);
}
function val(n /*, expectedUnit */) {
  if (!n || n.value == null) return null;
  return Number(n.value);
}

// ---------------- main handler ----------------
module.exports = async (req, res) => {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const q = String(req.query.q || "").trim();
  if (!q) return res.status(200).json({ ok: true, q, items: [] });

  try {
    const [fdc, off] = await Promise.allSettled([searchFDC(q), searchOFF(q)]);
    const fromFDC = fdc.status === "fulfilled" ? fdc.value : [];
    const fromOFF = off.status === "fulfilled" ? off.value : [];

    // Better quick-pick match (both directions)
    const qn = norm(q);
    const picks = QUICK_PICKS.filter((p) => {
      const b = norm(baseLabel(p.name));
      return (
        qn === b ||
        qn.startsWith(b) ||
        b.startsWith(qn) ||
        qn.includes(b) ||
        b.includes(qn)
      );
    }).map((p) => ({
      name: p.name,
      brand: undefined,
      barcode: undefined,
      servingSize: "100 g",
      calories: p.calories,
      protein: p.protein,
      carbs: p.carbs,
      fat: p.fat,
      fiber: null,
      sugar: null,
      sodium: null,
      source: "search",
    }));

    const merged = dedupe([...picks, ...fromFDC, ...fromOFF]).slice(0, 25);

    // 🔎 emit one concise log line we can see in `vercel logs ...`
    console.log(
      JSON.stringify({
        event: "search",
        q,
        counts: { picks: picks.length, fdc: fromFDC.length, off: fromOFF.length, merged: merged.length },
      })
    );

    return res.status(200).json({ ok: true, q, items: merged });
  } catch (e) {
    console.error("Handler error:", e);
    return res.status(200).json({ ok: false, q, error: String(e), items: [] });
  }
};



  
  
  
  
  
  
  
  
  