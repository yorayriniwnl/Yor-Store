// =============================================================
//  BasketBest — BigBasket Scraper
//  File: scrapers/bigbasket.ts
//
//  Uses BigBasket's product listing endpoint (JSON).
//  Endpoint: GET https://www.bigbasket.com/product/get-products/
//
//  ⚠️  BigBasket sometimes requires a login session for full
//      catalog access. If a 401/403 is returned, or if the
//      response indicates an auth wall, we return [] gracefully.
// =============================================================

import { BaseScraper, PriceResult } from "./base";

// ------------------------------------------------------------------
// BigBasket API response shapes
// ------------------------------------------------------------------

interface BigBasketProductEntry {
  // Some fields are nested under `prod` in certain response versions
  prod?: {
    desc: string;      // product display name
    slug: string;      // URL slug, e.g. "fresho-milk-standardised-500-ml"
    images?: Array<{ s?: string }>;  // `s` = small thumbnail URL
  };
  // Price fields appear at the top level
  sp?: number;         // selling price
  mrp?: number;        // market (original) price
  w?: { tt?: string }; // weight / unit string, e.g. "500 ml"
  inStock?: boolean;
}

interface BigBasketApiResponse {
  tab_info?: Array<{
    product_info?: {
      products?: BigBasketProductEntry[];
    };
  }>;
}

// ------------------------------------------------------------------
// Auth-failure sentinels
// ------------------------------------------------------------------

/** HTTP status codes that indicate the request was blocked. */
const BLOCKED_STATUS_CODES = new Set([401, 403, 429, 503]);

// ------------------------------------------------------------------
// Scraper
// ------------------------------------------------------------------

export class BigBasketScraper extends BaseScraper {
  readonly storeName = "BigBasket";
  readonly storeSlug = "bigbasket";

  private readonly BASE_URL = "https://www.bigbasket.com";
  private readonly SEARCH_API =
    "https://www.bigbasket.com/product/get-products/";

  private readonly USER_AGENT =
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) " +
    "AppleWebKit/537.36 (KHTML, like Gecko) " +
    "Chrome/124.0.0.0 Safari/537.36";

  // ------------------------------------------------------------------
  // search
  // ------------------------------------------------------------------

  async search(query: string): Promise<PriceResult[]> {
    const url = new URL(this.SEARCH_API);
    url.searchParams.set("slug", query);
    url.searchParams.set("page", "1");

    try {
      return await this.withRetry(() => this.fetchProducts(url.toString()));
    } catch (err) {
      this.logError("search() failed after all retries", err);
      return [];
    }
  }

  // ------------------------------------------------------------------
  // getPrice  (single product URL)
  // ------------------------------------------------------------------

  async getPrice(productUrl: string): Promise<PriceResult[]> {
    const slug = this.extractSlugFromUrl(productUrl);
    if (!slug) {
      this.logError("getPrice() — could not parse slug from URL", productUrl);
      return [];
    }

    const url = new URL(this.SEARCH_API);
    url.searchParams.set("slug", slug);
    url.searchParams.set("page", "1");

    try {
      return await this.withRetry(() => this.fetchProducts(url.toString()));
    } catch (err) {
      this.logError("getPrice() failed after all retries", err);
      return [];
    }
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
        // BigBasket checks this header to distinguish API calls
        "X-Requested-With": "XMLHttpRequest",
      },
    });

    // Auth / rate-limit wall — return empty gracefully
    if (BLOCKED_STATUS_CODES.has(response.status)) {
      this.logError(
        `BigBasket blocked the request (HTTP ${response.status}). ` +
          "Returning empty — session/cookie may be required.",
        url
      );
      return [];
    }

    if (!response.ok) {
      throw new Error(
        `BigBasket API returned HTTP ${response.status} for ${url}`
      );
    }

    let data: BigBasketApiResponse;
    try {
      data = (await response.json()) as BigBasketApiResponse;
    } catch {
      // Non-JSON body usually means an HTML login redirect
      this.logError("BigBasket returned non-JSON — likely an auth redirect");
      return [];
    }

    const products = this.extractProducts(data);
    this.logInfo(`Fetched ${products.length} product(s) from BigBasket`, { url });
    return products;
  }

  /**
   * BigBasket nests products under `tab_info[0].product_info.products`.
   * Guard every level since the shape can shift between API versions.
   */
  private extractProducts(data: BigBasketApiResponse): PriceResult[] {
    const entries =
      data?.tab_info?.[0]?.product_info?.products ?? [];

    return entries.flatMap((entry) => {
      const prod = entry.prod;
      if (!prod?.desc || entry.sp == null) return [];

      return [this.mapProduct(entry)];
    });
  }

  private mapProduct(entry: BigBasketProductEntry): PriceResult {
    const prod = entry.prod!;
    const slug = prod.slug ?? this.toSlug(prod.desc);
    const productUrl = `${this.BASE_URL}/pd/${slug}/`;
    const imageUrl = prod.images?.[0]?.s ?? "";

    return this.buildResult({
      productName: prod.desc,
      price: entry.sp!,
      originalPrice: entry.mrp ?? entry.sp!,
      unit: entry.w?.tt ?? "",
      imageUrl,
      affiliateUrl: productUrl,
      inStock: entry.inStock ?? true,
    });
  }

  private toSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  /** Extracts the slug from a BigBasket product URL: /pd/{slug}/ */
  private extractSlugFromUrl(url: string): string | null {
    try {
      const { pathname } = new URL(url);
      const parts = pathname.split("/").filter(Boolean);
      const pdIndex = parts.indexOf("pd");
      return pdIndex !== -1 ? (parts[pdIndex + 1] ?? null) : null;
    } catch {
      return null;
    }
  }
}
