// =============================================================
//  BasketBest — Blinkit Scraper
//  File: scrapers/blinkit.ts
//
//  Uses Blinkit's internal search API (JSON, no Playwright).
//  Endpoint: GET https://blinkit.com/v6/search/products
// =============================================================

import { BaseScraper, PriceResult } from "./base";

// ------------------------------------------------------------------
// Blinkit API response shapes
// ------------------------------------------------------------------

interface BlinkitProduct {
  id: number;
  name: string;
  price: number;          // selling price (paise or rupees — confirm at runtime)
  mrp: number;            // maximum retail price
  unit: string;           // e.g. "500 g", "1 L"
  image_url: string;
  l2_category: string;    // sub-category slug (used to build affiliate URL)
}

interface BlinkitSearchResponse {
  products: BlinkitProduct[];
  total_count?: number;
}

// ------------------------------------------------------------------
// Scraper
// ------------------------------------------------------------------

export class BlinkitScraper extends BaseScraper {
  readonly storeName = "Blinkit";
  readonly storeSlug = "blinkit";

  private readonly BASE_URL = "https://blinkit.com";
  private readonly SEARCH_API =
    "https://blinkit.com/v6/search/products";

  /** Realistic browser User-Agent to avoid bot-detection 429s */
  private readonly USER_AGENT =
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) " +
    "AppleWebKit/537.36 (KHTML, like Gecko) " +
    "Chrome/124.0.0.0 Safari/537.36";

  // ------------------------------------------------------------------
  // search
  // ------------------------------------------------------------------

  async search(query: string): Promise<PriceResult[]> {
    const url = new URL(this.SEARCH_API);
    url.searchParams.set("q", query);
    url.searchParams.set("start", "0");
    url.searchParams.set("size", "10");

    try {
      return await this.withRetry(() => this.fetchProducts(url.toString()));
    } catch (err) {
      this.logError("search() failed after all retries", err);
      return [];
    }
  }

  // ------------------------------------------------------------------
  // getPrice  (single product page — not applicable for API-based scraper)
  // ------------------------------------------------------------------

  async getPrice(productUrl: string): Promise<PriceResult[]> {
    // Blinkit doesn't expose a single-product JSON endpoint; re-search by URL
    // slug as a best-effort fallback.
    const slug = this.extractSlugFromUrl(productUrl);
    if (!slug) {
      this.logError("getPrice() — could not parse slug from URL", productUrl);
      return [];
    }
    return this.search(slug.replace(/-/g, " "));
  }

  // ------------------------------------------------------------------
  // Private helpers
  // ------------------------------------------------------------------

  private async fetchProducts(url: string): Promise<PriceResult[]> {
    const response = await fetch(url, {
      headers: {
        "User-Agent": this.USER_AGENT,
        Accept: "application/json",
        "Accept-Language": "en-IN,en;q=0.9",
        Referer: this.BASE_URL,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Blinkit API returned HTTP ${response.status} for ${url}`
      );
    }

    const data = (await response.json()) as BlinkitSearchResponse;
    const products = data?.products ?? [];

    this.logInfo(`Fetched ${products.length} product(s) from Blinkit`, {
      url,
    });

    return products.map((p) => this.mapProduct(p));
  }

  private mapProduct(p: BlinkitProduct): PriceResult {
    const productSlug = this.toSlug(p.name);
    const affiliateUrl = `${this.BASE_URL}/prn/${productSlug}/prid/${p.id}`;

    return this.buildResult({
      productName: p.name,
      price: p.price,
      originalPrice: p.mrp ?? p.price,
      unit: p.unit ?? "",
      imageUrl: p.image_url ?? "",
      affiliateUrl,
      inStock: true, // Blinkit search only returns in-stock items
    });
  }

  /** Converts a display name to a URL-safe slug, e.g. "Whole Milk 1L" → "whole-milk-1l" */
  private toSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  /** Extracts the last path segment of a Blinkit product URL as a slug. */
  private extractSlugFromUrl(url: string): string | null {
    try {
      const { pathname } = new URL(url);
      const parts = pathname.split("/").filter(Boolean);
      // URL pattern: /prn/{slug}/prid/{id}
      const prnIndex = parts.indexOf("prn");
      return prnIndex !== -1 ? (parts[prnIndex + 1] ?? null) : null;
    } catch {
      return null;
    }
  }
}
