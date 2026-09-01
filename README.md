# YOR STORE // price signal

<p align="center"><code>query → compare → inspect → continue</code></p>

YOR STORE is a Next.js reference surface for comparing grocery prices across configured store connectors. It stores product snapshots, exposes search/product/history routes, and keeps affiliate continuation separate from the comparison step.

## Evidence contract

| Surface | State | Boundary |
| --- | --- | --- |
| Search and product UI | `DEMO` | A portfolio-scale client for inspecting the comparison workflow. |
| Prisma data model | `EXPERIMENTAL` | Requires a configured database and generated client. |
| Blinkit / BigBasket connectors | `EXPERIMENTAL` | Connector behavior depends on source availability and should be probed before claims. |
| Zepto / Amazon Fresh / Instamart | `PLANNED` | Shown as destinations in the registry; not evidence of a live connector. |
| Local production build | `VERIFIED` | Packaging check only; it does not prove price freshness or checkout success. |
| Price provenance | `REPORTED` | The UI can display stored source/unit data; freshness and accuracy remain data-path concerns. |

The visual source of truth is [`design/yor-tokens.json`](./design/yor-tokens.json). Check it with `npm run design:check`.

## Workflow

1. Search for a specific item and unit.
2. Compare returned store prices, stock flags, and history where available.
3. Continue to an external destination only after inspecting the recorded signal.

The site does not guarantee that a displayed price is current, that a product is in stock, or that an affiliate destination will complete an order.

## Repository map

```text
app/                         Next.js App Router pages and API routes
components/SearchBar.tsx    Search input, recent-query behavior, navigation
components/ProductCard.tsx  Product comparison and continuation card
scrapers/                   Configured connector implementations
lib/db.ts                   Prisma client boundary
prisma/schema.prisma        Product, store, price, and history model
```

## Run locally

```bash
npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

Open `http://localhost:3000`. Copy `.env.example` to `.env.local` and configure the database/cache values before running persistence or scraper workflows.

## Verification

```bash
npm run design:check
npm run build
```

Run an environment-backed check for the search route, Prisma persistence, scraper sources, affiliate links, and deployed runtime before presenting the app as a live price-comparison service.

## YOR visual system

- void `#000000`, graphite `#050505`
- crimson `#e84b4b`, deep crimson `#671515`, signal `#ff8a7f`
- warm white `#f5eaea`, muted gray `#c4c4c4`
- field gradient `#671515` → `#8c1616` → `#2a0505`
- grid/noise texture, mono annotations, serif hierarchy, and visible source states

This keeps the shopping decision legible: a product, a stored price, and a live checkout are three different claims.
