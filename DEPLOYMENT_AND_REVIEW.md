# BasketBest — Vercel Deployment & Code Review Guide

---

## Part A — Vercel Deployment (Step by Step)

### 1. Push your code to GitHub

```bash
git init            # if not already a repo
git add .
git commit -m "chore: initial BasketBest commit"
gh repo create basketbest --public --source=. --push
# or push to an existing remote:
# git remote add origin https://github.com/you/basketbest.git
# git push -u origin main
```

Make sure `.env.local` is in `.gitignore` — it should never be committed.

---

### 2. Import the repo on Vercel

1. Go to **vercel.com** → **Add New Project**
2. Click **Import Git Repository**, select your `basketbest` repo
3. Framework preset will auto-detect **Next.js** — leave it as-is
4. **Do not deploy yet** — set environment variables first (next step)

---

### 3. Set environment variables

In **Project Settings → Environment Variables**, add all of the following.
Set scope to **Production + Preview + Development** unless noted otherwise.

| Variable | Value | Where to find it |
|---|---|---|
| `DATABASE_URL` | `postgresql://postgres.[REF]:[PASS]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true` | Supabase → Settings → Database → Connection string → **Transaction** mode |
| `DIRECT_URL` | `postgresql://postgres.[REF]:[PASS]@db.[REF].supabase.co:5432/postgres` | Supabase → Settings → Database → Connection string → **Session** mode |
| `UPSTASH_REDIS_REST_URL` | `https://[endpoint].upstash.io` | Upstash Console → your DB → REST API |
| `UPSTASH_REDIS_REST_TOKEN` | `AX...` | Upstash Console → your DB → REST API |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` | Set after first deploy; update once custom domain is added |
| `CRON_SECRET` | Any strong random string (e.g. `openssl rand -hex 32`) | Generate locally, store securely |

> **Tip:** `NEXT_PUBLIC_APP_URL` is used by the search route to call
> `/api/scrape` internally. Set it to your Vercel deployment URL (or
> custom domain). Vercel also exposes `VERCEL_URL` automatically, but it
> changes per deployment — use your stable URL here.

---

### 4. Configure Supabase connection pooling for serverless

Serverless functions spin up and tear down per request, which can exhaust
Postgres connection limits quickly. PgBouncer (Supabase's built-in pooler)
solves this.

**Your `DATABASE_URL` must end with `?pgbouncer=true`** — already included
in the template above.

In `prisma/schema.prisma` make sure both URLs are set:
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")   // pooled — used at runtime
  directUrl = env("DIRECT_URL")     // direct — used only for migrations
}
```

Run migrations from your local machine or CI (never inside a serverless
function):
```bash
npx prisma migrate deploy
```

---

### 5. Configure Upstash Redis for edge/serverless

Upstash Redis uses an HTTP REST API — no persistent TCP connection needed,
making it ideal for serverless and edge functions.

The `@upstash/redis` package reads `UPSTASH_REDIS_REST_URL` and
`UPSTASH_REDIS_REST_TOKEN` automatically via `Redis.fromEnv()`. No further
configuration is required as long as those env vars are set.

To verify the connection is working after deploy:
```bash
curl -X GET "https://your-app.vercel.app/api/search?q=milk"
```
A `fromCache: false` on first call and `fromCache: true` on a second call
confirms Redis is operating correctly.

---

### 6. Set up the Vercel cron job

The `vercel.json` at the repo root already declares the cron:

```json
{
  "crons": [
    {
      "path": "/api/cron/scrape",
      "schedule": "*/30 * * * *"
    }
  ]
}
```

This calls `GET /api/cron/scrape` every 30 minutes. That route:
1. Fetches the 10 most-searched queries from `search_history`
2. Calls `POST /api/scrape` for each query sequentially
3. Returns a summary of results

**Cron auth:** Vercel sets `Authorization: Bearer <CRON_SECRET>` automatically
when invoking cron routes. The route checks this header so external callers
cannot trigger it.

> Cron jobs run on the **Pro plan** and above. On the Hobby plan you can
> trigger scrapes manually via `POST /api/scrape` or use an external scheduler
> (GitHub Actions, etc.).

---

### 7. Deploy

Click **Deploy** in the Vercel dashboard (or push to `main` — Vercel will
auto-deploy on every push).

**Post-deploy checklist:**
- [ ] Update `NEXT_PUBLIC_APP_URL` to your actual deployment URL
- [ ] Run `npx prisma migrate deploy` to apply DB migrations
- [ ] Run `npx prisma db seed` if you want seed data
- [ ] Test `GET /api/search?q=milk` — should return results or trigger scrape
- [ ] Test `POST /api/scrape` with `{ "query": "eggs" }` — should return `{ success: true }`
- [ ] Check Vercel → Functions log for any errors

