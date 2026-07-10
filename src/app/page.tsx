import EquipmentSpecs from "@/components/EquipmentSpecs";
import PricingTiers from "@/components/PricingTiers";
import BookingForm from "@/components/BookingForm";
import LogoutButton from "@/components/LogoutButton";

export const dynamic = "force-dynamic";

export default function PortalHome() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-12 sm:py-16">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-400/70">
            Bali · Private Rental
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
            BaliDecks
          </h1>
        </div>
        <LogoutButton scope="client" label="Exit" />
      </header>

      <p className="mt-4 max-w-2xl text-lg text-white/60">
        A complete pro DJ setup — 2× Pioneer CDJ-3000 and a DJM-A9 — delivered,
        installed, and ready to play at your place in Bali.
      </p>

      <div className="mt-14 space-y-16">
        <EquipmentSpecs />
        <PricingTiers />
        <BookingForm />
      </div>

      <footer className="mt-20 border-t border-white/10 pt-6 text-xs text-white/30">
        BaliDecks — private booking portal.
      </footer>
    </div>
  );
}
