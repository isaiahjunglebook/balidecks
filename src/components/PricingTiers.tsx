const TIERS = [
  { label: "Day", price: "$100", per: "per day", note: "Perfect for a single event or session." },
  { label: "Week", price: "$1,000", per: "per week", note: "Great for a residency or a longer stay." },
  { label: "Month", price: "$3,000", per: "per month", note: "Best value for extended bookings." },
];

export default function PricingTiers() {
  return (
    <section>
      <h2 className="text-sm font-semibold uppercase tracking-widest text-amber-400/80">
        Pricing
      </h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {TIERS.map((t) => (
          <div
            key={t.label}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-white/40">
              {t.label}
            </p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">
              {t.price}
            </p>
            <p className="text-sm text-white/40">{t.per}</p>
            <p className="mt-3 text-sm text-white/60">{t.note}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-white/40">
        Delivery, setup & installation included. Final price is confirmed by the
        owner after your request.
      </p>
    </section>
  );
}
