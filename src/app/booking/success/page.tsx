import Link from "next/link";

export default function BookingSuccessPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="glass-bright w-full max-w-md rounded-[1.75rem] p-9 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold/15 text-2xl text-gold">
          ✓
        </div>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">
          Request received
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-white/55">
          Thanks — your booking request has been sent to the owner for
          approval. You&apos;ll be contacted shortly to confirm the dates and
          arrange payment and delivery.
        </p>
        <Link href="/" className="btn-primary mt-7 px-6 py-2.5 text-sm">
          Back to portal
        </Link>
      </div>
    </main>
  );
}
