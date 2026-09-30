// =============================================================
//  BasketBest — Product Detail API
//  File: app/api/product/[slug]/route.ts
//
//  GET /api/product/:slug
//
//  1. Checks Redis cache (key: product:{slug}, TTL: 1 hour)
//  2. Fetches product + all prices (sorted cheapest first)
//  3. Includes price history for last 30 days grouped by store
//  4. Strict TypeScript — no 'any'
// =============================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { redis } from "@/lib/redis";
import { Category } from "@prisma/client";

// ------------------------------------------------------------------
// Redis client
// ------------------------------------------------------------------

const CACHE_TTL_SECONDS = 60 * 60; // 1 hour

// ------------------------------------------------------------------
// Response types  (strict — no 'any')
// ------------------------------------------------------------------

interface PriceEntryDto {
  storeName: string;
  storeLogoUrl: string | null;
  price: number;
  originalPrice: number | null;
  unit: string;
  inStock: boolean;
  affiliateUrl: string | null;
  scrapedAt: string; // ISO 8601
}

interface HistoryPointDto {
  date: string; // "YYYY-MM-DD"
  price: number;
}

interface StoreHistoryDto {
  storeName: string;
  data: HistoryPointDto[];
}

interface ProductDetailDto {
  id: string;
  name: string;
  slug: string;
  category: Category;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  prices: PriceEntryDto[]; // cheapest first
  priceHistory: StoreHistoryDto[]; // last 30 days, grouped by store
}

// ------------------------------------------------------------------
// Route params type (Next.js 16 App Router)
// ------------------------------------------------------------------

interface RouteContext {
  params: Promise<{ slug: string }>;
}

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

/** Format a Date to "YYYY-MM-DD" in UTC */
function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** 30 days ago from now (midnight UTC) */
function thirtyDaysAgo(): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 30);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

// ------------------------------------------------------------------
// GET handler
// ------------------------------------------------------------------

export async function GET(
  _request: NextRequest,
  { params }: RouteContext,
): Promise<NextResponse> {
  const { slug } = await params;

  if (!slug || typeof slug !== "string") {
    return NextResponse.json({ error: "Invalid slug." }, { status: 400 });
  }

  const cacheKey = `product:${slug}`;

  // 1. Check Redis cache
  if (redis) {
    try {
      const cached = await redis.get<ProductDetailDto>(cacheKey);
      if (cached !== null) {
        return NextResponse.json(cached, { status: 200 });
      }
    } catch (err) {
      console.error("[product] Redis get error:", err);
    }
  }

  // 2. Fetch product with all prices
  const product = await db.product.findUnique({
    where: { slug },
    include: {
      prices: {
        include: {
          store: {
            select: { name: true, logoUrl: true },
          },
        },
        orderBy: { price: "asc" }, // cheapest first
      },
    },
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  // 3. Build current prices DTO (already cheapest-first from Prisma)
  const prices: PriceEntryDto[] = product.prices.map((p) => ({
    storeName: p.store.name,
    storeLogoUrl: p.store.logoUrl,
    price: Number(p.price),
    originalPrice: p.originalPrice !== null ? Number(p.originalPrice) : null,
    unit: p.unit,
    inStock: p.inStock,
    affiliateUrl: p.affiliateUrl,
    scrapedAt: p.scrapedAt.toISOString(),
  }));

  // 4. Build price history for last 30 days, grouped by store
  //
  //    The Price model stores ONE record per product+store (the current price).
  //    scrapedAt represents when that price was last recorded.
  //    This endpoint groups those records by store and date, returning one
  //    data point per (store, day) — the foundation for a history chart.
  //
  //    ⚠️  For richer history, add a PriceHistory model that records every
  //    scrape event. This route's shape is already compatible with that future
  //    schema: just swap in the PriceHistory query below.
  const cutoff = thirtyDaysAgo();

  const recentPrices = product.prices.filter((p) => p.scrapedAt >= cutoff);

  // Group by store name → then by date (keep latest price for that day)
  const storeMap = new Map<string, Map<string, number>>();

  for (const p of recentPrices) {
    const storeName = p.store.name;
    const dateStr = toDateString(p.scrapedAt);
    const priceNum = Number(p.price);

    if (!storeMap.has(storeName)) {
      storeMap.set(storeName, new Map());
    }

    const dayMap = storeMap.get(storeName)!;
    // Keep the latest (highest scrapedAt) — since Price has one row per store,
    // this will just be that single row. For a PriceHistory table, you'd
    // accumulate and deduplicate here.
    dayMap.set(dateStr, priceNum);
  }

  const priceHistory: StoreHistoryDto[] = Array.from(storeMap.entries())
    .map(([storeName, dayMap]) => ({
      storeName,
      data: Array.from(dayMap.entries())
        .map(([date, price]) => ({ date, price }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    }))
    .sort((a, b) => a.storeName.localeCompare(b.storeName));

  // 5. Assemble final DTO
  const body: ProductDetailDto = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    category: product.category,
    imageUrl: product.imageUrl,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
    prices,
    priceHistory,
  };

  // 6. Write to cache (fire-and-forget)
  if (redis) {
    redis
      .set(cacheKey, body, { ex: CACHE_TTL_SECONDS })
      .catch((err) => console.error("[product] Redis set error:", err));
  }

  return NextResponse.json(body, { status: 200 });
}