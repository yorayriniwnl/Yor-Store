// =============================================================
//  BasketBest — Scraper Manager
//  File: scrapers/manager.ts
//
//  Orchestrates all scrapers, deduplicates and sorts results,
//  persists to Prisma DB, and updates the Redis cache.
//
//  Usage:
//    const manager = new ScraperManager();
//    const results = await manager.search("whole milk 1L");
// =============================================================

import { db } from "@/lib/db";
import { redis } from "@/lib/redis";
import { BaseScraper, PriceResult } from "./base";
import { BlinkitScraper } from "./blinkit";
import { BigBasketScraper } from "./bigbasket";

// ------------------------------------------------------------------
// Constants
// ------------------------------------------------------------------

const CACHE_TTL_SECONDS = 15 * 60; // 15-minute freshness window
const CACHE_KEY_PREFIX = "scrape:";

// ------------------------------------------------------------------
// Redis singleton (same pattern as API routes)
// ------------------------------------------------------------------

// ------------------------------------------------------------------
// Dedup key
// ------------------------------------------------------------------

function dedupKey(r: PriceResult): string {
  return `${r.storeSlug}::${r.productName.trim().toLowerCase()}`;
}

// ------------------------------------------------------------------
// Slug helper (mirrors Prisma unique constraint on Product.slug)
// ------------------------------------------------------------------

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ------------------------------------------------------------------
// ScraperManager
// ------------------------------------------------------------------

export class ScraperManager {
  /** Register new scrapers here as the catalogue grows. */
  private readonly scrapers: BaseScraper[] = [
    new BlinkitScraper(),
    new BigBasketScraper(),
  ];

  // ------------------------------------------------------------------
  // Public API
  // ------------------------------------------------------------------

  /**
   * Run all scrapers in parallel for `query`.
   *
   * - Tolerates individual scraper failures (Promise.allSettled).
   * - Deduplicates results across scrapers.
   * - Persists every result to Prisma (upsert).
   * - Refreshes Redis cache for the query.
   * - Returns the final list sorted by price ascending.
   */
  async search(query: string): Promise<PriceResult[]> {
    const normalised = query.trim().toLowerCase();
    const cacheKey = `${CACHE_KEY_PREFIX}${normalised}`;

    // 1. Redis cache check -------------------------------------------
    if (redis) {
      try {
        const cached = await redis.get<PriceResult[]>(cacheKey);
        if (cached !== null) {
          console.log(
            JSON.stringify({
              level: "info",
              manager: "ScraperManager",
              message: "Cache hit",
              query: normalised,
            }),
          );
          return cached;
        }
      } catch (err) {
        console.error("[ScraperManager] Redis get error:", err);
      }
    }

    // 2. Run all scrapers in parallel --------------------------------
    const settled = await Promise.allSettled(
      this.scrapers.map((s) => s.search(query)),
    );

    const allResults: PriceResult[] = [];

    for (let i = 0; i < settled.length; i++) {
      const outcome = settled[i];
      const scraper = this.scrapers[i];

      if (outcome.status === "fulfilled") {
        allResults.push(...outcome.value);
      } else {
        // Log but never throw — other scrapers still ran successfully
        console.error(
          JSON.stringify({
            level: "error",
            manager: "ScraperManager",
            scraper: scraper.storeName,
            message: "Scraper rejected",
            error:
              outcome.reason instanceof Error
                ? outcome.reason.message
                : String(outcome.reason),
          }),
        );
      }
    }

    // 3. Deduplicate by storeSlug + productName ----------------------
    const seen = new Map<string, PriceResult>();
    for (const r of allResults) {
      const key = dedupKey(r);
      // Keep the lower price if the same (store, product) appears twice
      const existing = seen.get(key);
      if (!existing || r.price < existing.price) {
        seen.set(key, r);
      }
    }
    const deduplicated = Array.from(seen.values());

    // 4. Sort by price ascending ------------------------------------
    const sorted = deduplicated.sort((a, b) => a.price - b.price);

    // 5. Persist to Prisma (fire-and-forget, non-blocking) ----------
    this.persistAll(sorted).catch((err) =>
      console.error("[ScraperManager] persistAll error:", err),
    );

    // 6. Update Redis cache (fire-and-forget) -----------------------
    if (redis) {
      redis
        .set(cacheKey, sorted, { ex: CACHE_TTL_SECONDS })
        .catch((err) =>
          console.error("[ScraperManager] Redis set error:", err),
        );
    }

    // 7. Return sorted results --------------------------------------
    return sorted;
  }

  // ------------------------------------------------------------------
  // Persistence
  // ------------------------------------------------------------------

  /**
   * Upserts every PriceResult into the DB.
   *
   * Upsert strategy:
   *   - Store   — upsert on `name` (unique)
   *   - Product — upsert on `slug` (unique)
   *   - Price   — upsert on `[productId, storeId]` (unique constraint)
   *
   * All operations run in parallel per result for throughput, but
   * each result's three writes are sequential (store → product → price)
   * because the price FK depends on the other two IDs.
   */
  private async persistAll(results: PriceResult[]): Promise<void> {
    await Promise.allSettled(results.map((r) => this.persistOne(r)));
  }

  private async persistOne(r: PriceResult): Promise<void> {
    try {
      // --- Store (upsert on name) ---
      const store = await db.store.upsert({
        where: { name: r.storeName },
        update: { updatedAt: new Date() },
        create: {
          name: r.storeName,
          baseUrl: this.storeBaseUrl(r.storeSlug),
          isScraped: true,
        },
      });

      // --- Product (upsert on slug) ---
      const slug = toSlug(r.productName);
      const product = await db.product.upsert({
        where: { slug },
        update: {
          name: r.productName,
          imageUrl: r.imageUrl || undefined,
          updatedAt: new Date(),
        },
        create: {
          name: r.productName,
          slug,
          imageUrl: r.imageUrl || undefined,
        },
      });

      // --- Price (upsert on productId + storeId) ---
      await db.price.upsert({
        where: {
          productId_storeId: {
            productId: product.id,
            storeId: store.id,
          },
        },
        update: {
          price: r.price,
          originalPrice: r.originalPrice !== r.price ? r.originalPrice : null,
          unit: r.unit,
          inStock: r.inStock,
          affiliateUrl: r.affiliateUrl || null,
          scrapedAt: r.scrapedAt,
        },
        create: {
          price: r.price,
          originalPrice: r.originalPrice !== r.price ? r.originalPrice : null,
          unit: r.unit,
          inStock: r.inStock,
          affiliateUrl: r.affiliateUrl || null,
          scrapedAt: r.scrapedAt,
          productId: product.id,
          storeId: store.id,
        },
      });
    } catch (err) {
      // Surface per-result errors without killing other persists
      console.error(
        JSON.stringify({
          level: "error",
          manager: "ScraperManager",
          message: "persistOne failed",
          product: r.productName,
          store: r.storeName,
          error: err instanceof Error ? err.message : String(err),
        }),
      );
    }
  }

  // ------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------

  private storeBaseUrl(slug: string): string {
    const map: Record<string, string> = {
      blinkit: "https://blinkit.com",
      bigbasket: "https://www.bigbasket.com",
    };
    return map[slug] ?? `https://${slug}.com`;
  }
}
