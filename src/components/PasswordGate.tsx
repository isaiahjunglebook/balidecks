"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  endpoint: string;
  redirectTo: string;
  title: string;
  subtitle: string;
  accent?: "gold" | "slate";
}

export default function PasswordGate({
  endpoint,
  redirectTo,
  title,
  subtitle,
  accent = "gold",
}: Props) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Incorrect password");
        setLoading(false);
        return;
      }
      router.replace(redirectTo);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  const btn =
    accent === "gold"
      ? "bg-amber-400 text-black hover:bg-amber-300"
      : "bg-slate-200 text-black hover:bg-white";

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.03] p-8 shadow-2xl"
      >
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-white/50">{subtitle}</p>

        <label className="mt-6 block text-xs font-medium uppercase tracking-wide text-white/40">
          Password
        </label>
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-2 w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none transition focus:border-amber-400/60"
          placeholder="••••••••"
        />

        {error && (
          <p className="mt-3 text-sm text-red-400" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !password}
          className={`mt-6 w-full rounded-lg px-4 py-3 text-sm font-semibold transition disabled:opacity-40 ${btn}`}
        >
          {loading ? "Checking…" : "Enter"}
        </button>
      </form>
    </main>
  );
}
