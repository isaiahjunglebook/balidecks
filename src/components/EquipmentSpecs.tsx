import { formatUsd, DEPOSIT_CENTS } from "@/lib/pricing";

const GEAR = [
  {
    name: "2× Pioneer CDJ-3000X",
    detail: "Flagship pro players — the industry-standard club decks.",
  },
  {
    name: "Pioneer DJM-A9",
    detail: "4-channel flagship mixer with pristine sound and effects.",
  },
  {
    name: "Studio monitors",
    detail: "Powered monitor speakers so you hear every detail.",
  },
  {
    name: "All cables & power",
    detail: "Everything needed — RCA, power, LAN. Nothing to source.",
  },
];

const INCLUDED = [
  "Delivered to your villa or house",
  "Professionally installed & tuned",
  "On-site tech for setup, support & teardown",
  "Ready to play on arrival",
];

export default function EquipmentSpecs() {
  return (
    <section className="grid gap-6 md:grid-cols-2">
      <div className="glass rounded-[1.5rem] p-7">
        <h2 className="eyebrow">The Setup</h2>
        <ul className="mt-5 space-y-5">
          {GEAR.map((g) => (
            <li key={g.name} className="border-l-2 border-gold/35 pl-4">
              <p className="font-medium tracking-tight">{g.name}</p>
              <p className="mt-0.5 text-sm text-white/50">{g.detail}</p>
            </li>
          ))}
        </ul>
      </div>
      <div className="glass rounded-[1.5rem] p-7">
        <h2 className="eyebrow">Every booking includes</h2>
        <ul className="mt-5 space-y-3.5">
          {INCLUDED.map((i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-white/80">
              <span className="mt-px flex h-5 w-5 flex-none items-center justify-center rounded-full bg-gold/15 text-[11px] text-gold">
                ✓
              </span>
              {i}
            </li>
          ))}
        </ul>
        <div className="mt-7 rounded-2xl border border-white/8 bg-black/25 p-5 text-sm">
          <p className="font-medium text-white/90">
            {formatUsd(DEPOSIT_CENTS)} refundable deposit
          </p>
          <p className="mt-1 leading-relaxed text-white/50">
            Held against damage and returned in full after pickup, gear in
            working order.
          </p>
        </div>
      </div>
    </section>
  );
}
