"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DayPicker, type DateRange } from "react-day-picker";
import "react-day-picker/style.css";
import { estimatePrice, formatUsd } from "@/lib/pricing";
import { toDateString, fromDateString } from "@/lib/dates";

interface BlockedRange {
  start: string;
  end: string;
  status: string;
}

export default function BookingForm() {
  const router = useRouter();
  const [range, setRange] = useState<DateRange | undefined>();
  const [blocked, setBlocked] = useState<BlockedRange[]>([]);
  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    deliveryAddress: "",
    notes: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/availability")
      .then((r) => r.json())
      .then((d) => setBlocked(d.ranges ?? []))
      .catch(() => setBlocked([]));
  }, []);

  const disabledMatchers = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return [
      { before: today },
      ...blocked.map((b) => ({
        from: fromDateString(b.start),
        to: fromDateString(b.end),
      })),
    ];
  }, [blocked]);

  const startStr = range?.from ? toDateString(range.from) : "";
  const endStr = range?.to ? toDateString(range.to) : range?.from ? startStr : "";

  const estimate = useMemo(() => {
    if (!startStr || !endStr) return null;
    return estimatePrice(startStr, endStr);
  }, [startStr, endStr]);

  function update(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!startStr || !endStr) {
      setError("Please select your rental dates on the calendar.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          startDate: startStr,
          endDate: endStr,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not submit your request.");
        setSubmitting(false);
        return;
      }
      router.push("/booking/success");
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  const inputCls =
    "w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none transition focus:border-amber-400/60";

  return (
    <section id="book" className="grid gap-8 lg:grid-cols-2">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-amber-400/80">
          Choose your dates
        </h2>
        <div className="mt-4 inline-block rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <DayPicker
            mode="range"
            selected={range}
            onSelect={setRange}
            disabled={disabledMatchers}
            excludeDisabled
            min={1}
            numberOfMonths={1}
          />
        </div>
        {estimate && (
          <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/[0.05] p-4">
            <p className="text-sm text-white/60">
              {estimate.days} {estimate.days === 1 ? "day" : "days"} ·{" "}
              {startStr} → {endStr}
            </p>
            <p className="mt-1 text-2xl font-semibold">
              {formatUsd(estimate.priceCents)}
              <span className="ml-2 text-sm font-normal text-white/40">
                estimated
              </span>
            </p>
            <ul className="mt-2 space-y-1 text-xs text-white/50">
              {estimate.breakdown.map((line, i) => (
                <li key={i}>
                  {line.count} × {line.unit} @ {formatUsd(line.rateCents)} ={" "}
                  {formatUsd(line.subtotalCents)}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-white/40">
              + {formatUsd(estimate.depositCents)} refundable deposit. Final
              price confirmed by the owner.
            </p>
          </div>
        )}
      </div>

      <form onSubmit={submit} className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-amber-400/80">
          Your details
        </h2>
        <div>
          <label className="mb-1 block text-xs text-white/40">Full name</label>
          <input
            className={inputCls}
            value={form.customerName}
            onChange={(e) => update("customerName", e.target.value)}
            required
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-white/40">Email</label>
            <input
              type="email"
              className={inputCls}
              value={form.customerEmail}
              onChange={(e) => update("customerEmail", e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-white/40">
              Phone / WhatsApp
            </label>
            <input
              className={inputCls}
              value={form.customerPhone}
              onChange={(e) => update("customerPhone", e.target.value)}
              required
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs text-white/40">
            Delivery address (villa / house in Bali)
          </label>
          <input
            className={inputCls}
            value={form.deliveryAddress}
            onChange={(e) => update("deliveryAddress", e.target.value)}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-white/40">
            Notes (optional)
          </label>
          <textarea
            className={`${inputCls} min-h-24 resize-y`}
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            placeholder="Event type, setup preferences, anything we should know…"
          />
        </div>

        {error && (
          <p className="text-sm text-red-400" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-amber-400 px-4 py-3 text-sm font-semibold text-black transition hover:bg-amber-300 disabled:opacity-40"
        >
          {submitting ? "Sending request…" : "Request booking"}
        </button>
        <p className="text-center text-xs text-white/40">
          Your request goes to the owner for approval. No payment is taken now.
        </p>
      </form>
    </section>
  );
}
