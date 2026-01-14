import Image from "next/image";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-12 border-t border-black/10 bg-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3">
            <a href="/" className="inline-flex items-center gap-2">
              <Image
                src="/digicode-immo-logo.jpeg"
                alt="Logo Digicode immo"
                width={40}
                height={40}
                className="h-9 w-9 rounded-xl object-contain"
              />
              <div className="leading-tight">
                <div className="text-sm font-semibold">Digicode IMMO</div>
                <div className="text-xs text-zinc-500">Sénégal</div>
              </div>
            </a>
            <p className="text-sm text-zinc-600">
              Marketplace immobilier au Sénégal: annonces, courtiers et demandes.
            </p>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Navigation</div>
            <div className="grid gap-2 text-sm">
              <a href="/" className="text-zinc-700 hover:text-black">Accueil</a>
              <a href="/listings" className="text-zinc-700 hover:text-black">Annonces</a>
              <a href="/login" className="text-zinc-700 hover:text-black">Connexion</a>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Tableau de bord</div>
            <div className="grid gap-2 text-sm">
              <a href="/dashboard/client" className="text-zinc-700 hover:text-black">Client</a>
              <a href="/dashboard/broker" className="text-zinc-700 hover:text-black">Courtier</a>
              <a href="/dashboard/admin" className="text-zinc-700 hover:text-black">Admin</a>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Contact</div>
            <div className="grid gap-2 text-sm">
              <a
                href="https://wa.me/221770000000"
                target="_blank"
                rel="noreferrer"
                className="text-zinc-700 hover:text-black"
              >
                WhatsApp
              </a>
              <a
                href="mailto:contact@digicode-immo.com"
                className="text-zinc-700 hover:text-black"
              >
                contact@digicode-immo.com
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-black/10 pt-6 text-sm text-zinc-600 sm:flex-row sm:items-center sm:justify-between">
          <div>© {year} Digicode IMMO. Tous droits réservés.</div>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            <a href="/" className="hover:text-black">Conditions</a>
            <a href="/" className="hover:text-black">Confidentialité</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
