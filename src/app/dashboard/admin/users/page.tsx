"use client";

import { useEffect, useMemo, useState } from "react";
import RequireRole from "@/components/auth/RequireRole";

type UserRole = "admin" | "broker" | "client";

type AdminUserRow = {
  id: string;
  email: string;
  role: UserRole;
  displayName: string;
  whatsapp: string;
  phone: string;
  city: string;
  avatarUrl: string;
  createdAt: string | null;
  lastSignInAt: string | null;
};

type AdminListingRow = {
  id: string;
  owner_user_id: string;
  title: string;
  type: string;
  price_xof: number;
  city: string;
  neighborhood: string;
  photo_data_urls: string[];
  created_at: string;
};

export default function AdminUsersPage() {
  const [tick, setTick] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [listings, setListings] = useState<AdminListingRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      fetch("/api/admin/users").then(async (res) => {
        const json = await res.json().catch(() => null);
        if (!res.ok) throw new Error(json?.error ?? "Impossible de charger les utilisateurs");
        return json as { ok: true; users: AdminUserRow[] };
      }),
      fetch("/api/admin/listings").then(async (res) => {
        const json = await res.json().catch(() => null);
        if (!res.ok) throw new Error(json?.error ?? "Impossible de charger les annonces");
        return json as { ok: true; listings: AdminListingRow[] };
      }),
    ])
      .then(([usersJson, listingsJson]) => {
        if (cancelled) return;
        setUsers(usersJson.users);
        setListings(listingsJson.listings);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Erreur");
        setUsers([]);
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

  const rows = useMemo(() => users, [users]);
  const listingsByOwner = useMemo(() => {
    const map = new Map<string, AdminListingRow[]>();
    for (const l of listings) {
      const key = String(l.owner_user_id);
      const arr = map.get(key) ?? [];
      arr.push(l);
      map.set(key, arr);
    }
    return map;
  }, [listings]);

  return (
    <RequireRole role="admin">
      <div className="mx-auto w-full max-w-5xl">
        <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold tracking-tight">Utilisateurs</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Gestion Supabase: modifier rôle et supprimer.
          </p>

          {error ? (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="mt-6 overflow-hidden rounded-2xl border border-black/10">
            <div className="divide-y divide-black/10">
              {rows.map((r) => (
                <div key={r.id} className="px-4 py-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-black/10 bg-zinc-100">
                        {r.avatarUrl ? (
                          <img
                            src={r.avatarUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">{r.displayName || "—"}</div>
                        <div className="truncate text-xs text-zinc-600">{r.email}</div>
                        <div className="mt-1 text-xs text-zinc-600">
                          {(r.phone || r.whatsapp || r.city)
                            ? [r.phone, r.whatsapp, r.city].filter(Boolean).join(" · ")
                            : "—"}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 md:items-end">
                      <select
                        value={r.role}
                        onChange={(e) => {
                          const nextRole = e.target.value as UserRole;
                          setError(null);
                          fetch("/api/admin/users", {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ userId: r.id, role: nextRole }),
                          })
                            .then(async (res) => {
                              const json = await res.json().catch(() => null);
                              if (!res.ok) throw new Error(json?.error ?? "Impossible de modifier le rôle");
                              setTick((t) => t + 1);
                            })
                            .catch((err) => {
                              setError(err instanceof Error ? err.message : "Erreur");
                              setTick((t) => t + 1);
                            });
                        }}
                        className="h-10 w-full rounded-2xl border border-black/10 bg-white px-3 text-sm outline-none focus:border-yellow-400 md:w-40"
                      >
                        <option value="client">client</option>
                        <option value="broker">broker</option>
                        <option value="admin">admin</option>
                      </select>

                      <button
                        onClick={() => {
                          const ok = window.confirm("Supprimer cet utilisateur ?");
                          if (!ok) return;
                          setError(null);
                          fetch(`/api/admin/users?userId=${encodeURIComponent(r.id)}`, { method: "DELETE" })
                            .then(async (res) => {
                              const json = await res.json().catch(() => null);
                              if (!res.ok) throw new Error(json?.error ?? "Impossible de supprimer l’utilisateur");
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

                  <div className="mt-4">
                    <div className="text-xs font-semibold text-zinc-600">Annonces</div>
                    <div className="mt-2 space-y-2">
                      {(listingsByOwner.get(r.id) ?? []).map((l) => {
                        const thumb = Array.isArray(l.photo_data_urls) ? l.photo_data_urls[0] : "";
                        return (
                          <div
                            key={l.id}
                            className="flex items-center justify-between gap-3 rounded-2xl border border-black/10 p-3"
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="h-12 w-16 shrink-0 overflow-hidden rounded-xl border border-black/10 bg-zinc-100">
                                {thumb ? (
                                  <img src={thumb} alt="" className="h-full w-full object-cover" />
                                ) : null}
                              </div>
                              <div className="min-w-0">
                                <div className="truncate text-sm font-semibold">{l.title}</div>
                                <div className="mt-1 truncate text-xs text-zinc-600">
                                  {l.city} · {l.neighborhood} · {l.type} · {new Intl.NumberFormat("fr-FR").format(l.price_xof)} FCFA/mois
                                </div>
                              </div>
                            </div>
                            <a
                              href={`/listings/${encodeURIComponent(l.id)}`}
                              className="h-10 shrink-0 rounded-2xl border border-black/10 bg-white px-4 text-sm font-semibold text-black hover:bg-zinc-50"
                            >
                              Voir
                            </a>
                          </div>
                        );
                      })}

                      {(listingsByOwner.get(r.id) ?? []).length === 0 ? (
                        <div className="text-sm text-zinc-600">Aucune annonce.</div>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}

              {loading ? (
                <div className="px-4 py-6 text-sm text-zinc-600">Chargement...</div>
              ) : null}

              {!loading && rows.length === 0 ? (
                <div className="px-4 py-6 text-sm text-zinc-600">Aucun utilisateur.</div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </RequireRole>
  );
}
