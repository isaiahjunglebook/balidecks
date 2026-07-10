# BaliDecks — Private DJ Rental Booking Portal

A private, password-gated booking portal for renting a complete pro DJ setup in
Bali (2× Pioneer CDJ-3000 + DJM-A9, monitors, and cables) — delivered, set up,
and installed. Clients view live availability and request dates; the owner
approves or declines each request from a private admin dashboard.

- **Pricing:** $100/day · $1,000/week · $3,000/month (package tiers). $1,500
  refundable deposit.
- **Payment:** arranged offline — no card processing on the site.
- **Access:** one shared password for clients + a separate admin password for the owner.

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind CSS v4
- Neon serverless Postgres + Drizzle ORM
- Signed httpOnly cookie sessions (`jose`)
- `react-day-picker` availability calendar

## How it works

| Route | Access | Purpose |
| --- | --- | --- |
| `/login` | public | Client password gate |
| `/` | client | Equipment, pricing, calendar + booking request form |
| `/booking/success` | client | Request-received confirmation |
| `/admin/login` | public | Owner password gate |
| `/admin` | admin | Approve / decline / cancel bookings |

Bookings are stored `pending` and only block the public calendar once the owner
approves them (`confirmed`). Overlapping requests are soft-held, and a Postgres
exclusion constraint (`btree_gist`) guarantees two confirmed bookings can never
overlap.

## Local development

Requires Node 22+ and a Postgres database.

```bash
npm install
cp .env.example .env.local   # fill in the values
npm run db:migrate           # apply migrations (uses DATABASE_URL_UNPOOLED)
npm run dev                  # http://localhost:3000
```

Run the pricing unit tests:

```bash
npm run test:pricing
```

The DB client auto-selects its driver: a `*.neon.tech` `DATABASE_URL` uses the
Neon serverless HTTP driver (production); any other Postgres URL uses a standard
`pg` connection (local dev).

## Environment variables

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | yes | Pooled Neon connection string (injected by the Vercel + Neon integration). |
| `DATABASE_URL_UNPOOLED` | for migrations | Direct Neon connection string; used by `drizzle-kit migrate` at build time. Falls back to `DATABASE_URL` if unset. |
| `CLIENT_PASSWORD` | yes | Shared password clients type to enter the portal. |
| `ADMIN_PASSWORD` | yes | Private password for the owner's admin dashboard. |
| `SESSION_SECRET` | yes | 32+ random chars for signing cookies. Generate with `openssl rand -base64 48`. |

## Deploying to Vercel (owner runbook)

The app is ready to deploy. Two of these steps are dashboard clicks that only
you can do (billing/provisioning); the rest is automated.

1. **Import the repo into Vercel.** New Project → import `isaiahjunglebook/balidecks`.
   Framework preset is auto-detected as Next.js. The first build will succeed but
   the app won't work until the database and passwords exist (steps 2–3).

2. **Provision the database (dashboard).** In your Vercel project:
   Storage → Marketplace → **Neon** → Create → attach it to this project.
   This automatically injects `DATABASE_URL` and `DATABASE_URL_UNPOOLED` into the
   project's environment variables.

3. **Set the three secrets (dashboard).** Project → Settings → Environment
   Variables, add for **Production** (and Preview if you want):
   - `CLIENT_PASSWORD` — the password you'll give clients
   - `ADMIN_PASSWORD` — your private admin password
   - `SESSION_SECRET` — a long random string (`openssl rand -base64 48`)

4. **Redeploy.** Trigger a new deployment (Deployments → ⋯ → Redeploy, or push a
   commit). The build runs `drizzle-kit migrate && next build`, so the database
   tables and the no-overlap constraint are created automatically on deploy.

5. **Verify.** Open `/login` (client password) and `/admin/login` (admin
   password). Submit a test booking, approve it from `/admin`, and confirm those
   dates become blocked on the calendar.

To change a password later, edit the env var in Vercel and redeploy. (Existing
login sessions remain valid until their 30-day cookie expires.)
