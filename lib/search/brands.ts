// lib/search/brands.ts
export const TEXT = {
    simplify: (s = "") =>
      s
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s&'-]+/gu, " ")
        .replace(/\s+/g, " ")
        .trim(),
    baseLabel: (name: string) =>
      name
        .replace(/\(.+?\)/g, " ")
        .replace(/\b\d+(?:\.\d+)?\s*(?:g|mg|kg|oz|lb|ml|l)\b/gi, " ")
        .replace(/\s+/g, " ")
        .trim(),
  };
  
  export const BRAND_ALIASES: Record<string, string> = {
    // Subs
    "jersey mikes": "jersey mikes",
    "jersey mike": "jersey mikes",
    "jersey mike s": "jersey mikes",
    "jersey mike's": "jersey mikes",
    "jersey mike’s": "jersey mikes",
    subway: "subway",
    "jimmy johns": "jimmy johns",
    "firehouse subs": "firehouse subs",
    potbelly: "potbelly",
  
    // Bowls / fast-casual
    chipotle: "chipotle",
    qdoba: "qdoba",
    moes: "moes",
    "moe's": "moes",
    "moes southwest grill": "moes",
    "panda express": "panda express",
    "noodles and company": "noodles and company",
    "noodles & company": "noodles and company",
    sweetgreen: "sweetgreen",
    cava: "cava",
  
    // Burgers / chicken / pizza
    mcdonalds: "mcdonalds",
    wendys: "wendys",
    "burger king": "burger king",
    "five guys": "five guys",
    "shake shack": "shake shack",
    "chick fil a": "chick fil a",
    "taco bell": "taco bell",
    kfc: "kfc",
    popeyes: "popeyes",
    zaxbys: "zaxbys",
    "raising canes": "raising canes",
    "in n out": "in n out",
    whataburger: "whataburger",
    dominos: "dominos",
    "papa johns": "papa johns",
    "little caesars": "little caesars",
    "pizza hut": "pizza hut",
    "blaze pizza": "blaze pizza",
    culvers: "culvers",
    wingstop: "wingstop",
    "buffalo wild wings": "buffalo wild wings",
    "jack in the box": "jack in the box",
    sonic: "sonic",
  
    // Coffee / cafes / smoothies
    starbucks: "starbucks",
    dunkin: "dunkin",
    peets: "peets",
    "peet's": "peets",
    "caribou coffee": "caribou coffee",
    "einstein bros": "einstein bros",
    "tim hortons": "tim hortons",
  
    // Tropical Smoothie Cafe variants
    "tropical smoothie cafe": "tropical smoothie cafe",
    "tropical smoothie": "tropical smoothie cafe",
    "tropical smoothie café": "tropical smoothie cafe",
    "smoothie king": "smoothie king",
  };
  
  export function detectBrandAndItem(qRaw: string) {
    const simplify = TEXT.simplify;
    const q = simplify(qRaw);
    const toks = q.split(/\s+/).filter(Boolean);
    const catalog = new Set(Object.values(BRAND_ALIASES));
  
    let brand = "";
    for (let len = Math.min(4, toks.length); len >= 1; len--) {
      for (let i = 0; i + len <= toks.length; i++) {
        const cand = toks.slice(i, i + len).join(" ");
        const aliased = BRAND_ALIASES[cand];
        if (aliased) { brand = aliased; break; }
        if (catalog.has(cand)) { brand = cand; break; }
      }
      if (brand) break;
    }
    const item = brand ? toks.filter(t => !brand.split(" ").includes(t)).join(" ") : toks.join(" ");
    return { brand, item: item.trim() };
  }
  