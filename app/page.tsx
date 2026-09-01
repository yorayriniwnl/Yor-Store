import Link from "next/link";
import SearchBar from "@/components/SearchBar";

const STORES = [
  { name: "Blinkit", icon: "⚡", state: "EXPERIMENTAL" },
  { name: "BigBasket", icon: "🧺", state: "EXPERIMENTAL" },
  { name: "Zepto", icon: "◉", state: "PLANNED" },
  { name: "Amazon Fresh", icon: "□", state: "PLANNED" },
  { name: "Instamart", icon: "↗", state: "PLANNED" },
];

const STEPS = [
  ["01", "Query", "Enter a grocery item and keep the unit visible so the comparison stays meaningful."],
  ["02", "Compare", "Inspect the returned store, price, unit, stock signal, and any saved history."],
  ["03", "Continue", "Choose a destination only after checking the recorded price and its source boundary."],
];

const TRENDING = ["Amul Butter 500g", "Aashirvaad Atta 10kg", "Organic Eggs 12pcs", "Tata Salt 1kg"];

export default function HomePage() {
  return (
    <div className="yor-store-shell">
      <nav className="yor-store-nav sticky top-0 z-50 border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3 text-[#f5eaea]">
            <span className="grid h-9 w-9 place-items-center border border-[#e84b4b] bg-[#671515] text-[#ff8a7f]">Y</span>
            <span className="font-mono text-sm font-semibold tracking-[.18em]">YOR STORE</span>
          </Link>
          <span className="yor-kicker hidden sm:block">PRICE SIGNAL / v1</span>
        </div>
      </nav>

      <main>
        <section className="yor-store-hero text-center">
          <div className="yor-kicker">YOR // grocery price intelligence</div>
          <h1 className="yor-store-title">Compare the basket.<br /><span>Read the signal.</span></h1>
          <p className="yor-store-copy">A focused surface for comparing grocery prices across configured store sources. Search first; inspect provenance before you continue.</p>
          <div className="yor-store-search"><SearchBar size="large" autoFocus /></div>
          <div className="yor-store-chip-row" aria-label="Recent query examples">
            {TRENDING.map((term) => <Link key={term} href={`/search?q=${encodeURIComponent(term)}`} className="yor-store-chip">{term}</Link>)}
          </div>
        </section>

        <section className="yor-store-section">
          <div className="yor-store-section-inner">
            <div className="yor-kicker">Source registry / declared</div>
            <h2>Where the signal can come from</h2>
            <p className="yor-store-section-copy">The registry keeps configured destinations visible without implying that every connector is live or equally verified.</p>
            <div className="yor-store-grid">
              {STORES.map((store) => (
                <div key={store.name} className="yor-store-tile">
                  <span className="yor-store-tile-icon" aria-hidden="true">{store.icon}</span>
                  <span className="yor-store-tile-name">{store.name}</span>
                  <span className="yor-kicker text-[9px]">{store.state}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="yor-store-section">
          <div className="yor-store-section-inner">
            <div className="yor-kicker">Workflow / three passes</div>
            <h2>Make the next shop legible.</h2>
            <div className="yor-store-steps">
              {STEPS.map(([number, title, description]) => (
                <article key={number} className="yor-store-step">
                  <div className="yor-store-step-num">{number} / {title.toUpperCase()}</div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="yor-store-footer">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-3 px-4 text-xs sm:flex-row sm:px-6">
          <span className="font-mono tracking-[.14em] text-[#ff8a7f]">YOR STORE / DEMO SURFACE</span>
          <span>Prices, stock, affiliate links, and freshness depend on the configured data path.</span>
        </div>
      </footer>
    </div>
  );
}
