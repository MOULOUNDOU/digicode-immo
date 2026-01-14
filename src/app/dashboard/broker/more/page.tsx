"use client";

import RequireRole from "@/components/auth/RequireRole";

export default function BrokerMorePage() {
  return (
    <RequireRole role="broker">
      <div className="mx-auto w-full max-w-5xl">
        <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold tracking-tight">Plus</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Section en cours (démo). Options supplémentaires à venir.
          </p>
        </div>
      </div>
    </RequireRole>
  );
}
