"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { type UserRole } from "@/lib/auth/local";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { getRoleForUser } from "@/lib/auth/supabase";
import { getPublicProfile, type SupabaseProfile } from "@/lib/profiles/supabase";
import { getProfile } from "@/lib/profiles/local";
import { listAllListings } from "@/lib/listings/local";
import { getListingById, type SupabaseListing } from "@/lib/listings/supabase";
import {
  addComment,
  getLikeCount,
  hasLiked,
  listCommentsForListing,
  toggleLike,
  type LocalComment,
} from "@/lib/social/local";

function typeLabel(t: SupabaseListing["type"]) {
  if (t === "room") return "Chambre";
  if (t === "studio") return "Studio";
  if (t === "apartment") return "Appartement";
  return "Maison";
}

export default function ListingDetailPage() {
  const params = useParams<{ id: string }>();
  const id = String(params.id);

  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [hasSession, setHasSession] = useState(false);
  const [listing, setListing] = useState<SupabaseListing | null>(null);
  const [brokerProfile, setBrokerProfile] = useState<SupabaseProfile | null>(null);
  const [commentText, setCommentText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [activePhoto, setActivePhoto] = useState(0);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getSession().then(async ({ data }) => {
      const user = data.session?.user;
      if (!user) {
        setHasSession(false);
        setRole(null);
        setSessionUserId(null);
        return;
      }
      setHasSession(true);
      setSessionUserId(user.id);
      const r = await getRoleForUser(user.id);
      setRole(r);
    });
  }, []);

  const dashboardHref =
    role === "admin"
      ? "/dashboard/admin"
      : role === "broker"
        ? "/dashboard/broker"
        : hasSession
          ? "/dashboard/client"
          : null;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await getListingById(id);
        if (cancelled) return;
        setListing(data);
      } catch {
        if (cancelled) return;
        setListing((listAllListings().find((l) => l.id === id) ?? null) as any);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, tick]);

  useEffect(() => {
    let cancelled = false;
    if (!listing) {
      setBrokerProfile(null);
      return;
    }

    (async () => {
      try {
        const p = await getPublicProfile(listing.ownerUserId);
        if (cancelled) return;
        setBrokerProfile(p);
      } catch {
        if (cancelled) return;
        setBrokerProfile(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [listing]);

  const localBrokerProfile = useMemo(() => {
    if (!listing) return null;
    return getProfile(listing.ownerUserId);
  }, [listing, tick]);

  const likeCount = useMemo(() => (listing ? getLikeCount(listing.id) : 0), [listing, tick]);
  const liked = useMemo(
    () => (listing && sessionUserId ? hasLiked(listing.id, sessionUserId) : false),
    [listing, sessionUserId, tick]
  );
  const comments = useMemo(
    () => (listing ? listCommentsForListing(listing.id) : ([] as LocalComment[])),
    [listing, tick]
  );

  const photos = listing?.photoDataUrls ?? [];
  const mainPhoto = photos[activePhoto] ?? photos[0] ?? null;

  function onToggleLike() {
    if (!listing) return;
    if (!sessionUserId) {
      window.location.href = `/login?redirect=${encodeURIComponent(`/listings/${listing.id}`)}`;
      return;
    }
    toggleLike(listing.id, sessionUserId);
    setTick((t) => t + 1);
  }

  function onAddComment() {
    if (!listing) return;
    setError(null);

    if (!sessionUserId) {
      window.location.href = `/login?redirect=${encodeURIComponent(`/listings/${listing.id}`)}`;
      return;
    }

    try {
      addComment(listing.id, sessionUserId, commentText);
      setCommentText("");
      setTick((t) => t + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    }
  }

  if (!listing) {
    return (
      <div className="min-h-dvh bg-zinc-50 px-4 py-10 text-zinc-950">
        <div className="mx-auto w-full max-w-3xl rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold">Annonce introuvable</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Cette annonce n’existe pas (ou a été supprimée).
          </p>
          <a
            href="/listings"
            className="mt-4 inline-flex h-10 items-center justify-center rounded-2xl bg-yellow-400 px-4 text-sm font-semibold text-black hover:bg-yellow-300"
          >
            Retour aux annonces
          </a>
        </div>
      </div>
    );
  }

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
            <a
              href="/listings"
              className="h-10 rounded-2xl border border-black/10 bg-white px-4 text-sm font-semibold text-black hover:bg-zinc-50"
            >
              Annonces
            </a>
            {dashboardHref ? (
              <>
                <a
                  href={dashboardHref}
                  className="h-10 rounded-2xl bg-yellow-400 px-4 text-sm font-semibold text-black hover:bg-yellow-300"
                >
                  Mon dashboard
                </a>
                <button
                  onClick={() => {
                    const supabase = createSupabaseBrowserClient();
                    supabase.auth.signOut().finally(() => {
                      setHasSession(false);
                      setRole(null);
                      setSessionUserId(null);
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
                className="h-10 rounded-2xl bg-yellow-400 px-4 text-sm font-semibold text-black hover:bg-yellow-300"
              >
                Connexion
              </a>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <section className="lg:col-span-2">
            <div className="overflow-hidden rounded-3xl border border-black/10 bg-white shadow-sm">
              <div className="relative">
                <div className="absolute left-4 top-4 rounded-full bg-yellow-400 px-3 py-1 text-xs font-semibold text-black">
                  {typeLabel(listing.type)}
                </div>

                <div className="aspect-[16/10] w-full bg-zinc-100">
                  {mainPhoto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={mainPhoto}
                      alt={listing.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-yellow-400/25 via-white to-white" />
                  )}
                </div>
              </div>

              {photos.length > 1 ? (
                <div className="grid grid-cols-5 gap-2 border-t border-black/10 p-4">
                  {photos.slice(0, 5).map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActivePhoto(idx)}
                      className={
                        "aspect-square overflow-hidden rounded-2xl border " +
                        (idx === activePhoto
                          ? "border-yellow-400"
                          : "border-black/10 hover:border-yellow-400/60")
                      }
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p} alt={`photo ${idx + 1}`} className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              ) : null}

              <div className="p-6">
                <h1 className="text-2xl font-semibold tracking-tight">{listing.title}</h1>
                <div className="mt-2 text-sm text-zinc-600">
                  {listing.city} · {listing.neighborhood}
                  {typeof listing.latitude === "number" && typeof listing.longitude === "number" ? (
                    <span className="text-zinc-500"> · {listing.latitude.toFixed(5)}, {listing.longitude.toFixed(5)}</span>
                  ) : null}
                </div>

                <div className="mt-3 text-2xl font-semibold text-yellow-600">
                  {new Intl.NumberFormat("fr-FR").format(listing.priceXof)} FCFA/mois
                </div>

                <p className="mt-4 whitespace-pre-wrap text-sm text-zinc-700">
                  {listing.description || "—"}
                </p>

                <div className="mt-6 flex items-center gap-2">
                  <button
                    onClick={onToggleLike}
                    className={
                      "h-10 rounded-2xl px-4 text-sm font-semibold ring-1 ring-black/10 hover:bg-zinc-50 " +
                      (liked ? "bg-yellow-400 text-black" : "bg-white text-black")
                    }
                  >
                    {liked ? "Aimé" : "J’aime"} ({likeCount})
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-3xl border border-black/10 bg-white shadow-sm">
              <div className="p-6">
                <h2 className="text-lg font-semibold">Commentaires</h2>

                {error ? (
                  <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                ) : null}

                <div className="mt-4 flex gap-2">
                  <input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-yellow-400"
                    placeholder={sessionUserId ? "Écrire un commentaire..." : "Connecte-toi pour commenter"}
                    disabled={!sessionUserId}
                  />
                  <button
                    onClick={onAddComment}
                    className="h-11 shrink-0 rounded-2xl bg-yellow-400 px-5 text-sm font-semibold text-black hover:bg-yellow-300"
                  >
                    Envoyer
                  </button>
                </div>

                <div className="mt-6 space-y-3">
                  {comments.map((c) => (
                    <div key={c.id} className="rounded-2xl border border-black/10 p-4">
                      <div className="text-xs text-zinc-500">{new Date(c.createdAt).toLocaleString("fr-FR")}</div>
                      <div className="mt-2 text-sm text-zinc-800">{c.text}</div>
                    </div>
                  ))}

                  {comments.length === 0 ? (
                    <div className="text-sm text-zinc-600">Aucun commentaire pour le moment.</div>
                  ) : null}
                </div>
              </div>
            </div>
          </section>

          <aside className="lg:col-span-1">
            <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold">Courtier</h2>

              <div className="mt-4 flex items-center gap-3">
                <div className="h-12 w-12 overflow-hidden rounded-2xl bg-zinc-100">
                  {brokerProfile?.avatar_url || localBrokerProfile?.avatarDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={brokerProfile?.avatar_url ?? localBrokerProfile?.avatarDataUrl ?? ""}
                      alt={
                        brokerProfile?.display_name ??
                        localBrokerProfile?.displayName ??
                        "Courtier"
                      }
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-yellow-400/25 via-white to-white" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">
                    {brokerProfile?.display_name ?? localBrokerProfile?.displayName ?? "Courtier"}
                  </div>
                  <div className="text-xs text-zinc-600">
                    {brokerProfile?.city ?? localBrokerProfile?.city ?? listing.city}
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {brokerProfile?.whatsapp || localBrokerProfile?.whatsapp ? (
                  <a
                    href={`https://wa.me/${String(
                      (brokerProfile?.whatsapp ?? localBrokerProfile?.whatsapp) || ""
                    ).replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-11 items-center justify-center rounded-2xl bg-yellow-400 text-sm font-semibold text-black hover:bg-yellow-300"
                  >
                    WhatsApp
                  </a>
                ) : null}

                {localBrokerProfile?.phone ? (
                  <a
                    href={`tel:${localBrokerProfile.phone}`}
                    className="flex h-11 items-center justify-center rounded-2xl border border-black/10 bg-white text-sm font-semibold text-black hover:bg-zinc-50"
                  >
                    Appeler
                  </a>
                ) : null}

                <a
                  href="/listings"
                  className="flex h-11 items-center justify-center rounded-2xl border border-black/10 bg-white text-sm font-semibold text-black hover:bg-zinc-50"
                >
                  Voir d’autres annonces
                </a>
              </div>

              <div className="mt-4 text-xs text-zinc-500">
                Démo LocalStorage: la photo/nom du courtier se règle dans “Paramètres” côté courtier.
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
