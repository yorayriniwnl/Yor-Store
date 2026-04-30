import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#f8faf8] flex items-center justify-center font-sans">
      <div className="text-center">
        <div className="text-6xl mb-4">🛒</div>
        <h1 className="text-3xl font-black text-gray-900 mb-2">Page not found</h1>
        <p className="text-gray-500 mb-6">The product or page you're looking for doesn't exist.</p>
        <Link href="/" className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors">
          Back to Home
        </Link>
      </div>
    </div>
  );
}
