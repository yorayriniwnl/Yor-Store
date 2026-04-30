import PriceSkeleton from "@/components/PriceSkeleton";

export default function SearchLoading() {
  return (
    <div className="min-h-screen bg-[#f8faf8] font-sans">
      <div className="bg-white border-b border-gray-100 h-16" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <PriceSkeleton />
      </div>
    </div>
  );
}
