"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import RequireRole from "@/components/auth/RequireRole";
import { type LocalSession } from "@/lib/auth/local";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { fileToDataUrl } from "@/lib/profiles/local";
import { UploadCloud } from "lucide-react";
import {
  createListing,
  deleteListing,
  listListingsForUser,
  type SupabaseListing,
} from "@/lib/listings/supabase";

export default function BrokerDashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [session, setSession] = useState<LocalSession | null>(null);
  const [items, setItems] = useState<SupabaseListing[]>([]);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<SupabaseListing["type"]>("room");
  const [priceXof, setPriceXof] = useState<number>(199996);
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("Dakar");
  const [neighborhood, setNeighborhood] = useState("");
  const [latitude, setLatitude] = useState<string>("");
  const [longitude, setLongitude] = useState<string>("");
  const [locating, setLocating] = useState(false);
  const [photoDataUrls, setPhotoDataUrls] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shouldOpenNew = useMemo(() => searchParams.get("new") === "1", [searchParams]);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getSession().then(async ({ data }) => {
      const user = data.session?.user;
      if (!user) return;
      const s: LocalSession = {
        userId: user.id,
        email: user.email ?? "",
        role: "broker",
      };
      setSession(s);
      try {
        const next = await listListingsForUser(user.id);
        setItems(next);
      } catch {
        setItems([]);
      }
    });
  }, []);

  useEffect(() => {
    if (shouldOpenNew) setOpen(true);
  }, [shouldOpenNew]);

  async function refresh() {
    if (!session) return;
    try {
      const next = await listListingsForUser(session.userId);
      setItems(next);
    } catch {
      setItems([]);
    }
  }

  async function onDelete(id: string) {
    if (!session) return;
    try {
      await deleteListing(id);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    }
  }

  function resetForm() {
    setTitle("");
    setType("room");
    setPriceXof(199996);
    setDescription("");
    setCity("Dakar");
    setNeighborhood("");
    setLatitude("");
    setLongitude("");
    setLocating(false);
    setPhotoDataUrls([]);
    setError(null);
  }

  function useDeviceLocation() {
    setError(null);
    if (!navigator.geolocation) {
      setError("La géolocalisation n'est pas supportée sur cet appareil");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
        setLocating(false);
      },
      () => {
        setError("Impossible de récupérer la position. Autorise la localisation dans le navigateur.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function onOpenNew() {
    resetForm();
    setOpen(true);
  }

  async function onCreate() {
    if (!session) return;
    setError(null);
    setSaving(true);
    try {
      if (!title.trim()) throw new Error("Titre obligatoire");
      if (!Number.isFinite(priceXof) || priceXof <= 0) throw new Error("Prix invalide");
      if (!city.trim()) throw new Error("Ville obligatoire");
      if (!neighborhood.trim()) throw new Error("Quartier obligatoire");
      if (photoDataUrls.length > 5) throw new Error("Maximum 5 photos");

      const lat = latitude.trim() ? Number(latitude) : undefined;
      const lng = longitude.trim() ? Number(longitude) : undefined;
      if (latitude.trim() && !Number.isFinite(lat)) throw new Error("Latitude invalide");
      if (longitude.trim() && !Number.isFinite(lng)) throw new Error("Longitude invalide");

      await createListing({
        ownerUserId: session.userId,
        title: title.trim(),
        type,
        priceXof,
        description: description.trim(),
        city: city.trim(),
        neighborhood: neighborhood.trim(),
        latitude: lat,
        longitude: lng,
        photoDataUrls,
      });

      setOpen(false);
      await refresh();
      router.replace("/dashboard/broker");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  }

  return (
    <RequireRole role="broker">
      <div className="mx-auto w-full max-w-5xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Mes annonces</h1>
            <p className="mt-1 text-sm text-zinc-600">Gérez vos annonces publiées</p>
          </div>

          <button
            onClick={onOpenNew}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-4 text-sm font-semibold text-black hover:bg-yellow-300"
          >
            <span className="text-lg leading-none">+</span>
            Nouvelle annonce
          </button>
        </div>

        {items.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-black/10 bg-white p-6 text-sm text-zinc-600 shadow-sm">
            Aucune annonce pour le moment. Clique sur “Nouvelle annonce”.
          </div>
        ) : null}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((l) => (
            <article
              key={l.id}
              className="overflow-hidden rounded-3xl border border-black/10 bg-white shadow-sm"
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
                <div className="mt-1 text-xl font-semibold text-yellow-600">
                  {new Intl.NumberFormat("fr-FR").format(l.priceXof)} FCFA/mois
                </div>
                <div className="mt-2 line-clamp-2 text-sm text-zinc-600">
                  {l.description || "—"}
                </div>

                <div className="mt-4 flex items-center gap-4 text-sm">
                  <a
                    href={`/listings/${encodeURIComponent(l.id)}`}
                    className="font-medium text-zinc-700 hover:underline"
                  >
                    Voir
                  </a>
                  <button
                    onClick={() => onDelete(l.id)}
                    className="font-medium text-red-600 hover:underline"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {open ? (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/30 p-4">
            <div className="mx-auto flex min-h-full w-full max-w-lg items-start justify-center">
              <div className="w-full overflow-hidden rounded-3xl border border-black/10 bg-white shadow-xl">
                <div className="sticky top-0 z-10 border-b border-black/10 bg-white/95 px-6 py-4 backdrop-blur">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-lg font-semibold">Nouvelle annonce</div>
                      <div className="mt-1 text-sm text-zinc-600">
                        Publie une annonce. Elle sera visible sur la page d’accueil.
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setOpen(false);
                        router.replace("/dashboard/broker");
                      }}
                      className="h-10 rounded-2xl border border-black/10 bg-white px-4 text-sm font-semibold text-black hover:bg-zinc-50"
                    >
                      Fermer
                    </button>
                  </div>

                  {error ? (
                    <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {error}
                    </div>
                  ) : null}
                </div>

                <div className="max-h-[calc(100dvh-10rem)] overflow-y-auto px-6 py-5 pb-28">
                  <div className="space-y-3">
                    <div>
                  <label className="text-xs font-medium text-zinc-700">Titre</label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mt-1 h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-yellow-400"
                    placeholder="Ex: Belle chambre"
                  />
                    </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-medium text-zinc-700">Ville</label>
                    <input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="mt-1 h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-yellow-400"
                      placeholder="Ex: Dakar"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-zinc-700">Quartier</label>
                    <input
                      value={neighborhood}
                      onChange={(e) => setNeighborhood(e.target.value)}
                      className="mt-1 h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-yellow-400"
                      placeholder="Ex: Almadies"
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-medium text-zinc-700">Latitude (optionnel)</label>
                    <input
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      className="mt-1 h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-yellow-400"
                      placeholder="Ex: 14.7167"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-zinc-700">Longitude (optionnel)</label>
                    <input
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      className="mt-1 h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-yellow-400"
                      placeholder="Ex: -17.4677"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={useDeviceLocation}
                  disabled={locating}
                  className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm font-semibold text-black hover:bg-zinc-50 disabled:opacity-60"
                >
                  {locating ? "Localisation en cours..." : "Utiliser ma position (GPS)"}
                </button>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-medium text-zinc-700">Type</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as SupabaseListing["type"])}
                      className="mt-1 h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-yellow-400"
                    >
                      <option value="room">Chambre</option>
                      <option value="studio">Studio</option>
                      <option value="apartment">Appartement</option>
                      <option value="house">Maison</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-zinc-700">Prix (FCFA/mois)</label>
                    <input
                      value={String(priceXof)}
                      onChange={(e) => setPriceXof(Number(e.target.value))}
                      inputMode="numeric"
                      className="mt-1 h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-yellow-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-zinc-700">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="mt-1 min-h-24 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-yellow-400"
                    placeholder="Décris le logement..."
                  />
                </div>

                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <label className="text-xs font-medium text-zinc-700">Photos (max 5)</label>
                        <div className="text-xs text-zinc-500">
                          {photoDataUrls.length}/5
                        </div>
                      </div>

                      <label className="mt-2 inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-4 text-sm font-semibold text-black hover:bg-zinc-50">
                        <UploadCloud className="h-4 w-4" />
                        Importer des photos
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={async (e) => {
                            setError(null);
                            const files = Array.from(e.target.files ?? []).slice(0, 5);
                            try {
                              const urls = await Promise.all(
                                files.map((f) => fileToDataUrl(f))
                              );
                              setPhotoDataUrls(urls);
                            } catch (err) {
                              setError(
                                err instanceof Error
                                  ? err.message
                                  : "Erreur upload photos"
                              );
                            }
                          }}
                        />
                      </label>

                  {photoDataUrls.length > 0 ? (
                    <div className="mt-3 grid grid-cols-5 gap-2">
                      {photoDataUrls.slice(0, 5).map((p, idx) => (
                        <div
                          key={idx}
                          className="aspect-square overflow-hidden rounded-2xl border border-black/10"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={p} alt={`photo ${idx + 1}`} className="h-full w-full object-cover" />
                        </div>
                      ))}
                    </div>
                  ) : null}
                    </div>
                  </div>
                </div>

                <div className="sticky bottom-0 z-10 border-t border-black/10 bg-white/95 px-6 py-4 backdrop-blur">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => {
                        setOpen(false);
                        router.replace("/dashboard/broker");
                      }}
                      className="h-11 rounded-2xl border border-black/10 bg-white px-5 text-sm font-semibold text-black hover:bg-zinc-50"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={onCreate}
                      disabled={saving}
                      className="h-11 rounded-2xl bg-yellow-400 px-5 text-sm font-semibold text-black hover:bg-yellow-300 disabled:opacity-60"
                    >
                      {saving ? "Création..." : "Créer"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </RequireRole>
  );
}
