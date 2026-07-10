"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DayPicker, type DateRange } from "react-day-picker";
import "react-day-picker/style.css";
import { estimatePrice, formatUsd, LINE_LABELS } from "@/lib/pricing";
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

  const bookedMatchers = useMemo(
    () =>
      blocked.map((b) => ({
        from: fromDateString(b.start),
        to: fromDateString(b.end),
      })),
    [blocked],
  );

  const disabledMatchers = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return [{ before: today }, ...bookedMatchers];
  }, [bookedMatchers]);

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

  return (
    <section id="book" className="grid gap-6 lg:grid-cols-2">
      <div>
        <h2 className="eyebrow">Choose your dates</h2>
        <div className="glass mt-5 inline-block rounded-[1.5rem] p-5">
          <DayPicker
            mode="range"
            selected={range}
            onSelect={setRange}
            disabled={disabledMatchers}
            modifiers={{ booked: bookedMatchers }}
            modifiersClassNames={{ booked: "rdp-booked" }}
            excludeDisabled
            min={1}
            numberOfMonths={1}
          />
          <div className="mt-3 flex items-center gap-1.5 border-t border-white/8 pt-3 text-[11px] text-white/40">
            <span className="line-through">15</span>
            booked
          </div>
        </div>

        {estimate && (
          <div className="glass-bright mt-5 rounded-[1.5rem] p-6">
            <p className="text-sm text-white/55">
              {estimate.days} {estimate.days === 1 ? "night" : "nights"}
              <span className="mx-2 text-white/20">·</span>
              {startStr} → {endStr}
            </p>
            <p className="mt-2 text-4xl font-semibold tracking-tight">
              {formatUsd(estimate.priceCents)}
              <span className="ml-2.5 text-sm font-normal text-white/40">
                estimated
              </span>
            </p>
            <ul className="mt-4 space-y-1.5 text-xs text-white/55">
              {estimate.breakdown.map((line, i) => (
                <li key={i} className="flex justify-between gap-6">
                  <span>
                    {line.count} × {LINE_LABELS[line.unit]} @{" "}
                    {formatUsd(line.rateCents)}
                  </span>
                  <span className="text-white/75">
                    {formatUsd(line.subtotalCents)}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-4 border-t border-white/8 pt-3 text-xs leading-relaxed text-white/40">
              + {formatUsd(estimate.depositCents)} refundable deposit. On-site
              tech included. Final price confirmed by the owner.
            </p>
          </div>
        )}
      </div>

      <div>
        <h2 className="eyebrow">Your details</h2>
        <form
          onSubmit={submit}
          className="glass mt-5 space-y-4 rounded-[1.5rem] p-6"
        >
          <div>
            <label className="mb-1.5 block text-xs text-white/45">
              Full name
            </label>
            <input
              className="field"
              value={form.customerName}
              onChange={(e) => update("customerName", e.target.value)}
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs text-white/45">
                Email
              </label>
              <input
                type="email"
                className="field"
                value={form.customerEmail}
                onChange={(e) => update("customerEmail", e.target.value)}
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-white/45">
                Phone / WhatsApp
              </label>
              <input
                className="field"
                value={form.customerPhone}
                onChange={(e) => update("customerPhone", e.target.value)}
                required
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-white/45">
              Delivery address (villa / house in Bali)
            </label>
            <input
              className="field"
              value={form.deliveryAddress}
              onChange={(e) => update("deliveryAddress", e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-white/45">
              Notes (optional)
            </label>
            <textarea
              className="field min-h-24 resize-y"
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
            className="btn-primary w-full px-4 py-3.5 text-sm"
          >
            {submitting ? "Sending request…" : "Request booking"}
          </button>
          <p className="text-center text-xs text-white/40">
            Your request goes to the owner for approval. No payment is taken
            now.
          </p>
        </form>
      </div>
    </section>
  );
}
