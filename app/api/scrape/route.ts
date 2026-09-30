// =============================================================
//  BasketBest — Scrape API Route
//  File: app/api/scrape/route.ts
//
//  POST /api/scrape
//  Body: { query: string }
//
//  1. Validates body with Zod
//  2. Calls ScraperManager.search(query) — runs all scrapers in
//     parallel, deduplicates, and persists to DB internally
//  3. Clears the Redis search cache for this query so the next
//     GET /api/search returns fresh data
//  4. Returns { success: true, resultsCount: number }
//
//  Auth: Protect this route in production (cron secret header).
// =============================================================

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { redis } from "@/lib/redis";
import { ScraperManager } from "@/scrapers/manager";
import { isCronRequestAuthorised } from "@/lib/cron-auth.mjs";

// ------------------------------------------------------------------
// Redis singleton
// ------------------------------------------------------------------

// Cache key prefixes — must match what /api/search uses so busting
// the scrape key also clears what the search route reads.
const SEARCH_CACHE_PREFIX = "search:";
const SCRAPE_CACHE_PREFIX = "scrape:";

// ------------------------------------------------------------------
// Request validation
// ------------------------------------------------------------------

const ScrapeBodySchema = z.object({
  query: z
    .string({ required_error: "Body field 'query' is required." })
    .trim()
    .min(1, "Query must be at least 1 character.")
    .max(100, "Query must be at most 100 characters."),
});

// ------------------------------------------------------------------
// Cron-job secret guard
// ------------------------------------------------------------------

function isAuthorised(request: NextRequest): boolean {
  return isCronRequestAuthorised({
    authorization: request.headers.get("authorization"),
    secret: process.env.CRON_SECRET,
    nodeEnv: process.env.NODE_ENV,
  });
}

// ------------------------------------------------------------------
// POST /api/scrape
// ------------------------------------------------------------------

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Auth guard
  if (!isAuthorised(request)) {
    return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  }

  // 1. Parse & validate body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const parsed = ScrapeBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { query } = parsed.data;
  const normalised = query.toLowerCase();

  // 2. Run all scrapers via ScraperManager
  //    ScraperManager.search() internally:
  //      - Runs all scrapers in parallel (Promise.allSettled)
  //      - Deduplicates results
  //      - Persists every result to the DB (upsert)
  //      - Writes to the "scrape:{query}" Redis key
  let results: Awaited<ReturnType<ScraperManager["search"]>>;
  try {
    const manager = new ScraperManager();
    results = await manager.search(query);
  } catch (err) {
    console.error(
      JSON.stringify({
        level: "error",
        route: "POST /api/scrape",
        message: "ScraperManager.search threw",
        query,
        error: err instanceof Error ? err.message : String(err),
      }),
    );
    return NextResponse.json(
      { error: "Scraping failed. Check server logs for details." },
      { status: 500 },
    );
  }

  // 3. Bust the /api/search Redis cache for this query so the next
  //    GET /api/search?q=<query> re-reads fresh data from the DB.
  if (redis) {
    try {
      await redis.del(`${SEARCH_CACHE_PREFIX}${normalised}`);
      // Also delete the scraper's own cache key so a re-scrape is
      // possible without waiting for the 15-min TTL to expire.
      await redis.del(`${SCRAPE_CACHE_PREFIX}${normalised}`);
    } catch (err) {
      // Non-fatal — the stale cache will expire naturally
      console.error("[POST /api/scrape] Redis DEL error:", err);
    }
  }

  // 4. Return success
  return NextResponse.json(
    {
      success: true,
      query,
      resultsCount: results.length,
    },
    { status: 200 },
  );
}