---

## Part B — Code Review & Fixes

### Issue 1 — Missing try/catch on DB queries in `/api/search/route.ts`

**Problem:** The `queryDb()` call and `isStale()` check have no outer
error handler. A DB connection error would return a 500 with Next.js's
default unhandled-error page.

**Fix:** Wrap the DB path in a try/catch:

```ts
// In app/api/search/route.ts — replace the DB query section

let rawProducts: Awaited<ReturnType<typeof queryDb>> = [];
try {
  rawProducts = await queryDb(query);
} catch (err) {
  console.error("[search] DB query error:", err);
  return NextResponse.json(
    { error: "Database error. Please try again." },
    { status: 500 }
  );
}
```

---

### Issue 2 — Prisma client initialised correctly ✅

`lib/db.ts` already uses the recommended Next.js singleton pattern:

```ts
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ?? new PrismaClient({ log: [...] });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
```

This prevents connection pool exhaustion during hot-reload in development.
No changes needed.

---

### Issue 3 — TypeScript `any` types to fix

**In `scrapers/manager.ts`** — the `body` variable in `triggerScrape` is
typed implicitly as `any` when parsed. Fix:

```ts
// Before
const data = await res.json().catch(() => ({}));

// After — give it a minimal type
const data = await res.json().catch(() => ({} as { resultsCount?: number }));
console.log(`[search] triggerScrape OK — ${data.resultsCount ?? "?"} results`);
```

**In `app/api/scrape/route.ts`** — `body` is typed as `unknown` ✅ (already
handled correctly via the Zod parse).

**In `app/api/search/route.ts`** — the `RawProduct` type alias uses
`ReturnType<typeof queryDb>` which is fully typed. ✅

Run `npx tsc --noEmit` after every change to catch remaining `any` types:

```bash
npx tsc --noEmit
```

---

### Issue 4 — Redis connection reused across requests ✅

Both `Redis.fromEnv()` calls in `app/api/search/route.ts` and
`app/api/scrape/route.ts` are declared at **module scope** (outside the
handler function). Node.js caches modules, so the same `Redis` instance
is reused across warm invocations. No changes needed.

```ts
// ✅ Module-level — reused across requests in the same warm Lambda
const redis = Redis.fromEnv();
```

---

### Issue 5 — Environment variable validation at startup

Add a startup validator so missing vars fail loudly at build time rather
than silently at runtime. Create `lib/env.ts`:

```ts
// lib/env.ts
const REQUIRED_ENV_VARS = [
  "DATABASE_URL",
  "DIRECT_URL",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "NEXT_PUBLIC_APP_URL",
] as const;

export function validateEnv(): void {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `[BasketBest] Missing required environment variables:\n  ${missing.join("\n  ")}\n` +
        `Copy .env.example → .env.local and fill in all values.`
    );
  }
}
```

Then call it in `next.config.ts` so it runs at build time:

```ts
// next.config.ts
import { validateEnv } from "./lib/env";

validateEnv(); // throws during `next build` or `next dev` if vars are missing

const nextConfig = {
  // ...your existing config
};

export default nextConfig;
```

---

### Issue 6 — External affiliate links missing `rel="noopener noreferrer"` in `ProductCard.tsx`

**Status:** ✅ Already correct in the uploaded `ProductCard.tsx`:

```tsx
<a
  href={cheapest.affiliateUrl}
  target="_blank"
  rel="noopener noreferrer"   // ← present
  className="..."
>
  Buy Now
</a>
```

No changes needed. Verify no other `target="_blank"` links exist in your
codebase without the `rel` attribute:

```bash
grep -rn 'target="_blank"' app/ components/ | grep -v 'noopener'
```

The output should be empty. If not, add `rel="noopener noreferrer"` to each
result.

---

## Summary Table

| # | Issue | Status | Action |
|---|---|---|---|
| 1 | try/catch on all API route DB calls | ⚠️ Partial | Add try/catch around `queryDb()` call |
| 2 | Prisma singleton pattern | ✅ Done | No change |
| 3 | TypeScript `any` types | ⚠️ Minor | Fix `res.json()` return type in `triggerScrape` |
| 4 | Redis connection reused | ✅ Done | No change |
| 5 | Env var validation at startup | ❌ Missing | Add `lib/env.ts` + call in `next.config.ts` |
| 6 | `rel="noopener noreferrer"` on affiliate links | ✅ Done | Run grep to confirm no others exist |
