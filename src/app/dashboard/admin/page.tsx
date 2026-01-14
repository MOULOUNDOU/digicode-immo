"use client";

import RequireRole from "@/components/auth/RequireRole";

export default function AdminDashboardPage() {
  return (
    <RequireRole role="admin">
      <div className="mx-auto w-full max-w-5xl">
        <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard Admin</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Gestion des utilisateurs, courtiers, annonces et commentaires.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <a
              href="/dashboard/admin/users"
              className="rounded-2xl border border-black/10 p-4 hover:bg-zinc-50"
            >
              <div className="text-sm font-semibold">Utilisateurs</div>
              <div className="mt-1 text-sm text-zinc-600">
                Voir / activer / suspendre / supprimer.
              </div>
            </a>
            <a
              href="/dashboard/admin/listings"
              className="rounded-2xl border border-black/10 p-4 hover:bg-zinc-50"
            >
              <div className="text-sm font-semibold">Annonces</div>
              <div className="mt-1 text-sm text-zinc-600">
                Approver / éditer / supprimer.
              </div>
            </a>
          </div>
        </div>
      </div>
    </RequireRole>
  );
}
