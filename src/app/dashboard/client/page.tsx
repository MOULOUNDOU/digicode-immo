"use client";

import RequireRole from "@/components/auth/RequireRole";

export default function ClientDashboardPage() {
  return (
    <RequireRole>
      <div className="mx-auto w-full max-w-5xl">
        <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard Client</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Tes favoris (likes), tes commentaires, et tes contacts.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <a
              href="/dashboard/client/favorites"
              className="rounded-2xl border border-black/10 p-4 hover:bg-zinc-50"
            >
              <div className="text-sm font-semibold">Favoris</div>
              <div className="mt-1 text-sm text-zinc-600">
                Retrouve les annonces que tu as aimées.
              </div>
            </a>
            <a
              href="/dashboard/client/comments"
              className="rounded-2xl border border-black/10 p-4 hover:bg-zinc-50"
            >
              <div className="text-sm font-semibold">Commentaires</div>
              <div className="mt-1 text-sm text-zinc-600">
                Suivre tes discussions avec les courtiers.
              </div>
            </a>
          </div>
        </div>
      </div>
    </RequireRole>
  );
}
