"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { getRoleForUser } from "@/lib/auth/supabase";

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectTo = useMemo(
    () => searchParams.get("redirect") ?? "/dashboard",
    [searchParams]
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getSession().then(async ({ data }) => {
      const user = data.session?.user;
      if (!user) return;

      const role = await getRoleForUser(user.id);
      if (role === "admin") {
        router.replace("/dashboard/admin");
        return;
      }
      if (role === "broker") {
        router.replace("/dashboard/broker");
        return;
      }
      router.replace("/dashboard/client");
    });
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error || !data.user) {
        setError("Email ou mot de passe incorrect");
        return;
      }

      const role = await getRoleForUser(data.user.id);
      const dashboardHref =
        role === "admin"
          ? "/dashboard/admin"
          : role === "broker"
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

  async function onGoogleSignIn() {
    setError(null);
    setOauthLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const origin = window.location.origin;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${origin}/login?redirect=${encodeURIComponent(redirectTo)}`,
        },
      });

      if (error) {
        setError(error.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setOauthLoading(false);
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

        <h1 className="mt-6 text-xl font-semibold">Connexion</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Connecte-toi pour accéder à ton dashboard.
        </p>

        {error ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <button
          type="button"
          onClick={onGoogleSignIn}
          disabled={oauthLoading || loading}
          className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-full border border-black/10 bg-white text-sm font-semibold text-black hover:bg-zinc-50 disabled:opacity-60"
        >
          {oauthLoading ? (
            "Connexion Google..."
          ) : (
            <>
              <Image
                src="/google-icon.jpg"
                alt="Google"
                width={22}
                height={22}
                className="h-[22px] w-[22px]"
              />
              <span>Continuer avec Google</span>
            </>
          )}
        </button>

        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <div>
            <label className="text-xs font-medium text-zinc-700">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ex: nom@gmail.com"
              className="mt-1 h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-yellow-400"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-700">Mot de passe</label>
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
                aria-label={
                  showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"
                }
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div className="mt-2 text-right">
              <a
                href={`/forgot-password?redirect=${encodeURIComponent(redirectTo)}`}
                className="text-xs font-semibold text-zinc-700 underline hover:text-black"
              >
                Mot de passe oublié ?
              </a>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 h-11 w-full rounded-full bg-yellow-400 text-sm font-semibold text-black hover:bg-yellow-300 disabled:opacity-60"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-zinc-600">
          Pas de compte ?{" "}
          <a href="/register" className="font-semibold text-black underline">
            Créer un compte
          </a>
        </div>
      </div>
    </div>
  );
}
