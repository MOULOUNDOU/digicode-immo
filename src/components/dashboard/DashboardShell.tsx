"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { type UserRole } from "@/lib/auth/local";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { getRoleForUser } from "@/lib/auth/supabase";
import {
  BarChart3,
  Bell,
  Building2,
  CircleHelp,
  Cog,
  Home,
  Inbox,
  Key,
  Menu,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Search,
  Sparkles,
  Star,
  UserRound,
  Users,
  Wallet,
  X,
} from "lucide-react";

type NavItem = {
  label: string;
  href: string;
  Icon: React.ComponentType<{ className?: string }>;
};

function roleLabel(role: UserRole) {
  if (role === "admin") return "administrateur";
  if (role === "broker") return "courtier";
  return "client";
}

function sidebarItems(role: UserRole): NavItem[] {
  if (role === "broker") {
    return [
      { label: "Accueil", href: "/dashboard/broker", Icon: Home },
      { label: "Demandes", href: "/dashboard/broker/requests", Icon: Inbox },
      { label: "Mes annonces", href: "/dashboard/broker/listings", Icon: Building2 },
      { label: "Messages", href: "/dashboard/broker/messages", Icon: MessageSquare },
      { label: "Paramètres", href: "/dashboard/broker/settings", Icon: Cog },
    ];
  }

  if (role === "admin") {
    return [
      { label: "Dashboard", href: "/dashboard/admin", Icon: Home },
      { label: "Utilisateurs", href: "/dashboard/admin/users", Icon: Users },
      { label: "Courtiers", href: "/dashboard/admin/brokers", Icon: UserRound },
      { label: "Annonces", href: "/dashboard/admin/listings", Icon: Building2 },
      { label: "Commentaires", href: "/dashboard/admin/comments", Icon: Inbox },
      { label: "Signalements", href: "/dashboard/admin/reports", Icon: Bell },
      { label: "Paramètres", href: "/dashboard/admin/settings", Icon: Cog },
    ];
  }

  return [
    { label: "Accueil", href: "/dashboard/client", Icon: Home },
    { label: "Mes favoris", href: "/dashboard/client/favorites", Icon: Star },
    { label: "Mes commentaires", href: "/dashboard/client/comments", Icon: Inbox },
    { label: "Paramètres", href: "/dashboard/client/settings", Icon: Cog },
  ];
}

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export default function DashboardShell({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [email, setEmail] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getSession().then(async ({ data }) => {
      const user = data.session?.user;
      if (!user) {
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
        return;
      }

      setEmail(user.email ?? null);
      const r = await getRoleForUser(user.id);
      setRole(r);
    });
  }, [pathname, router]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  const effectiveRole: UserRole = role ?? "client";
  const items = useMemo(() => sidebarItems(effectiveRole), [effectiveRole]);

  const sidebar = (
    <>
      <div className="flex items-center justify-between px-4 py-4">
        <a href="/" className="flex items-center gap-2">
          <Image
            src="/digicode-immo-logo.jpeg"
            alt="Logo Digicode immo"
            width={40}
            height={40}
            priority
            className="h-9 w-9 rounded-xl object-contain"
          />
          <div className="leading-tight">
            <div className="text-sm font-semibold">Digicode IMMO</div>
            <div className="text-xs text-zinc-500">{roleLabel(effectiveRole)}</div>
          </div>
        </a>
        <div className="text-xs text-zinc-400">v0</div>
      </div>

      <nav className="px-2 py-2">
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.Icon;
          return (
            <a
              key={item.label}
              href={item.href}
              onClick={() => setMobileNavOpen(false)}
              className={
                "mb-1 flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors " +
                (active
                  ? "bg-yellow-400 text-black"
                  : "text-zinc-700 hover:bg-zinc-100")
              }
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </a>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-black/10 p-4">
        <a
          href="/"
          onClick={() => setMobileNavOpen(false)}
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
        >
          <Home className="h-5 w-5" />
          Retour au site
        </a>
        <a
          href={
            effectiveRole === "admin"
              ? "/dashboard/admin/settings"
              : effectiveRole === "broker"
                ? "/dashboard/broker/settings"
                : "/dashboard/client/settings"
          }
          onClick={() => setMobileNavOpen(false)}
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
        >
          <Cog className="h-5 w-5" />
          Paramètres
        </a>
        <a
          href="#"
          className="mt-1 flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
        >
          <CircleHelp className="h-5 w-5" />
          Centre d’aide
        </a>
      </div>
    </>
  );

  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-950">
      {mobileNavOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Fermer le menu"
            onClick={() => setMobileNavOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          <aside className="absolute inset-y-0 left-0 flex w-[85vw] max-w-xs flex-col border-r border-black/10 bg-white shadow-xl">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="text-sm font-semibold">Menu</div>
              <button
                type="button"
                aria-label="Fermer"
                onClick={() => setMobileNavOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl hover:bg-zinc-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">{sidebar}</div>
          </aside>
        </div>
      ) : null}
      <div className="mx-auto flex min-h-dvh w-full max-w-[1400px]">
        <aside className="hidden w-64 shrink-0 border-r border-black/10 bg-white lg:flex lg:flex-col">
          {sidebar}
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 border-b border-black/10 bg-white/80 backdrop-blur">
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  aria-label="Ouvrir le menu"
                  onClick={() => setMobileNavOpen(true)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 bg-white hover:bg-zinc-50 lg:hidden"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div className="flex items-center gap-2 lg:hidden">
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
                </div>
                <div className="hidden items-center gap-2 lg:flex">
                  <div className="text-base font-semibold">{title}</div>
                </div>
              </div>

              <div className="hidden flex-1 items-center justify-center lg:flex">
                <div className="flex w-full max-w-xl items-center gap-2 rounded-2xl border border-black/10 bg-white px-3 py-2 shadow-sm">
                  <Search className="h-4 w-4 text-zinc-500" />
                  <input
                    className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
                    placeholder="Rechercher un logement, une ville..."
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                {effectiveRole === "broker" ? (
                  <a
                    href="/dashboard/broker?new=1"
                    className="hidden h-10 items-center justify-center rounded-2xl bg-yellow-400 px-4 text-sm font-semibold text-black hover:bg-yellow-300 sm:inline-flex"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Publier une annonce
                  </a>
                ) : null}

                <div className="hidden items-center gap-2 sm:flex">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-black/5">
                    <UserRound className="h-4 w-4 text-zinc-700" />
                  </div>
                  <div className="leading-tight">
                    <div className="text-sm font-semibold">
                      {email ?? ""}
                    </div>
                    <div className="text-xs text-zinc-500">{roleLabel(effectiveRole)}</div>
                  </div>
                  <div className="rounded-full bg-yellow-400/20 px-3 py-1 text-xs font-semibold text-black">
                    {roleLabel(effectiveRole)}
                  </div>
                </div>

                <button
                  onClick={() => {
                    const supabase = createSupabaseBrowserClient();
                    supabase.auth.signOut().finally(() => {
                      router.replace("/login");
                    });
                  }}
                  className="h-10 rounded-2xl border border-black/10 bg-white px-4 text-sm font-semibold text-black hover:bg-zinc-50"
                >
                  Déconnexion
                </button>
              </div>
            </div>
          </header>

          <main className="min-w-0 flex-1 px-4 py-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
