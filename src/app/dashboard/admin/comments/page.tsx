"use client";

import RequireRole from "@/components/auth/RequireRole";

export default function AdminCommentsPage() {
  return (
    <RequireRole role="admin">
      <div className="mx-auto w-full max-w-5xl">
        <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold tracking-tight">Commentaires</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Démo: gestion des commentaires.
          </p>
        </div>
      </div>
    </RequireRole>
  );
}
