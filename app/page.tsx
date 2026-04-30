// app/page.tsx
import Link from "next/link";
import SearchBar from "@/components/SearchBar";

const STORES = [
  { name: "Blinkit", emoji: "⚡", color: "from-amber-400 to-yellow-300", bg: "bg-amber-50" },
  { name: "Zepto", emoji: "🟣", color: "from-purple-500 to-violet-400", bg: "bg-purple-50" },
  { name: "BigBasket", emoji: "🧺", color: "from-emerald-500 to-green-400", bg: "bg-emerald-50" },
  { name: "Amazon Fresh", emoji: "📦", color: "from-blue-500 to-sky-400", bg: "bg-blue-50" },
  { name: "Instamart", emoji: "🛵", color: "from-orange-500 to-red-400", bg: "bg-orange-50" },
];

const STEPS = [
  {
    icon: "🔍",
    title: "Search any item",
    desc: "Type a grocery item — atta, milk, fruits, veggies — and we search across every platform simultaneously.",
    step: "01",
  },
  {
    icon: "📊",
    title: "Compare instantly",
    desc: "See real-time prices from Blinkit, Zepto, BigBasket, Amazon Fresh and Instamart side-by-side.",
    step: "02",
  },
  {
    icon: "💸",
    title: "Save every time",
    desc: "Tap 'Buy Now' on the cheapest option and get redirected straight to checkout — no extra steps.",
    step: "03",
  },
];

const TRENDING = [
  "Amul Butter 500g", "Aashirvaad Atta 10kg", "Organic Eggs 12pcs",
  "Saffola Gold Oil 2L", "Tata Salt 1kg", "Haldiram Bhujia 400g",
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#f8faf8] font-sans">
      {/* ─── Navbar ─── */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="text-2xl">🧺</span>
            <span className="text-xl font-black text-gray-900">
              Basket<span className="text-emerald-500">Best</span>
            </span>
          </Link>

          <div className="hidden sm:flex items-center gap-8">
            <Link
              href="/"
              className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              Home
            </Link>
            <a
              href="#how-it-works"
              className="text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors"
            >
              How it works
            </a>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-emerald-100 rounded-full opacity-40 blur-3xl" />
          <div className="absolute top-40 -left-16 w-72 h-72 bg-lime-100 rounded-full opacity-50 blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 pt-20 pb-16 text-center">
          {/* Pill badge */}
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            Live prices from 5 platforms
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-gray-900 leading-tight tracking-tight mb-5">
            Compare Grocery Prices{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-lime-500">
              Across All Apps
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            Find the cheapest price on Blinkit, Zepto, BigBasket instantly.
            Save money on every grocery run — guaranteed.
          </p>

          {/* Search bar */}
          <div className="max-w-2xl mx-auto mb-6">
            <SearchBar size="large" autoFocus />
          </div>

          {/* Trending pills */}
          <div className="flex flex-wrap justify-center gap-2">
            <span className="text-sm text-gray-400 flex items-center">Trending:</span>
            {TRENDING.map((term) => (
              <Link
                key={term}
                href={`/search?q=${encodeURIComponent(term)}`}
                className="text-sm bg-white border border-gray-200 text-gray-600 hover:border-emerald-300 hover:text-emerald-700 px-3 py-1 rounded-full transition-colors"
              >
                {term}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Store logos ─── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-16">
        <p className="text-center text-sm text-gray-400 font-medium mb-6 uppercase tracking-widest">
          Prices from
        </p>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 sm:gap-4">
          {STORES.map((store) => (
            <div
              key={store.name}
              className={`${store.bg} rounded-2xl p-4 flex flex-col items-center gap-2 border border-white shadow-sm`}
            >
              <span className="text-3xl">{store.emoji}</span>
              <span className="text-xs font-semibold text-gray-700 text-center leading-tight">
                {store.name}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section
        id="how-it-works"
        className="bg-white border-y border-gray-100 py-20"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3">
              How it works
            </h2>
            <p className="text-gray-500 max-w-lg mx-auto">
              Three simple steps to always get the best deal on your groceries.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 relative">
            {/* Connecting line (desktop) */}
            <div className="hidden sm:block absolute top-10 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-emerald-200 via-emerald-300 to-emerald-200 z-0" />

            {STEPS.map((step) => (
              <div key={step.step} className="relative z-10 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-50 to-lime-50 border-2 border-emerald-100 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-5 shadow-sm">
                  {step.icon}
                </div>
                <div className="text-xs font-black text-emerald-400 tracking-widest mb-2 uppercase">
                  Step {step.step}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed max-w-xs mx-auto">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4">
            Ready to save on your next shop?
          </h2>
          <p className="text-gray-500 mb-8">
            Join thousands of smart shoppers who never overpay for groceries.
          </p>
          <div className="max-w-xl mx-auto">
            <SearchBar placeholder="Try searching 'onions 1kg'…" />
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-gray-100 bg-white py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🧺</span>
            <span className="font-black text-gray-900">
              Basket<span className="text-emerald-500">Best</span>
            </span>
          </div>
          <p className="text-sm text-gray-400 text-center">
            Prices updated in real-time. We may earn a small commission on purchases.
          </p>
          <div className="flex gap-6 text-sm text-gray-400">
            <a href="#" className="hover:text-gray-600 transition-colors">Privacy</a>
            <a href="#" className="hover:text-gray-600 transition-colors">Terms</a>
            <a href="#" className="hover:text-gray-600 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
