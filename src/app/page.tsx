"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { type UserRole } from "@/lib/auth/local";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { getRoleForUser } from "@/lib/auth/supabase";
import { listAllListings } from "@/lib/listings/local";
import { listPublicListings, type SupabaseListing } from "@/lib/listings/supabase";
import { getPublicProfile, type SupabaseProfile } from "@/lib/profiles/supabase";
import { getProfile } from "@/lib/profiles/local";

function typeLabel(t: SupabaseListing["type"]) {
  if (t === "room") return "Chambre";
  if (t === "studio") return "Studio";
  if (t === "apartment") return "Appartement";
  return "Maison";
}

export default function Home() {
  const [role, setRole] = useState<UserRole | null>(null);
  const [hasSession, setHasSession] = useState(false);
  const [listings, setListings] = useState<SupabaseListing[]>([]);
  const [brokersById, setBrokersById] = useState<Record<string, SupabaseProfile | null>>(
    {}
  );

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getSession().then(async ({ data }) => {
      const user = data.session?.user;
      if (!user) {
        setHasSession(false);
        setRole(null);
        return;
      }
      setHasSession(true);
      const r = await getRoleForUser(user.id);
      setRole(r);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    const missingOwnerIds = Array.from(new Set(listings.map((l) => l.ownerUserId))).filter(
      (id) => !(id in brokersById)
    );

    if (missingOwnerIds.length === 0) return;

    (async () => {
      try {
        const results = await Promise.all(
          missingOwnerIds.map(async (id) => [id, await getPublicProfile(id)] as const)
        );
        if (cancelled) return;
        setBrokersById((prev) => {
          const next = { ...prev };
          for (const [id, profile] of results) next[id] = profile;
          return next;
        });
      } catch {
        if (cancelled) return;
        setBrokersById((prev) => {
          const next = { ...prev };
          for (const id of missingOwnerIds) next[id] = null;
          return next;
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [brokersById, listings]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await listPublicListings({ limit: 6 });
        if (cancelled) return;
        setListings(data);
      } catch {
        const all = listAllListings();
        const fallback = all
          .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
          .slice(0, 6);
        if (cancelled) return;
        setListings(fallback as any);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const dashboardHref =
    role === "admin"
      ? "/dashboard/admin"
      : role === "broker"
        ? "/dashboard/broker"
        : hasSession
          ? "/dashboard/client"
          : null;

  return (
    <div className="min-h-screen bg-white text-zinc-950">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-28 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-yellow-400/30 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-yellow-400/20 blur-3xl" />
      </div>

      <header className="sticky top-0 z-20 border-b border-black/10 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <Image
              src="/digicode-immo-logo.jpeg"
              alt="Logo Digicode immo"
              width={40}
              height={40}
              priority
              className="h-9 w-9 rounded-xl object-contain ring-1 ring-yellow-300/30"
            />
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-wide">Digicode IMMO</div>
              <div className="text-xs text-zinc-600">Sénégal</div>
            </div>
          </div>

          <nav className="flex items-center gap-2">
            {dashboardHref ? (
              <>
                <a
                  href={dashboardHref}
                  className="rounded-full bg-yellow-400 px-3 py-2 text-sm font-semibold text-black hover:bg-yellow-300"
                >
                  Mon dashboard
                </a>
                <button
                  onClick={() => {
                    const supabase = createSupabaseBrowserClient();
                    supabase.auth.signOut().finally(() => {
                      setHasSession(false);
                      setRole(null);
                    });
                  }}
                  className="rounded-full bg-white px-3 py-2 text-sm font-semibold text-black ring-1 ring-black/10 hover:bg-zinc-50"
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <a
                href="/login"
                className="rounded-full bg-yellow-400 px-3 py-2 text-sm font-semibold text-black hover:bg-yellow-300"
              >
                Se connecter
              </a>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 pb-14 pt-8">
        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <div className="max-w-2xl">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Trouvez votre prochain logement au Sénégal
            </h1>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Marketplace immobilier type Airbnb + Jumia House, avec courtiers indépendants.
            </p>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-black/10 bg-white px-4 py-3 shadow-sm">
              <label className="block text-xs font-medium text-zinc-600">Ville</label>
              <input
                placeholder="Ex: Dakar, Thiès, Saint-Louis"
                className="mt-1 w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
              />
            </div>
            <div className="rounded-2xl border border-black/10 bg-white px-4 py-3 shadow-sm">
              <label className="block text-xs font-medium text-zinc-600">Type</label>
              <select className="mt-1 w-full bg-transparent text-sm outline-none">
                <option value="">Tous</option>
                <option value="room">Chambre</option>
                <option value="studio">Studio</option>
                <option value="apartment">Appartement</option>
                <option value="house">Maison</option>
              </select>
            </div>
            <div className="rounded-2xl border border-black/10 bg-white px-4 py-3 shadow-sm">
              <label className="block text-xs font-medium text-zinc-600">Budget max (XOF)</label>
              <input
                placeholder="Ex: 500000"
                inputMode="numeric"
                className="mt-1 w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-zinc-600">
              Astuce: bientôt tu pourras filtrer par quartier, équipements, chambres, etc.
            </div>
            <button className="h-11 w-full rounded-full bg-yellow-400 px-5 text-sm font-semibold text-black hover:bg-yellow-300 sm:w-auto">
              Rechercher
            </button>
          </div>
        </section>

        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Dernières annonces</h2>
            <a href="/listings" className="text-sm text-zinc-700 hover:text-black">
              Voir tout
            </a>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((l) => {
              const broker = brokersById[l.ownerUserId] ?? null;
              const localBroker = !broker ? getProfile(l.ownerUserId) : null;
              const avatarSrc = broker?.avatar_url ?? localBroker?.avatarDataUrl ?? null;
              const brokerName = broker?.display_name ?? localBroker?.displayName ?? "Courtier";
              return (
                <a
                  key={l.id}
                  href={`/listings/${encodeURIComponent(l.id)}`}
                  className="group overflow-hidden rounded-3xl border border-black/10 bg-white shadow-sm hover:border-yellow-400/50"
                >
                  <div className="relative">
                    <div className="absolute left-4 top-4 rounded-full bg-yellow-400 px-3 py-1 text-xs font-semibold text-black">
                      {typeLabel(l.type)}
                    </div>
                    <div className="aspect-[4/3] w-full bg-zinc-100">
                      {l.photoDataUrls?.[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={l.photoDataUrls[0]}
                          alt={l.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-yellow-400/25 via-white to-white" />
                      )}
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold group-hover:text-black">
                          {l.title}
                        </h3>
                        <div className="mt-1 text-xs text-zinc-600">
                          {l.city} · {l.neighborhood}
                        </div>
                      </div>
                      <div className="shrink-0 rounded-full bg-yellow-400/20 px-3 py-1 text-xs font-semibold text-zinc-900 ring-1 ring-yellow-400/30">
                        {new Intl.NumberFormat("fr-FR").format(l.priceXof)} FCFA
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                      <div className="h-9 w-9 overflow-hidden rounded-2xl bg-zinc-100">
                        {avatarSrc ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={avatarSrc}
                            alt={brokerName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full bg-gradient-to-br from-yellow-400/25 via-white to-white" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-xs font-semibold text-zinc-900">
                          {brokerName}
                        </div>
                        <div className="text-xs text-zinc-600">Voir l’annonce</div>
                      </div>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>

          {listings.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-black/10 bg-white p-6 text-sm text-zinc-600 shadow-sm">
              Aucune annonce publiée pour le moment.
            </div>
          ) : null}
        </section>

        <section className="mt-10 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold">Vous êtes courtier ?</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Publiez vos biens, gérez vos photos, et recevez des demandes par WhatsApp, appel ou commentaires.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <a
              href="#"
              className="inline-flex h-11 items-center justify-center rounded-full bg-yellow-400 px-5 text-sm font-semibold text-black hover:bg-yellow-300"
            >
              Créer un compte courtier
            </a>
            <a
              href="#"
              className="inline-flex h-11 items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-zinc-900 ring-1 ring-black/10 hover:bg-yellow-400/15 hover:ring-yellow-400/30"
            >
              Voir les profils courtiers
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
