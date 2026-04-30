// app/product/[slug]/loading.tsx
export default function Loading() {
  return (
    <div className="min-h-screen bg-[#f8faf8] font-sans">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        {/* Header skeleton */}
        <div className="flex gap-8 mb-10">
          <div className="w-52 h-52 bg-white rounded-2xl animate-pulse flex-shrink-0" />
          <div className="flex-1 pt-4">
            <div className="h-5 bg-gray-100 rounded animate-pulse w-24 mb-4" />
            <div className="h-8 bg-gray-100 rounded animate-pulse w-3/4 mb-3" />
            <div className="h-5 bg-gray-100 rounded animate-pulse w-1/2 mb-6" />
            <div className="h-10 bg-gray-100 rounded-xl animate-pulse w-44" />
          </div>
        </div>

        {/* Table skeleton */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-8">
          <div className="h-6 bg-gray-100 rounded w-48 animate-pulse mb-6" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex gap-4 py-3 border-b border-gray-50 last:border-0">
              <div className="h-5 bg-gray-100 rounded animate-pulse flex-1" />
              <div className="h-5 bg-gray-100 rounded animate-pulse w-20" />
              <div className="h-5 bg-gray-100 rounded animate-pulse w-20" />
              <div className="h-5 bg-gray-100 rounded animate-pulse w-16" />
            </div>
          ))}
        </div>

        {/* Chart skeleton */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="h-6 bg-gray-100 rounded w-44 animate-pulse mb-6" />
          <div className="h-64 bg-gray-50 rounded-xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}
