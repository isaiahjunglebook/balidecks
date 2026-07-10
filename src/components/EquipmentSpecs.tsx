const GEAR = [
  {
    name: "2× Pioneer CDJ-3000",
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
  "Fully set up & installed",
  "Ready to play on arrival",
];

export default function EquipmentSpecs() {
  return (
    <section className="grid gap-8 md:grid-cols-2">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-amber-400/80">
          The Setup
        </h2>
        <ul className="mt-4 space-y-4">
          {GEAR.map((g) => (
            <li key={g.name} className="border-l-2 border-amber-400/30 pl-4">
              <p className="font-medium">{g.name}</p>
              <p className="text-sm text-white/50">{g.detail}</p>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-amber-400/80">
          Every rental includes
        </h2>
        <ul className="mt-4 space-y-3">
          {INCLUDED.map((i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-white/80">
              <span className="mt-0.5 text-amber-400">✓</span>
              {i}
            </li>
          ))}
        </ul>
        <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm">
          <p className="font-medium text-white/90">
            $1,500 refundable deposit
          </p>
          <p className="mt-1 text-white/50">
            Held against damage and returned in full after pickup, gear in
            working order.
          </p>
        </div>
      </div>
    </section>
  );
}
