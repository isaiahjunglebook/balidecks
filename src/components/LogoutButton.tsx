"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton({
  scope,
  label = "Log out",
}: {
  scope: "client" | "admin";
  label?: string;
}) {
  const router = useRouter();

  async function logout() {
    await fetch(`/api/auth/logout?scope=${scope}`, { method: "POST" });
    router.replace(scope === "admin" ? "/admin/login" : "/login");
    router.refresh();
  }

  return (
    <button
      onClick={logout}
      className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/60 transition hover:bg-white/5 hover:text-white"
    >
      {label}
    </button>
  );
}
