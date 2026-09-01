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
    <div className="yor-product-card group relative overflow-hidden flex flex-col">
      {/* Cheapest badge */}
      {isCheapest && (
        <div className="yor-badge-cheapest absolute top-3 left-3 z-10 text-xs font-bold px-2.5 py-1 flex items-center gap-1">
          <span>🏆</span> Cheapest
        </div>
      )}

      {/* Discount badge */}
      {discountPct && discountPct > 0 && (
        <div className="yor-badge-discount absolute top-3 right-3 z-10 text-xs font-bold px-2.5 py-1">
          -{discountPct}%
        </div>
      )}

      {/* Image */}
      <div className="yor-product-image relative h-44 overflow-hidden">
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
            <span className="yor-product-price text-xl font-bold">
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
                className="yor-buy-button text-xs font-semibold px-3 py-2 transition-colors"
              >
                Buy Now
              </a>
            )}
            <Link
              href={`/product/${product.slug}`}
              className="yor-compare-button text-xs font-medium px-3 py-2 transition-colors"
            >
              Compare
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
