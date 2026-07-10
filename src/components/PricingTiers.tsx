import { formatUsd, PRICING } from "@/lib/pricing";

export default function PricingTiers() {
  const nightly = formatUsd(PRICING.baseNightlyCents);
  const weekly = formatUsd(PRICING.weeklyCents);
  const monthly = formatUsd(PRICING.monthlyCents);

  const tiers = [
    {
      label: "Nightly",
      price: nightly,
      per: "per night",
      note: "One flat rate, any night of the year. Delivery, install and an on-site tech included.",
    },
    {
      label: "Weekly",
      price: weekly,
      per: "7 nights",
      highlight: true,
      note: "Around $214 a night — well under half the nightly rate. Prepaid, one villa.",
    },
    {
      label: "Monthly",
      price: monthly,
      per: "30 nights",
      note: "Around $133 a night for the full residency. Prepaid, one location.",
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
        tech. Lights &amp; speaker packages quoted separately. Final price
        confirmed by the owner.
      </p>
    </section>
  );
}
