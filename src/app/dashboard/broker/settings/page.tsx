"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import RequireRole from "@/components/auth/RequireRole";
import {
  getPublicProfile,
  updateProfileFields,
  uploadAvatar,
} from "@/lib/profiles/supabase";

export default function BrokerSettingsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [city, setCity] = useState("Dakar");
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getSession().then(async ({ data }) => {
      const user = data.session?.user;
      if (!user) return;
      setUserId(user.id);

      try {
        const p = await getPublicProfile(user.id);
        if (p) {
          setDisplayName(p.display_name ?? "");
          setPhone(p.phone ?? "");
          setWhatsapp(p.whatsapp ?? "");
          setCity(p.city ?? "Dakar");
          setAvatarUrl(p.avatar_url ?? undefined);
        } else {
          setDisplayName(user.email?.split("@")[0] ?? "");
        }
      } catch {
        setDisplayName(user.email?.split("@")[0] ?? "");
      }
    });
  }, []);

  async function onSave() {
    if (!userId) return;
    setSaved(false);
    setError(null);
    try {
      await updateProfileFields({
        id: userId,
        display_name: displayName.trim() || "Courtier",
        phone: phone.trim() || null,
        whatsapp: whatsapp.trim() || null,
        city: city.trim() || null,
        avatar_url: avatarUrl ?? null,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    }
  }

  return (
    <RequireRole role="broker">
      <div className="mx-auto w-full max-w-5xl">
        <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold tracking-tight">Paramètres</h1>

          <p className="mt-1 text-sm text-zinc-600">
            Configure ton profil courtier (nom, photo, WhatsApp). Il sera visible sur tes annonces.
          </p>

          {error ? (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-zinc-700">Nom</label>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="mt-1 h-11 w-full max-w-md rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-yellow-400"
                  placeholder="Ex: Carrelle Kimbassa"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-700">Ville</label>
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="mt-1 h-11 w-full max-w-md rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-yellow-400"
                  placeholder="Ex: Dakar"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-700">Téléphone</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 h-11 w-full max-w-md rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-yellow-400"
                  placeholder="Ex: +221 77 000 00 00"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-700">WhatsApp (numéro)</label>
                <input
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="mt-1 h-11 w-full max-w-md rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-yellow-400"
                  placeholder="Ex: +221770000000"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-700">Photo (avatar)</label>
              <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="h-20 w-20 overflow-hidden rounded-3xl border border-black/10 bg-zinc-100">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-yellow-400/25 via-white to-white" />
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="block w-full min-w-0 text-sm"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file || !userId) return;
                    setSaved(false);
                    setError(null);
                    setUploading(true);
                    try {
                      const url = await uploadAvatar({ userId, file });
                      setAvatarUrl(url);
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "Erreur upload photo");
                    } finally {
                      setUploading(false);
                    }
                  }}
                />
              </div>
              <p className="mt-2 text-xs text-zinc-500">
                Upload sur Supabase Storage.
              </p>
              {uploading ? (
                <div className="mt-2 text-xs font-semibold text-zinc-700">
                  Upload en cours...
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={onSave}
              className="h-11 rounded-2xl bg-yellow-400 px-5 text-sm font-semibold text-black hover:bg-yellow-300"
            >
              Enregistrer
            </button>
            {saved ? (
              <div className="text-sm font-medium text-green-700">Enregistré ✅</div>
            ) : null}
            <a
              href="/listings"
              className="h-11 rounded-2xl border border-black/10 bg-white px-5 text-sm font-semibold text-black hover:bg-zinc-50"
            >
              Voir les annonces publiques
            </a>
          </div>
        </div>
      </div>
    </RequireRole>
  );
}
