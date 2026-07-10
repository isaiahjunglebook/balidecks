import Link from "next/link";

export default function BookingSuccessPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-400/15 text-2xl text-amber-400">
          ✓
        </div>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight">
          Request received
        </h1>
        <p className="mt-2 text-sm text-white/60">
          Thanks — your booking request has been sent to the owner for approval.
          You&apos;ll be contacted shortly to confirm the dates and arrange
          payment and delivery.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-lg bg-amber-400 px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-amber-300"
        >
          Back to portal
        </Link>
      </div>
    </main>
  );
}
