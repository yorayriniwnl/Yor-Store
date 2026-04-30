// =============================================================
//  BasketBest — Abstract Base Scraper
//  File: scrapers/base.ts
//
//  All store scrapers extend this class.
//  Provides: retry logic, delay, structured error logging,
//            and a consistent PriceResult contract.
// =============================================================

// ------------------------------------------------------------------
// Result type
// ------------------------------------------------------------------

export interface PriceResult {
  storeName: string;
  storeSlug: string;
  productName: string;
  price: number;
  originalPrice: number;    // same as price when no active discount
  unit: string;
  inStock: boolean;
  affiliateUrl: string;
  imageUrl: string;
  scrapedAt: Date;
}

// ------------------------------------------------------------------
// Retry config
// ------------------------------------------------------------------

interface RetryOptions {
  attempts: number;     // total tries (not extra retries)
  delayMs: number;      // wait between attempts
}

const DEFAULT_RETRY: RetryOptions = {
  attempts: 3,
  delayMs: 2_000,
};

// ------------------------------------------------------------------
// Abstract base class
// ------------------------------------------------------------------

export abstract class BaseScraper {
  /** Human-readable store name used in logs and PriceResult */
  abstract readonly storeName: string;

  /** URL-safe slug for this store (e.g. "walmart", "whole-foods") */
  abstract readonly storeSlug: string;

  /**
   * Search the store for a query string and return all matching
   * products with current prices.
   */
  abstract search(query: string): Promise<PriceResult[]>;

  /**
   * Fetch the price for a single known product URL.
   * Returns an empty array when the product page is unavailable.
   */
  abstract getPrice(url: string): Promise<PriceResult[]>;

  // ------------------------------------------------------------------
  // Retry wrapper
  // ------------------------------------------------------------------

  /**
   * Runs `fn` up to `options.attempts` times.
   * Waits `options.delayMs` ms between each failed attempt.
   * Throws the last error if every attempt fails.
   */
  protected async withRetry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = DEFAULT_RETRY,
  ): Promise<T> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= options.attempts; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err;
        this.logError(
          `Attempt ${attempt}/${options.attempts} failed`,
          err,
        );

        const isLastAttempt = attempt === options.attempts;
        if (!isLastAttempt) {
          await BaseScraper.delay(options.delayMs);
        }
      }
    }

    // Re-throw so callers can decide whether to surface or swallow
    throw lastError;
  }

  // ------------------------------------------------------------------
  // Logging
  // ------------------------------------------------------------------

  /**
   * Structured error log prefixed with store context.
   * Subclasses can override for custom transports (Sentry, Datadog, …).
   */
  protected logError(message: string, err?: unknown): void {
    const detail =
      err instanceof Error
        ? { message: err.message, stack: err.stack }
        : { raw: String(err) };

    console.error(
      JSON.stringify({
        level: "error",
        store: this.storeName,
        storeSlug: this.storeSlug,
        message,
        ...detail,
        ts: new Date().toISOString(),
      }),
    );
  }

  /** Info-level log (optional but handy for scrape progress). */
  protected logInfo(message: string, meta?: Record<string, unknown>): void {
    console.log(
      JSON.stringify({
        level: "info",
        store: this.storeName,
        storeSlug: this.storeSlug,
        message,
        ...meta,
        ts: new Date().toISOString(),
      }),
    );
  }

  // ------------------------------------------------------------------
  // Helpers available to all subclasses
  // ------------------------------------------------------------------

  /** Awaitable sleep. */
  protected static delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Builds a PriceResult with sensible defaults so subclasses only
   * have to supply the fields they actually scraped.
   */
  protected buildResult(partial: Partial<PriceResult> &
    Pick<PriceResult, "productName" | "price" | "unit">): PriceResult {
    return {
      storeName: this.storeName,
      storeSlug: this.storeSlug,
      originalPrice: partial.price,   // default: no discount
      inStock: true,                  // default: assume available
      affiliateUrl: "",
      imageUrl: "",
      scrapedAt: new Date(),
      ...partial,
    };
  }
}
