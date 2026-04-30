// app/search/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import SearchBar from "@/components/SearchBar";
import ProductCard from "@/components/ProductCard";
import PriceSkeleton from "@/components/PriceSkeleton";

interface StorePrice {
  storeName: string;
  price: number;
  unit: string;
  inStock: boolean;
  affiliateUrl: string | null;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  imageUrl: string | null;
  prices: StorePrice[];
}

const STORES = [
  "All Stores",
  "Blinkit",
  "Zepto",
  "BigBasket",
  "Amazon Fresh",
  "Instamart",
];
const SORT_OPTIONS = [
  { value: "cheapest", label: "Cheapest First" },
  { value: "discount", label: "Highest Discount" },
  { value: "store", label: "By Store" },
];

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") ?? "";

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);

  const [activeStore, setActiveStore] = useState("All Stores");
  const [sortBy, setSortBy] = useState("cheapest");

  const fetchResults = useCallback(async () => {
    if (!query) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.message ?? data.error ?? `Search failed: ${res.statusText}`,
        );
      }
      setProducts(data.products ?? []);
      setFromCache(data.fromCache ?? false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  // Filter by store
  const filtered =
    activeStore === "All Stores"
      ? products
      : products.filter((p) =>
          p.prices.some(
            (pr) => pr.storeName.toLowerCase() === activeStore.toLowerCase(),
          ),
        );

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    const aMin = Math.min(...a.prices.map((p) => p.price));
    const bMin = Math.min(...b.prices.map((p) => p.price));

    if (sortBy === "cheapest") return aMin - bMin;
    if (sortBy === "discount") {
      const aDisc = Math.max(...a.prices.map((p) => p.price)) - aMin;
      const bDisc = Math.max(...b.prices.map((p) => p.price)) - bMin;
      return bDisc - aDisc;
    }
    if (sortBy === "store") {
      const aStore = a.prices[0]?.storeName ?? "";
      const bStore = b.prices[0]?.storeName ?? "";
      return aStore.localeCompare(bStore);
    }
    return 0;
  });

  // Find global cheapest product id
  const cheapestId =
    sorted.length > 0
      ? sorted.reduce((min, p) => {
          const minP = Math.min(...p.prices.map((pr) => pr.price));
          const curMin = Math.min(...min.prices.map((pr) => pr.price));
          return minP < curMin ? p : min;
        }, sorted[0]).id
      : null;

  return (
    <div className="min-h-screen bg-[#f8faf8] font-sans">
      {/* Header / search bar */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-4">
          <Link
            href="/"
            className="text-xl font-black text-gray-900 flex-shrink-0 hidden sm:block"
          >
            <span>Basket</span>
            <span className="text-emerald-500">Best</span>
          </Link>
          <div className="flex-1">
            <SearchBar initialValue={query} />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Results header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {loading
                ? "Searching…"
                : `${sorted.length} result${sorted.length !== 1 ? "s" : ""} for`}{" "}
              {!loading && <span className="text-emerald-600">"{query}"</span>}
            </h1>
            {fromCache && !loading && (
              <p className="text-xs text-gray-400 mt-0.5">Results from cache</p>
            )}
          </div>

          {/* Sort dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-sm border border-gray-200 rounded-xl px-3 py-2 text-gray-700 font-medium bg-white focus:outline-none focus:border-emerald-300"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Store filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-hide">
          {STORES.map((store) => (
            <button
              key={store}
              onClick={() => setActiveStore(store)}
              className={`flex-shrink-0 text-sm font-semibold px-4 py-2 rounded-xl border transition-all duration-150
                ${
                  activeStore === store
                    ? "bg-emerald-500 border-emerald-500 text-white shadow-sm"
                    : "bg-white border-gray-200 text-gray-600 hover:border-emerald-200 hover:text-emerald-700"
                }`}
            >
              {store}
            </button>
          ))}
        </div>

        {/* States */}
        {loading && <PriceSkeleton />}

        {!loading && error && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">😕</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Something went wrong
            </h2>
            <p className="text-gray-500 mb-6">{error}</p>
            <button
              onClick={fetchResults}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && sorted.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              No results found
            </h2>
            <p className="text-gray-500 mb-2">
              We couldn't find "<strong>{query}</strong>" anywhere.
            </p>
            <p className="text-gray-400 text-sm mb-8">
              Try a different search term or check your spelling.
            </p>
            <Link
              href="/"
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              Back to Home
            </Link>
          </div>
        )}

        {!loading && !error && sorted.length > 0 && (
          <>
            {/* Cheapest callout */}
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-3.5 mb-6 flex items-center gap-3">
              <span className="text-2xl">🏆</span>
              <div>
                <span className="text-sm font-bold text-emerald-800">
                  Cheapest overall:{" "}
                </span>
                <span className="text-sm text-emerald-700">
                  {sorted[0]?.name}
                </span>
                <span className="text-sm text-emerald-500 ml-2 font-semibold">
                  ₹
                  {Math.min(...sorted[0].prices.map((p) => p.price)).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Product grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {sorted.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isCheapest={product.id === cheapestId}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
