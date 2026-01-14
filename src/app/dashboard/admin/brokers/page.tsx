"use client";

import { useEffect, useState } from "react";
import RequireRole from "@/components/auth/RequireRole";

type BrokerRow = {
  id: string;
  email: string;
  displayName: string;
  whatsapp: string;
  createdAt: string | null;
  lastSignInAt: string | null;
};

export default function AdminBrokersPage() {
  const [tick, setTick] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [brokers, setBrokers] = useState<BrokerRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch("/api/admin/brokers")
      .then(async (res) => {
        const json = await res.json().catch(() => null);
        if (!res.ok) throw new Error(json?.error ?? "Impossible de charger les courtiers");
        return json as { ok: true; brokers: BrokerRow[] };
      })
      .then((json) => {
        if (cancelled) return;
        setBrokers(json.brokers);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Erreur");
        setBrokers([]);
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
          <h1 className="text-2xl font-semibold tracking-tight">Courtiers</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Liste des courtiers (Supabase).
          </p>

          {error ? (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="mt-6 space-y-3">
            {brokers.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between gap-4 rounded-2xl border border-black/10 p-4"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">
                    {b.displayName || "—"}
                  </div>
                  <div className="truncate text-xs text-zinc-600">{b.email}</div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    onClick={() => {
                      const ok = window.confirm("Supprimer ce courtier ? (supprime aussi ses annonces)");
                      if (!ok) return;
                      setError(null);
                      fetch(`/api/admin/users?userId=${encodeURIComponent(b.id)}`, { method: "DELETE" })
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
            {!loading && brokers.length === 0 ? (
              <div className="text-sm text-zinc-600">Aucun courtier.</div>
            ) : null}
          </div>
        </div>
      </div>
    </RequireRole>
  );
}
