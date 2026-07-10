import EquipmentSpecs from "@/components/EquipmentSpecs";
import PricingTiers from "@/components/PricingTiers";
import BookingForm from "@/components/BookingForm";
import LogoutButton from "@/components/LogoutButton";

export const dynamic = "force-dynamic";

export default function PortalHome() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-12 sm:py-16">
      <header className="flex items-start justify-between">
        <div>
          <p className="eyebrow">Bali · Private Rental</p>
          <h1 className="mt-3 text-5xl font-semibold tracking-tight sm:text-6xl">
            BaliDecks
          </h1>
        </div>
        <LogoutButton scope="client" label="Exit" />
      </header>

      <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/60">
        A complete pro DJ setup — 2× Pioneer CDJ-3000X and a DJM-A9 — delivered,
        installed, and run by an on-site tech at your villa in Bali.
      </p>

      <div className="mt-16 space-y-16">
        <EquipmentSpecs />
        <PricingTiers />
        <BookingForm />
      </div>

      <footer className="mt-24 border-t border-white/8 pt-6 text-xs text-white/30">
        BaliDecks — private booking portal.
      </footer>
    </div>
  );
}
