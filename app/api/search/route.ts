// =============================================================
//  BasketBest — Search API
//  File: app/api/search/route.ts
//
//  GET /api/search?q=<query>
//
//  1. Validates query param with Zod
//  2. Checks Redis cache (key: search:{query}, TTL: 20 min)
//  3. On miss: queries Prisma for products matching name
//  4. Caches + returns normalised JSON
// =============================================================

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { databaseNotConfiguredResponse, isDatabaseConfigured } from "@/lib/env";
import { redis } from "@/lib/redis";
import { Category, Prisma } from "@prisma/client";

// ------------------------------------------------------------------
// Redis client (singleton-safe — module cached by Node.js)
// ------------------------------------------------------------------

const CACHE_TTL_SECONDS = 20 * 60; // 20 minutes

// ------------------------------------------------------------------
// Zod schema
// ------------------------------------------------------------------

const SearchQuerySchema = z.object({
  q: z
    .string({ required_error: "Query param 'q' is required." })
    .trim()
    .min(1, "Query must be at least 1 character.")
    .max(100, "Query must be at most 100 characters."),
});

// ------------------------------------------------------------------
// Response types
// ------------------------------------------------------------------

interface StorePriceDto {
  storeName: string;
  price: number;
  unit: string;
  inStock: boolean;
  affiliateUrl: string | null;
}

interface ProductDto {
  id: string;
  name: string;
  slug: string;
  category: Category;
  imageUrl: string | null;
  prices: StorePriceDto[];
}

interface SearchResponseDto {
  products: ProductDto[];
  fromCache: boolean;
  query: string;
}

type RawProduct = Prisma.ProductGetPayload<{
  include: {
    prices: {
      include: {
        store: {
          select: { name: true };
        };
      };
    };
  };
}>;

// ------------------------------------------------------------------
// GET handler
// ------------------------------------------------------------------

export async function GET(request: NextRequest): Promise<NextResponse> {
  // 1. Parse + validate query params
  const { searchParams } = request.nextUrl;
  const raw = { q: searchParams.get("q") ?? undefined };

  const parsed = SearchQuerySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const query = parsed.data.q;
  const cacheKey = `search:${query.toLowerCase()}`;

  if (!isDatabaseConfigured()) {
    return NextResponse.json(databaseNotConfiguredResponse(), { status: 503 });
  }

  // 2. Check Redis cache
  if (redis) {
    try {
      const cached = await redis.get<ProductDto[]>(cacheKey);
      if (cached !== null) {
        const body: SearchResponseDto = {
          products: cached,
          fromCache: true,
          query,
        };
        return NextResponse.json(body, { status: 200 });
      }
    } catch (err) {
      // Cache failure is non-fatal — continue to DB
      console.error("[search] Redis get error:", err);
    }
  }

  // 3. Query Prisma
  let rawProducts: RawProduct[];
  try {
    rawProducts = await db.product.findMany({
      where: {
        name: {
          contains: query,
          mode: "insensitive",
        },
      },
      include: {
        prices: {
          include: {
            store: {
              select: { name: true },
            },
          },
          orderBy: { price: "asc" },
        },
      },
      orderBy: { name: "asc" },
      take: 50, // cap results to avoid unbounded responses
    });
  } catch (err) {
    console.error("[search] Prisma query error:", err);
    return NextResponse.json(
      { error: "Search failed. Check the database configuration." },
      { status: 500 },
    );
  }

  // 4. Normalise to DTO
  const products: ProductDto[] = rawProducts.map((product) => ({
    id: product.id,
    name: product.name,
    slug: product.slug,
    category: product.category,
    imageUrl: product.imageUrl,
    prices: product.prices.map((p) => ({
      storeName: p.store.name,
      price: Number(p.price),
      unit: p.unit,
      inStock: p.inStock,
      affiliateUrl: p.affiliateUrl,
    })),
  }));

  // 5. Write to cache (fire-and-forget, non-blocking)
  if (redis) {
    redis
      .set(cacheKey, products, { ex: CACHE_TTL_SECONDS })
      .catch((err) => console.error("[search] Redis set error:", err));
  }

  // 6. Also log the search query asynchronously (best-effort)
  db.searchHistory
    .create({
      data: { query, resultCount: products.length },
    })
    .catch((err) => console.error("[search] SearchHistory write error:", err));

  const body: SearchResponseDto = {
    products,
    fromCache: false,
    query,
  };

  return NextResponse.json(body, { status: 200 });
}
