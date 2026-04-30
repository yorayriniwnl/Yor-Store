// app/product/[slug]/page.tsx
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import StoreBadge from "@/components/StoreBadge";
import PriceHistoryChart from "./PriceHistoryChart";

interface StorePrice {
  storeName: string;
  price: number;
  originalPrice: number;
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

interface HistoryPoint { date: string; price: number; }
interface StoreHistory { storeName: string; data: HistoryPoint[]; }

async function getProduct(slug: string): Promise<Product | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/product/${slug}`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.product ?? null;
  } catch {
    return null;
  }
}

async function getHistory(slug: string): Promise<StoreHistory[]> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/product/${slug}/history`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export default async function ProductPage({
  params,
}: {
  params: { slug: string };
}) {
  const [product, history] = await Promise.all([
    getProduct(params.slug),
    getHistory(params.slug),
  ]);

  if (!product) notFound();

  const sorted = [...product.prices].sort((a, b) => a.price - b.price);
  const cheapest = sorted[0];

  return (
    <div className="min-h-screen bg-[#f8faf8] font-sans">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          <Link href="/" className="text-lg font-black text-gray-900">
            Basket<span className="text-emerald-500">Best</span>
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-500 truncate">{product.name}</span>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        {/* Product header */}
        <div className="flex flex-col sm:flex-row gap-8 mb-10">
          <div className="w-full sm:w-52 h-52 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center justify-center flex-shrink-0 overflow-hidden">
            {product.imageUrl ? (
              <Image src={product.imageUrl} alt={product.name} width={180} height={180} className="object-contain p-4" />
            ) : (
              <span className="text-6xl">🛒</span>
            )}
          </div>
          <div className="flex-1 pt-2">
            <span className="inline-block bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full mb-3 border border-emerald-100">
              {product.category}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2">{product.name}</h1>
            <p className="text-gray-500 text-sm mb-4">
              Best price: <span className="text-emerald-600 font-bold text-lg">₹{cheapest?.price.toFixed(2)}</span>
              {cheapest && <span className="ml-2 text-xs text-gray-400">on {cheapest.storeName}</span>}
            </p>
            {cheapest?.affiliateUrl && (
              <a
                href={cheapest.affiliateUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
              >
                Buy for ₹{cheapest.price.toFixed(2)} on {cheapest.storeName} →
              </a>
            )}
          </div>
        </div>

        {/* Price comparison table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-5">Price Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 uppercase tracking-wider border-b border-gray-50">
                  <th className="pb-3 font-semibold">Store</th>
                  <th className="pb-3 font-semibold">Price</th>
                  <th className="pb-3 font-semibold">MRP</th>
                  <th className="pb-3 font-semibold">Unit</th>
                  <th className="pb-3 font-semibold">Stock</th>
                  <th className="pb-3 font-semibold"></th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((price, i) => (
                  <tr
                    key={price.storeName}
                    className={`border-b border-gray-50 last:border-0 ${i === 0 ? "bg-emerald-50/50" : ""}`}
                  >
                    <td className="py-3.5 pr-4">
                      <StoreBadge storeName={price.storeName} size="sm" />
                      {i === 0 && (
                        <span className="ml-2 text-xs font-bold text-emerald-600">Cheapest</span>
                      )}
                    </td>
                    <td className="py-3.5 pr-4 font-bold text-gray-900">₹{price.price.toFixed(2)}</td>
                    <td className="py-3.5 pr-4 text-gray-400 line-through text-xs">
                      {price.originalPrice > price.price ? `₹${price.originalPrice.toFixed(2)}` : "—"}
                    </td>
                    <td className="py-3.5 pr-4 text-gray-500">{price.unit}</td>
                    <td className="py-3.5 pr-4">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${price.inStock ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                        {price.inStock ? "In Stock" : "Out"}
                      </span>
                    </td>
                    <td className="py-3.5">
                      {price.affiliateUrl && (
                        <a
                          href={price.affiliateUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 border border-emerald-200 hover:border-emerald-300 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Buy Now
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Price history chart */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-5">Price History (30 days)</h2>
          <PriceHistoryChart history={history} />
        </div>
      </div>
    </div>
  );
}
