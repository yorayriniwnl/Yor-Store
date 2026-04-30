// components/PriceSkeleton.tsx

export default function PriceSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm overflow-hidden"
        >
          {/* Image */}
          <div className="w-full h-44 bg-gray-100 rounded-xl animate-pulse mb-4" />

          {/* Badge */}
          <div className="h-5 w-20 bg-gray-100 rounded-full animate-pulse mb-3" />

          {/* Title */}
          <div className="h-4 bg-gray-100 rounded animate-pulse mb-2 w-full" />
          <div className="h-4 bg-gray-100 rounded animate-pulse mb-4 w-3/4" />

          {/* Price row */}
          <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
            <div className="h-7 w-24 bg-gray-100 rounded animate-pulse" />
            <div className="h-9 w-24 bg-gray-100 rounded-xl animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
