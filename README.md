# 🧺 BasketBest

Compare grocery prices across **Blinkit, Zepto, BigBasket, Amazon Fresh & Instamart** in real-time.

## Project Structure

```
BasketBest/
├── app/
│   ├── page.tsx                          ← Home page
│   ├── layout.tsx                        ← Root layout
│   ├── globals.css                       ← Global styles
│   ├── not-found.tsx                     ← 404 page
│   ├── search/
│   │   ├── page.tsx                      ← Search results page
│   │   ├── layout.tsx                    ← Suspense wrapper
│   │   └── loading.tsx                   ← Search loading skeleton
│   ├── product/[slug]/
│   │   ├── page.tsx                      ← Product detail page
│   │   ├── loading.tsx                   ← Product loading skeleton
│   │   └── PriceHistoryChart.tsx         ← Recharts price chart
│   └── api/
│       ├── search/route.ts               ← GET /api/search?q=
│       ├── scrape/route.ts               ← POST /api/scrape
│       └── product/[slug]/
│           ├── route.ts                  ← GET /api/product/:slug
│           └── history/route.ts          ← GET /api/product/:slug/history
├── components/
│   ├── SearchBar.tsx                     ← Debounced search with recent history
│   ├── ProductCard.tsx                   ← Price card with Buy Now button
│   ├── StoreBadge.tsx                    ← Colour-coded store pill
│   └── PriceSkeleton.tsx                 ← Loading skeleton grid
├── scrapers/
│   ├── base.ts                           ← Abstract base scraper
│   ├── blinkit.ts                        ← Blinkit scraper
│   ├── bigbasket.ts                      ← BigBasket scraper
│   └── manager.ts                        ← Runs all scrapers in parallel
├── lib/
│   └── db.ts                             ← Prisma singleton client
├── prisma/
│   ├── schema.prisma                     ← Database schema
│   └── seed.ts                           ← Seed stores + sample products
├── .env.example                          ← All required environment variables
├── vercel.json                           ← Vercel cron job config
├── DEPLOYMENT_AND_REVIEW.md              ← Full deployment guide
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment variables
```bash
cp .env.example .env.local
# Fill in your Supabase, Upstash, and other values
```

### 3. Set up the database
```bash
npm run db:generate
npm run db:push
npm run db:seed
```

### 4. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), Tailwind CSS, Recharts |
| Backend | Next.js API Routes |
| Database | PostgreSQL via Supabase + Prisma ORM |
| Cache | Redis via Upstash |
| Scrapers | Fetch-based (Blinkit, BigBasket) |
| Deployment | Vercel |

## Deployment

See `DEPLOYMENT_AND_REVIEW.md` for full step-by-step deployment instructions.
