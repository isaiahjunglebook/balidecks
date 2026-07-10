"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Action = "confirm" | "decline" | "cancel";

export default function BookingRowActions({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<Action | null>(null);
  const [error, setError] = useState("");

  async function act(action: Action) {
    setBusy(action);
    setError("");
    try {
      const res = await fetch(`/api/admin/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Action failed");
        setBusy(null);
        return;
      }
      router.refresh();
    } catch {
      setError("Action failed");
      setBusy(null);
    }
  }

  const btn =
    "rounded-md px-3 py-1.5 text-xs font-medium transition disabled:opacity-40";

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        {status === "pending" && (
          <>
            <button
              onClick={() => act("confirm")}
              disabled={busy !== null}
              className={`${btn} bg-emerald-500/90 text-black hover:bg-emerald-400`}
            >
              {busy === "confirm" ? "…" : "Approve"}
            </button>
            <button
              onClick={() => act("decline")}
              disabled={busy !== null}
              className={`${btn} border border-white/15 text-white/70 hover:bg-white/5`}
            >
              {busy === "decline" ? "…" : "Decline"}
            </button>
          </>
        )}
        {status === "confirmed" && (
          <button
            onClick={() => act("cancel")}
            disabled={busy !== null}
            className={`${btn} border border-red-400/30 text-red-300 hover:bg-red-400/10`}
          >
            {busy === "cancel" ? "…" : "Cancel booking"}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
