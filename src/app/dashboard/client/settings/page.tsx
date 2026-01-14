"use client";

import { useState } from "react";
import RequireRole from "@/components/auth/RequireRole";

export default function ClientSettingsPage() {
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");

  return (
    <RequireRole>
      <div className="mx-auto w-full max-w-5xl">
        <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold tracking-tight">Paramètres</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Configure ton profil (démo).
          </p>

          <div className="mt-6 grid gap-4">
            <div>
              <label className="text-xs font-medium text-zinc-700">Nom</label>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="mt-1 h-11 w-full max-w-md rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-yellow-400"
                placeholder="Ex: Awa Diop"
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
          </div>
        </div>
      </div>
    </RequireRole>
  );
}
