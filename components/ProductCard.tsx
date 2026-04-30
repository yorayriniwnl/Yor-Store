// components/ProductCard.tsx
import Link from "next/link";
import Image from "next/image";
import StoreBadge from "./StoreBadge";

interface StorePrice {
  storeName: string;
  price: number;
  unit: string;
  inStock: boolean;
  affiliateUrl: string | null;
}

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    category: string;
    imageUrl: string | null;
    prices: StorePrice[];
  };
  isCheapest?: boolean;
}

export default function ProductCard({ product, isCheapest }: ProductCardProps) {
  const cheapest = product.prices.reduce(
    (min, p) => (p.price < min.price ? p : min),
    product.prices[0]
  );

  if (!cheapest) return null;

  const hasDiscount = product.prices.length > 1;
  const maxPrice = hasDiscount
    ? Math.max(...product.prices.map((p) => p.price))
    : null;
  const discountPct =
    maxPrice && maxPrice > cheapest.price
      ? Math.round(((maxPrice - cheapest.price) / maxPrice) * 100)
      : null;

  return (
    <div className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-100 transition-all duration-200 overflow-hidden flex flex-col">
      {/* Cheapest badge */}
      {isCheapest && (
        <div className="absolute top-3 left-3 z-10 bg-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
          <span>🏆</span> Cheapest
        </div>
      )}

      {/* Discount badge */}
      {discountPct && discountPct > 0 && (
        <div className="absolute top-3 right-3 z-10 bg-rose-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
          -{discountPct}%
        </div>
      )}

      {/* Image */}
      <div className="relative h-44 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-5xl">
            🛒
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        {/* Store badge */}
        <div className="mb-2">
          <StoreBadge storeName={cheapest.storeName} size="sm" />
        </div>

        {/* Product name */}
        <h3 className="text-sm font-semibold text-gray-800 leading-snug mb-1 line-clamp-2 flex-1">
          {product.name}
        </h3>

        <p className="text-xs text-gray-400 mb-3">{cheapest.unit}</p>

        {/* Price row */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-50">
          <div>
            <span className="text-xl font-bold text-emerald-600">
              ₹{cheapest.price.toFixed(2)}
            </span>
            {maxPrice && maxPrice > cheapest.price && (
              <span className="ml-1.5 text-xs text-gray-400 line-through">
                ₹{maxPrice.toFixed(2)}
              </span>
            )}
          </div>

          <div className="flex gap-2 items-center">
            {cheapest.affiliateUrl && (
              <a
                href={cheapest.affiliateUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
              >
                Buy Now
              </a>
            )}
            <Link
              href={`/product/${product.slug}`}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-medium border border-emerald-200 hover:border-emerald-300 px-3 py-2 rounded-xl transition-colors"
            >
              Compare
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
