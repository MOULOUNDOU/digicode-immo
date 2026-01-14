"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type UserRole } from "@/lib/auth/local";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { getRoleForUser } from "@/lib/auth/supabase";
import { listAllListings } from "@/lib/listings/local";
import { listPublicListingsPaged, type SupabaseListing } from "@/lib/listings/supabase";

export default function ListingsClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [role, setRole] = useState<UserRole | null>(null);
  const [hasSession, setHasSession] = useState(false);
  const [allListings, setAllListings] = useState<SupabaseListing[]>([]);
  const [total, setTotal] = useState(0);

  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const q = searchParams.get("q") ?? "";
  const city = searchParams.get("city") ?? "";
  const type = (searchParams.get("type") ?? "") as "" | SupabaseListing["type"];
  const maxPriceXof = (() => {
    const raw = (searchParams.get("max") ?? "").trim();
    if (!raw) return "";
    const n = Number(raw);
    return Number.isFinite(n) ? String(Math.max(0, Math.floor(n))) : "";
  })();

  const [draftQ, setDraftQ] = useState(q);
  const [draftCity, setDraftCity] = useState(city);
  const [draftType, setDraftType] = useState<typeof type>(type);
  const [draftMax, setDraftMax] = useState(maxPriceXof);

  useEffect(() => {
    setDraftQ(q);
    setDraftCity(city);
    setDraftType(type);
    setDraftMax(maxPriceXof);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, city, type, maxPriceXof]);

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
  }, [city, maxPriceXof, page, q, type]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / 12)), [total]);

  function pushParams(next: Record<string, string>) {
    const sp = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(next)) {
      if (!v) sp.delete(k);
      else sp.set(k, v);
    }
    router.push(`${pathname}?${sp.toString()}`);
  }

  function onSubmitSearch(e: FormEvent) {
    e.preventDefault();
    pushParams({
      page: "1",
      q: draftQ.trim(),
      city: draftCity.trim(),
      type: draftType,
      max: draftMax.trim(),
    });
  }

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await listPublicListingsPaged({
          page,
          pageSize: 12,
          q,
          city,
          type,
          maxPriceXof: maxPriceXof ? Number(maxPriceXof) : null,
        });
        if (cancelled) return;
        setAllListings(res.items);
        setTotal(res.total);
      } catch {
        const all = listAllListings();
        const query = q.trim().toLowerCase();
        const filtered = all.filter((l) => {
          if (city && l.city.toLowerCase().indexOf(city.toLowerCase()) === -1) return false;
          if (type && l.type !== type) return false;
          if (maxPriceXof && Number(l.priceXof) > Number(maxPriceXof)) return false;
          if (!query) return true;
          return (
            l.title.toLowerCase().includes(query) ||
            l.city.toLowerCase().includes(query) ||
            l.neighborhood.toLowerCase().includes(query) ||
            l.description.toLowerCase().includes(query)
          );
        });

        const sorted = filtered.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
        const start = (page - 1) * 12;
        const items = sorted.slice(start, start + 12);
        if (cancelled) return;
        setAllListings(items as any);
        setTotal(sorted.length);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [city, maxPriceXof, page, q, type]);

  const dashboardHref =
    role === "admin"
      ? "/dashboard/admin"
      : role === "broker"
        ? "/dashboard/broker"
        : hasSession
          ? "/dashboard/client"
          : null;

  const listings = useMemo(() => allListings, [allListings]);

  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-950">
      <header className="sticky top-0 z-10 border-b border-black/10 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
          <a href="/" className="flex items-center gap-2">
            <Image
              src="/digicode-immo-logo.jpeg"
              alt="Logo Digicode immo"
              width={40}
              height={40}
              priority
              className="h-9 w-9 rounded-xl object-contain"
            />
            <div className="text-sm font-semibold">Digicode IMMO</div>
          </a>
          <div className="flex items-center gap-2">
            {dashboardHref ? (
              <>
                <a
                  href={dashboardHref}
                  className="rounded-2xl bg-yellow-400 px-4 py-2 text-sm font-semibold text-black hover:bg-yellow-300"
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
                  className="h-10 rounded-2xl border border-black/10 bg-white px-4 text-sm font-semibold text-black hover:bg-zinc-50"
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <a
                href="/login"
                className="rounded-2xl bg-yellow-400 px-4 py-2 text-sm font-semibold text-black hover:bg-yellow-300"
              >
                Connexion
              </a>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-8 animate-fade-in">
        <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold tracking-tight">Annonces</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Recherchez par titre, ville, quartier, description.
          </p>

          <form onSubmit={onSubmitSearch} className="mt-5 grid gap-3 sm:grid-cols-3">
            <div>
              <label className="text-xs font-medium text-zinc-700">Recherche</label>
              <input
                value={draftQ}
                onChange={(e) => setDraftQ(e.target.value)}
                className="mt-1 h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-yellow-400"
                placeholder="Ex: Almadies, studio..."
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-700">Ville</label>
              <input
                value={draftCity}
                onChange={(e) => setDraftCity(e.target.value)}
                className="mt-1 h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-yellow-400"
                placeholder="Ex: Dakar"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-700">Type</label>
              <select
                value={draftType}
                onChange={(e) => setDraftType(e.target.value as any)}
                className="mt-1 h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-yellow-400"
              >
                <option value="">Tous</option>
                <option value="room">Chambre</option>
                <option value="studio">Studio</option>
                <option value="apartment">Appartement</option>
                <option value="house">Maison</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-700">Budget max (XOF)</label>
              <input
                value={draftMax}
                onChange={(e) => setDraftMax(e.target.value)}
                inputMode="numeric"
                className="mt-1 h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-yellow-400"
                placeholder="Ex: 500000"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="h-11 w-full rounded-2xl bg-yellow-400 px-5 text-sm font-semibold text-black hover:bg-yellow-300"
              >
                Appliquer
              </button>
            </div>
          </form>

          <div className="mt-3 text-xs text-zinc-600">
            {total ? (
              <span>
                {total} annonce{total > 1 ? "s" : ""} · page {page} / {totalPages}
              </span>
            ) : null}
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((l) => (
            <a
              key={l.id}
              href={`/listings/${encodeURIComponent(l.id)}`}
              className="overflow-hidden rounded-3xl border border-black/10 bg-white shadow-sm hover:border-yellow-400/60"
            >
              <div className="relative">
                <div className="absolute left-4 top-4 rounded-full bg-yellow-400 px-3 py-1 text-xs font-semibold text-black">
                  {l.type}
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
                <div className="text-sm font-semibold">{l.title}</div>
                <div className="mt-1 text-xs text-zinc-600">
                  {l.city} · {l.neighborhood}
                </div>
                <div className="mt-2 text-lg font-semibold text-yellow-600">
                  {new Intl.NumberFormat("fr-FR").format(l.priceXof)} FCFA/mois
                </div>
              </div>
            </a>
          ))}
        </div>

        {listings.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-black/10 bg-white p-6 text-sm text-zinc-600 shadow-sm">
            Aucune annonce trouvée.
          </div>
        ) : null}

        {totalPages > 1 ? (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => pushParams({ page: String(Math.max(1, page - 1)) })}
              disabled={page <= 1}
              className="h-10 rounded-2xl border border-black/10 bg-white px-4 text-sm font-semibold text-black hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Précédent
            </button>
            <div className="px-3 text-sm text-zinc-600">
              Page {page} / {totalPages}
            </div>
            <button
              type="button"
              onClick={() => pushParams({ page: String(Math.min(totalPages, page + 1)) })}
              disabled={page >= totalPages}
              className="h-10 rounded-2xl border border-black/10 bg-white px-4 text-sm font-semibold text-black hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Suivant
            </button>
          </div>
        ) : null}
      </main>
    </div>
  );
}
