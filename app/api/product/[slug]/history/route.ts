// =============================================================
//  BasketBest — Price History API
//  File: app/api/product/[slug]/history/route.ts
//
//  GET /api/product/:slug/history
//
//  Returns last 30 days of price history grouped by store.
//  One entry per (store, day) — latest price wins for that day.
//  Shape is ready to drop into a Recharts <LineChart />.
//
//  Response:
//  [
//    {
//      storeName: string,
//      data: [{ date: "YYYY-MM-DD", price: number }]
//    }
//  ]
// =============================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------

interface HistoryPointDto {
  date: string;   // "YYYY-MM-DD"
  price: number;
}

interface StoreHistoryDto {
  storeName: string;
  data: HistoryPointDto[];
}

// ------------------------------------------------------------------
// Route context (Next.js 14 App Router)
// ------------------------------------------------------------------

interface RouteContext {
  params: { slug: string };
}

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

/** Format a Date to "YYYY-MM-DD" in UTC. */
function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Midnight UTC, 30 days ago. */
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
  { params }: RouteContext
): Promise<NextResponse> {
  const { slug } = params;

  if (!slug || typeof slug !== "string") {
    return NextResponse.json({ error: "Invalid slug." }, { status: 400 });
  }

  // Resolve product ID from slug
  const product = await db.product.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  const cutoff = thirtyDaysAgo();

  // ------------------------------------------------------------------
  // Fetch all Price rows for this product within the 30-day window.
  //
  // Current schema note:
  //   Price has @@unique([productId, storeId]) — one live row per store.
  //   The scrapedAt column carries the timestamp of the last update.
  //   So "history" today is a snapshot per store.
  //
  // Future-proof path (recommended):
  //   Add a PriceHistory model with (productId, storeId, price, recordedAt)
  //   and swap the query below — the grouping + dedup logic stays identical.
  // ------------------------------------------------------------------

  const prices = await db.price.findMany({
    where: {
      productId: product.id,
      scrapedAt: { gte: cutoff },
    },
    select: {
      price: true,
      scrapedAt: true,
      store: {
        select: { name: true },
      },
    },
    orderBy: { scrapedAt: "asc" },
  });

  // ------------------------------------------------------------------
  // Group by store → then by date
  // For each (store, day) keep the latest-scraped price.
  // Because Price is unique per (productId, storeId) there will be at
  // most one row per store right now, but the algorithm handles N rows
  // correctly once PriceHistory is in place.
  // ------------------------------------------------------------------

  // storeName → (dateStr → { price, scrapedAt })
  type DayBucket = { price: number; scrapedAt: Date };
  const storeMap = new Map<string, Map<string, DayBucket>>();

  for (const row of prices) {
    const storeName = row.store.name;
    const dateStr = toDateString(row.scrapedAt);
    const priceNum = Number(row.price);

    if (!storeMap.has(storeName)) {
      storeMap.set(storeName, new Map());
    }

    const dayMap = storeMap.get(storeName)!;
    const existing = dayMap.get(dateStr);

    // Keep the entry with the most recent scrapedAt for that day
    if (!existing || row.scrapedAt > existing.scrapedAt) {
      dayMap.set(dateStr, { price: priceNum, scrapedAt: row.scrapedAt });
    }
  }

  // ------------------------------------------------------------------
  // Serialise to response DTO
  // ------------------------------------------------------------------

  const result: StoreHistoryDto[] = Array.from(storeMap.entries())
    .map(([storeName, dayMap]) => ({
      storeName,
      data: Array.from(dayMap.entries())
        .map(([date, bucket]) => ({ date, price: bucket.price }))
        .sort((a, b) => a.date.localeCompare(b.date)), // chronological
    }))
    .sort((a, b) => a.storeName.localeCompare(b.storeName)); // stable order

  return NextResponse.json(result, { status: 200 });
}
