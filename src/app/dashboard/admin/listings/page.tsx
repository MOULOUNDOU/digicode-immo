"use client";

import { useEffect, useState } from "react";
import RequireRole from "@/components/auth/RequireRole";

type AdminListingRow = {
  id: string;
  owner_user_id: string;
  title: string;
  type: string;
  price_xof: number;
  city: string;
  neighborhood: string;
  created_at: string;
};

export default function AdminListingsPage() {
  const [tick, setTick] = useState(0);
  const [listings, setListings] = useState<AdminListingRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch("/api/admin/listings")
      .then(async (res) => {
        const json = await res.json().catch(() => null);
        if (!res.ok) throw new Error(json?.error ?? "Impossible de charger les annonces");
        return json as { ok: true; listings: AdminListingRow[] };
      })
      .then((json) => {
        if (cancelled) return;
        setListings(json.listings);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Erreur");
        setListings([]);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [tick]);

  return (
    <RequireRole role="admin">
      <div className="mx-auto w-full max-w-5xl">
        <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold tracking-tight">Annonces</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Modération des annonces (Supabase).
          </p>

          {error ? (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="mt-6 space-y-3">
            {listings.map((l) => (
              <div
                key={l.id}
                className="flex items-center justify-between gap-4 rounded-2xl border border-black/10 p-4"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{l.title}</div>
                  <div className="mt-1 text-xs text-zinc-600">
                    {l.city} · {l.neighborhood} · {l.type} · {new Intl.NumberFormat("fr-FR").format(l.price_xof)} FCFA/mois
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <a
                    href={`/listings/${encodeURIComponent(l.id)}`}
                    className="h-10 rounded-2xl border border-black/10 bg-white px-4 text-sm font-semibold text-black hover:bg-zinc-50"
                  >
                    Voir
                  </a>
                  <button
                    onClick={() => {
                      const ok = window.confirm("Supprimer cette annonce ?");
                      if (!ok) return;
                      setError(null);
                      fetch(`/api/admin/listings?id=${encodeURIComponent(l.id)}`, { method: "DELETE" })
                        .then(async (res) => {
                          const json = await res.json().catch(() => null);
                          if (!res.ok) throw new Error(json?.error ?? "Suppression impossible");
                          setTick((t) => t + 1);
                        })
                        .catch((err) => {
                          setError(err instanceof Error ? err.message : "Erreur");
                        });
                    }}
                    className="h-10 rounded-2xl border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 hover:bg-red-50"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}

            {loading ? <div className="text-sm text-zinc-600">Chargement...</div> : null}

            {!loading && listings.length === 0 ? (
              <div className="text-sm text-zinc-600">Aucune annonce.</div>
            ) : null}
          </div>
        </div>
      </div>
    </RequireRole>
  );
}
