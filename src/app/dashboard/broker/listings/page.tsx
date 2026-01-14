"use client";

import RequireRole from "@/components/auth/RequireRole";

export default function BrokerListingsPage() {
  return (
    <RequireRole role="broker">
      <div className="mx-auto w-full max-w-5xl">
        <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold tracking-tight">Mes annonces</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Ici tu gèreras tes annonces (création, modification, suppression).
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="/dashboard/broker?new=1"
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-yellow-400 px-5 text-sm font-semibold text-black hover:bg-yellow-300"
            >
              Publier une annonce
            </a>
            <a
              href="/dashboard/broker"
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-black/10 bg-white px-5 text-sm font-semibold text-black hover:bg-zinc-50"
            >
              Retour à l’accueil
            </a>
          </div>
        </div>
      </div>
    </RequireRole>
  );
}
