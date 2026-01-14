"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { type UserRole } from "@/lib/auth/local";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { getRoleForUser } from "@/lib/auth/supabase";

export default function RegisterClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectTo = useMemo(
    () => searchParams.get("redirect") ?? "/dashboard",
    [searchParams]
  );

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [whatsapp, setWhatsapp] = useState("");
  const [role, setRole] = useState<UserRole>("client");
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getSession().then(async ({ data }) => {
      const user = data.session?.user;
      if (!user) return;

      const r = await getRoleForUser(user.id);
      if (r === "admin") {
        router.replace("/dashboard/admin");
        return;
      }
      if (r === "broker") {
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
      if (!fullName.trim()) {
        throw new Error("Nom et prénom obligatoires");
      }
      if (password.length < 6) {
        throw new Error("Mot de passe trop court (min 6 caractères)");
      }
      if (password !== confirmPassword) {
        throw new Error("La confirmation du mot de passe ne correspond pas");
      }

      const normalizedEmail = email.trim();

      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            role,
            display_name: fullName.trim(),
            whatsapp: whatsapp.trim() || null,
          },
        },
      });

      if (error) {
        setError("Impossible de créer le compte");
        return;
      }

      const user = data.user;
      const session = data.session;

      if (!user || !session) {
        setPendingEmail(normalizedEmail);
        setError(
          "Compte créé. Saisis le code de confirmation reçu par email pour activer ton compte."
        );
        return;
      }

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

  async function onVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!pendingEmail) return;
    setError(null);
    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase.auth.verifyOtp({
        email: pendingEmail,
        token: otp.trim(),
        type: "signup",
      });

      if (error || !data.user) {
        setError("Code de confirmation invalide");
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

  async function onResendOtp() {
    if (!pendingEmail) return;
    setError(null);
    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: pendingEmail,
      });
      if (error) {
        setError("Impossible de renvoyer le code");
        return;
      }
      setError("Code renvoyé. Vérifie ta boîte mail.");
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

        <h1 className="text-xl font-semibold">Inscription</h1>
        <p className="mt-1 text-sm text-zinc-600">Crée ton compte Digicode IMMO.</p>

        {error ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {pendingEmail ? (
          <form onSubmit={onVerifyOtp} className="mt-6 space-y-3">
            <div>
              <label className="text-xs font-medium text-zinc-700">
                Code de confirmation
              </label>
              <input
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Ex: 123456"
                inputMode="numeric"
                className="mt-1 h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-yellow-400"
              />
              <div className="mt-2 text-xs text-zinc-600">
                Email: <span className="font-semibold">{pendingEmail}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 h-11 w-full rounded-full bg-yellow-400 text-sm font-semibold text-black hover:bg-yellow-300 disabled:opacity-60"
            >
              {loading ? "Validation..." : "Valider le code"}
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={onResendOtp}
              className="h-11 w-full rounded-full bg-white text-sm font-semibold text-black ring-1 ring-black/10 hover:bg-zinc-50 disabled:opacity-60"
            >
              Renvoyer le code
            </button>
          </form>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 space-y-3">
            <div>
              <label className="text-xs font-medium text-zinc-700">Nom et prénom</label>
              <input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ex: Mamadou Diop"
                className="mt-1 h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-yellow-400"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-700">Type de compte</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="mt-1 h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-yellow-400"
              >
                <option value="client">Client</option>
                <option value="broker">Courtier</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-700">WhatsApp</label>
              <input
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="Ex: +221770000000"
                className="mt-1 h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-yellow-400"
              />
            </div>

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
                    showConfirmPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"
                  }
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 h-11 w-full rounded-full bg-yellow-400 text-sm font-semibold text-black hover:bg-yellow-300 disabled:opacity-60"
            >
              {loading ? "Création..." : "Créer mon compte"}
            </button>
          </form>
        )}

        <div className="mt-4 text-center text-sm text-zinc-600">
          Déjà un compte ?{" "}
          <a href="/login" className="font-semibold text-black underline">
            Se connecter
          </a>
        </div>
      </div>
    </div>
  );
}
