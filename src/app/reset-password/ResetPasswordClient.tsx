"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { getRoleForUser } from "@/lib/auth/supabase";

export default function ResetPasswordClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectTo = useMemo(
    () => searchParams.get("redirect") ?? "/dashboard",
    [searchParams]
  );

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (password.length < 6) {
        setError("Mot de passe trop court (min 6 caractères)");
        return;
      }
      if (password !== confirmPassword) {
        setError("La confirmation du mot de passe ne correspond pas");
        return;
      }

      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase.auth.updateUser({
        password,
      });

      if (error || !data.user) {
        setError("Impossible de réinitialiser le mot de passe");
        return;
      }

      const r = await getRoleForUser(data.user.id);
      const dashboardHref =
        r === "admin"
          ? "/dashboard/admin"
          : r === "broker"
            ? "/dashboard/broker"
            : "/dashboard/client";

      router.replace(redirectTo || dashboardHref);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md items-center px-4 py-10">
      <div className="w-full rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <div className="mb-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 hover:text-black"
          >
            <ArrowLeft size={18} />
            Retour
          </button>
        </div>
        <div className="flex flex-col items-center">
          <Image
            src="/digicode-immo-logo.jpeg"
            alt="Logo Digicode immo"
            width={120}
            height={120}
            priority
            className="h-20 w-20 rounded-3xl object-contain"
          />
          <div className="mt-3 text-lg font-semibold">Digicode immo</div>
        </div>

        <h1 className="mt-6 text-xl font-semibold">Nouveau mot de passe</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Choisis un nouveau mot de passe pour ton compte.
        </p>

        {!ready ? (
          <div className="mt-6 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-zinc-700">
            Ouvre le lien reçu par email pour réinitialiser ton mot de passe.
          </div>
        ) : null}

        {error ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <div>
            <label className="text-xs font-medium text-zinc-700">Nouveau mot de passe</label>
            <div className="relative mt-1">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 pr-11 text-sm outline-none focus:border-yellow-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl p-2 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-700">Confirmer le mot de passe</label>
            <div className="relative mt-1">
              <input
                type={showConfirmPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 pr-11 text-sm outline-none focus:border-yellow-400"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl p-2 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                aria-label={
                  showConfirmPassword
                    ? "Masquer le mot de passe"
                    : "Afficher le mot de passe"
                }
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !ready}
            className="mt-2 h-11 w-full rounded-full bg-yellow-400 text-sm font-semibold text-black hover:bg-yellow-300 disabled:opacity-60"
          >
            {loading ? "Mise à jour..." : "Mettre à jour le mot de passe"}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-zinc-600">
          <a href="/login" className="font-semibold text-black underline">
            Retour à la connexion
          </a>
        </div>
      </div>
    </div>
  );
}
