import { formatUsd, nightRateCents, PRICING } from "@/lib/pricing";

export default function PricingTiers() {
  const standard = formatUsd(nightRateCents("standard"));
  const offpeak = formatUsd(nightRateCents("offpeak"));
  const prime = formatUsd(nightRateCents("prime"));
  const weekly = formatUsd(PRICING.weeklyCents);
  const monthly = formatUsd(PRICING.monthlyCents);

  const tiers = [
    {
      label: "Nightly",
      price: standard,
      per: "per night",
      note: `Off-peak weekdays ${offpeak}. Peak nights — Friday & Saturday in high season — ${prime}.`,
    },
    {
      label: "Weekly",
      price: weekly,
      per: "7 nights",
      highlight: true,
      note: "Around $179 a night — two nights free versus the nightly rate. Prepaid, one villa.",
    },
    {
      label: "Monthly",
      price: monthly,
      per: "30 nights",
      note: "Around $117 a night for the full residency. Prepaid, one location.",
    },
  ];

  return (
    <section>
      <h2 className="eyebrow">Pricing</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {tiers.map((t) => (
          <div
            key={t.label}
            className={`glass relative rounded-[1.5rem] p-6 ${
              t.highlight ? "ring-1 ring-gold/30" : ""
            }`}
          >
            {t.highlight && (
              <span className="absolute right-5 top-5 rounded-full bg-gold/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-gold">
                Popular
              </span>
            )}
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
              {t.label}
            </p>
            <p className="mt-3 text-4xl font-semibold tracking-tight">
              {t.price}
            </p>
            <p className="mt-1 text-sm text-white/40">{t.per}</p>
            <p className="mt-4 text-sm leading-relaxed text-white/55">
              {t.note}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs leading-relaxed text-white/40">
        Every booking includes delivery, professional install and an on-site
        tech. Peak nights are marked with a gold dot on the calendar. Lights
        &amp; speaker packages quoted separately. Final price confirmed by the
        owner.
      </p>
    </section>
  );
}
