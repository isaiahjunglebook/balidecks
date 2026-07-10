import { desc } from "drizzle-orm";
import { db } from "@/db";
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
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium">{b.customerName}</p>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                STATUS_STYLES[b.status] ?? ""
              }`}
            >
              {b.status}
            </span>
          </div>
          <p className="mt-1 text-sm text-white/60">
            {b.startDate} → {b.endDate}
            <span className="mx-2 text-white/20">·</span>
            {formatUsd(b.estimatedPriceCents)} est.
            <span className="mx-2 text-white/20">·</span>
            {formatUsd(b.depositCents)} deposit
          </p>
          <p className="mt-2 text-sm text-white/50">
            <a
              href={`mailto:${b.customerEmail}`}
              className="text-amber-400/80 hover:underline"
            >
              {b.customerEmail}
            </a>
            <span className="mx-2 text-white/20">·</span>
            {b.customerPhone}
          </p>
          <p className="mt-1 text-sm text-white/50">📍 {b.deliveryAddress}</p>
          {b.notes && (
            <p className="mt-2 rounded-lg bg-black/30 p-2 text-sm text-white/60">
              “{b.notes}”
            </p>
          )}
        </div>
        <BookingRowActions id={b.id} status={b.status} />
      </div>
    </div>
  );
}

function Section({ title, items }: { title: string; items: Booking[] }) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-white/40">
        {title}{" "}
        <span className="ml-1 text-white/25">({items.length})</span>
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

export default async function AdminDashboard() {
  const rows = await db
    .select()
    .from(bookings)
    .orderBy(desc(bookings.createdAt));

  const pending = rows.filter((b) => b.status === "pending");
  const confirmed = rows.filter((b) => b.status === "confirmed");
  const past = rows.filter(
    (b) => b.status === "declined" || b.status === "cancelled",
  );

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/40">
            Admin
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Bookings
          </h1>
        </div>
        <LogoutButton scope="admin" />
      </header>

      <div className="mt-10 space-y-10">
        <Section title="Pending requests" items={pending} />
        <Section title="Confirmed" items={confirmed} />
        <Section title="Declined / Cancelled" items={past} />
      </div>
    </div>
  );
}
