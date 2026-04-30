// =============================================================
//  BasketBest — Prisma Seed File
//  File: prisma/seed.ts
//  Run:  npx prisma db seed
// =============================================================

import { PrismaClient, Category } from "@prisma/client";

const prisma = new PrismaClient();

// =============================================================
//  STORE DATA
// =============================================================

const stores = [
  {
    name: "Blinkit",
    baseUrl: "https://blinkit.com",
    logoUrl: "https://cdn.blinkit.com/logo.png",
    isScraped: true,
  },
  {
    name: "Zepto",
    baseUrl: "https://www.zeptonow.com",
    logoUrl: "https://zeptonow.com/static/logo.png",
    isScraped: true,
  },
  {
    name: "BigBasket",
    baseUrl: "https://www.bigbasket.com",
    logoUrl: "https://static.bigbasket.com/media/images/logo.png",
    isScraped: true,
  },
  {
    name: "Amazon Fresh",
    baseUrl: "https://www.amazon.in/alm/storefront",
    logoUrl: "https://amazon.in/favicon.ico",
    isScraped: false, // Amazon blocks scrapers — use PA API
  },
  {
    name: "Instamart",
    baseUrl: "https://www.swiggy.com/instamart",
    logoUrl: "https://instamart.swiggy.com/static/logo.svg",
    isScraped: true,
  },
];

// =============================================================
//  SAMPLE PRODUCTS (covers common Indian grocery categories)
// =============================================================

const products = [
  {
    name: "Amul Full Cream Milk",
    slug: "amul-full-cream-milk-1l",
    category: Category.DAIRY_EGGS,
    imageUrl: "https://cdn.example.com/amul-milk.webp",
  },
  {
    name: "Aashirvaad Atta (Whole Wheat)",
    slug: "aashirvaad-atta-5kg",
    category: Category.PANTRY_STAPLES,
    imageUrl: "https://cdn.example.com/aashirvaad-atta.webp",
  },
  {
    name: "Lay's Classic Salted Chips",
    slug: "lays-classic-salted-chips-26g",
    category: Category.SNACKS,
    imageUrl: "https://cdn.example.com/lays-chips.webp",
  },
  {
    name: "Fresh Tomatoes",
    slug: "fresh-tomatoes-500g",
    category: Category.FRUITS_VEGETABLES,
    imageUrl: "https://cdn.example.com/tomatoes.webp",
  },
  {
    name: "Coca-Cola Can",
    slug: "coca-cola-can-330ml",
    category: Category.BEVERAGES,
    imageUrl: "https://cdn.example.com/coca-cola.webp",
  },
];

// =============================================================
//  SEED PRICE DATA
//  Realistic INR prices per product × store
//  Format: [price, originalPrice | null, unit, inStock]
// =============================================================

type PriceRow = [number, number | null, string, boolean];

const priceMatrix: Record<string, Record<string, PriceRow>> = {
  "amul-full-cream-milk-1l": {
    Blinkit:      [68,   null, "1 L",  true],
    Zepto:        [67,   null, "1 L",  true],
    BigBasket:    [66,   null, "1 L",  true],
    "Amazon Fresh": [70, null, "1 L",  false],
    Instamart:    [69,   null, "1 L",  true],
  },
  "aashirvaad-atta-5kg": {
    Blinkit:      [280,  310,  "5 kg", true],
    Zepto:        [285,  null, "5 kg", true],
    BigBasket:    [275,  299,  "5 kg", true],
    "Amazon Fresh": [289, 310, "5 kg", true],
    Instamart:    [290,  null, "5 kg", false],
  },
  "lays-classic-salted-chips-26g": {
    Blinkit:      [20,   null, "26 g", true],
    Zepto:        [20,   null, "26 g", true],
    BigBasket:    [18,   20,   "26 g", true],
    "Amazon Fresh": [22, null, "26 g", true],
    Instamart:    [20,   null, "26 g", true],
  },
  "fresh-tomatoes-500g": {
    Blinkit:      [35,   null, "500 g", true],
    Zepto:        [32,   null, "500 g", true],
    BigBasket:    [30,   null, "500 g", true],
    "Amazon Fresh": [38, null, "500 g", false],
    Instamart:    [33,   null, "500 g", true],
  },
  "coca-cola-can-330ml": {
    Blinkit:      [45,   null, "330 ml", true],
    Zepto:        [44,   null, "330 ml", true],
    BigBasket:    [42,   50,   "330 ml", true],
    "Amazon Fresh": [46, null, "330 ml", true],
    Instamart:    [45,   null, "330 ml", true],
  },
};

// =============================================================
//  AFFILIATE URL BUILDER
// =============================================================

function buildAffiliateUrl(storeBaseUrl: string, slug: string): string {
  return `${storeBaseUrl}/search?q=${encodeURIComponent(slug)}&ref=basketbest`;
}

// =============================================================
//  MAIN SEED FUNCTION
// =============================================================

async function main() {
  console.log("🌱  Starting BasketBest seed...\n");

  // ── 1. Upsert Stores ────────────────────────────────────────
  console.log("📦  Seeding stores...");
  const storeMap: Record<string, string> = {}; // name → id

  for (const store of stores) {
    const record = await prisma.store.upsert({
      where:  { name: store.name },
      update: store,
      create: store,
    });
    storeMap[record.name] = record.id;
    console.log(`   ✓ ${record.name} (id: ${record.id})`);
  }

  // ── 2. Upsert Products ──────────────────────────────────────
  console.log("\n🛒  Seeding products...");
  const productMap: Record<string, string> = {}; // slug → id

  for (const product of products) {
    const record = await prisma.product.upsert({
      where:  { slug: product.slug },
      update: product,
      create: product,
    });
    productMap[record.slug] = record.id;
    console.log(`   ✓ ${record.name}`);
  }

  // ── 3. Upsert Prices ────────────────────────────────────────
  console.log("\n💰  Seeding prices...");
  let priceCount = 0;

  for (const [slug, storeRows] of Object.entries(priceMatrix)) {
    const productId = productMap[slug];
    if (!productId) continue;

    for (const [storeName, row] of Object.entries(storeRows)) {
      const storeId = storeMap[storeName];
      if (!storeId) continue;

      const [price, originalPrice, unit, inStock] = row;

      // Find the store's baseUrl for building affiliate links
      const store = stores.find((s) => s.name === storeName)!;

      await prisma.price.upsert({
        where: {
          productId_storeId: { productId, storeId },
        },
        update: {
          price,
          originalPrice: originalPrice ?? null,
          unit,
          inStock,
          scrapedAt: new Date(),
        },
        create: {
          productId,
          storeId,
          price,
          originalPrice: originalPrice ?? null,
          unit,
          inStock,
          affiliateUrl: buildAffiliateUrl(store.baseUrl, slug),
          scrapedAt: new Date(),
        },
      });

      priceCount++;
    }
  }

  console.log(`   ✓ ${priceCount} price records upserted`);

  // ── 4. Seed sample search history ───────────────────────────
  console.log("\n🔍  Seeding search history...");
  const searches = [
    { query: "milk",   resultCount: 12 },
    { query: "atta",   resultCount: 8  },
    { query: "chips",  resultCount: 25 },
    { query: "tomato", resultCount: 6  },
    { query: "cola",   resultCount: 10 },
  ];

  for (const s of searches) {
    await prisma.searchHistory.create({ data: s });
  }
  console.log(`   ✓ ${searches.length} search history records created`);

  console.log("\n✅  Seed complete!\n");
}

// =============================================================
//  RUNNER
// =============================================================

main()
  .catch((e) => {
    console.error("❌  Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
