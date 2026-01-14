"use client";

export default function DashboardError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Erreur Dashboard</h1>
        <p className="mt-2 text-sm text-zinc-600">
          {error.message}
        </p>
        <p className="mt-4 text-sm text-zinc-600">
          Vérifie que ton fichier <code>.env.local</code> contient les variables Supabase.
        </p>
      </div>
    </div>
  );
}
