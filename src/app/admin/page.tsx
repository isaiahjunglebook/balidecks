import { desc } from "drizzle-orm";
import { db, hasDatabase } from "@/db";
import { bookings, type Booking } from "@/db/schema";
import { formatUsd } from "@/lib/pricing";
import BookingRowActions from "@/components/admin/BookingRowActions";
import LogoutButton from "@/components/LogoutButton";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-400/15 text-amber-300",
  confirmed: "bg-emerald-500/15 text-emerald-300",
  declined: "bg-white/10 text-white/50",
  cancelled: "bg-red-400/15 text-red-300",
};

function BookingCard({ b }: { b: Booking }) {
  return (
    <div className="glass rounded-[1.25rem] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <p className="font-medium tracking-tight">{b.customerName}</p>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                STATUS_STYLES[b.status] ?? ""
              }`}
            >
              {b.status}
            </span>
          </div>
          <p className="mt-1.5 text-sm text-white/60">
            {b.startDate} → {b.endDate}
            <span className="mx-2 text-white/20">·</span>
            {formatUsd(b.estimatedPriceCents)} est.
            <span className="mx-2 text-white/20">·</span>
            {formatUsd(b.depositCents)} deposit
          </p>
          <p className="mt-2 text-sm text-white/50">
            <a
              href={`mailto:${b.customerEmail}`}
              className="text-gold/90 hover:underline"
            >
              {b.customerEmail}
            </a>
            <span className="mx-2 text-white/20">·</span>
            {b.customerPhone}
          </p>
          <p className="mt-1 text-sm text-white/50">📍 {b.deliveryAddress}</p>
          {b.notes && (
            <p className="mt-3 rounded-xl bg-black/30 p-3 text-sm leading-relaxed text-white/60">
              “{b.notes}”
            </p>
          )}
        </div>
        <BookingRowActions id={b.id} status={b.status} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass rounded-[1.25rem] p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

function Section({ title, items }: { title: string; items: Booking[] }) {
  return (
    <section>
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
        {title} <span className="ml-1 text-white/25">({items.length})</span>
      </h2>
      {items.length === 0 ? (
        <p className="text-sm text-white/30">Nothing here.</p>
      ) : (
        <div className="space-y-3">
          {items.map((b) => (
            <BookingCard key={b.id} b={b} />
          ))}
        </div>
      )}
    </section>
  );
}

function SetupNotice({ detail }: { detail: string }) {
  return (
    <div className="glass-bright mt-10 rounded-[1.5rem] p-8">
      <h2 className="text-xl font-semibold tracking-tight">
        Database not connected
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-white/55">{detail}</p>
      <ol className="mt-5 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-white/70">
        <li>
          Open the{" "}
          <span className="font-medium text-white/90">balidecks</span> project
          on Vercel and go to the <span className="font-medium">Storage</span>{" "}
          tab.
        </li>
        <li>
          Create a <span className="font-medium">Neon Postgres</span> database
          (free tier is fine) and connect it to this project — this sets{" "}
          <code className="rounded bg-black/40 px-1.5 py-0.5 text-xs">
            DATABASE_URL
          </code>{" "}
          automatically.
        </li>
        <li>
          Redeploy (Deployments → ⋯ → Redeploy). Migrations run during the
          build and this dashboard comes alive.
        </li>
      </ol>
    </div>
  );
}

export default async function AdminDashboard() {
  let rows: Booking[] | null = null;
  let loadError = "";

  if (hasDatabase()) {
    try {
      rows = await db.select().from(bookings).orderBy(desc(bookings.createdAt));
    } catch (err) {
      console.error("admin dashboard query failed", err);
      loadError =
        "The database is configured but the bookings query failed — it may still be provisioning, or migrations haven't run. Redeploy the project and check the Vercel logs if this persists.";
    }
  }

  const pending = rows?.filter((b) => b.status === "pending") ?? [];
  const confirmed = rows?.filter((b) => b.status === "confirmed") ?? [];
  const past =
    rows?.filter((b) => b.status === "declined" || b.status === "cancelled") ??
    [];
  const confirmedValue = confirmed.reduce(
    (acc, b) => acc + b.estimatedPriceCents,
    0,
  );

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <header className="flex items-start justify-between">
        <div>
          <p className="eyebrow">Admin</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">
            Bookings
          </h1>
        </div>
        <LogoutButton scope="admin" />
      </header>

      {rows === null ? (
        <SetupNotice
          detail={
            loadError ||
            "You're logged in, but no database is attached to this deployment yet, so bookings can't be stored or shown. One-time setup:"
          }
        />
      ) : (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <Stat label="Pending" value={String(pending.length)} />
            <Stat label="Confirmed" value={String(confirmed.length)} />
            <Stat label="Confirmed value" value={formatUsd(confirmedValue)} />
          </div>

          <div className="mt-12 space-y-12">
            <Section title="Pending requests" items={pending} />
            <Section title="Confirmed" items={confirmed} />
            <Section title="Declined / Cancelled" items={past} />
          </div>
        </>
      )}
    </div>
  );
}
