"use client";

import { useState } from "react";
import RequireRole from "@/components/auth/RequireRole";

export default function AdminSettingsPage() {
  const [supportEmail, setSupportEmail] = useState("");
  const [siteName, setSiteName] = useState("Digicode IMMO");

  return (
    <RequireRole role="admin">
      <div className="mx-auto w-full max-w-5xl">
        <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold tracking-tight">Paramètres</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Démo: paramètres admin.
          </p>

          <div className="mt-6 grid gap-4">
            <div>
              <label className="text-xs font-medium text-zinc-700">Nom du site</label>
              <input
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                className="mt-1 h-11 w-full max-w-md rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-yellow-400"
                placeholder="Digicode IMMO"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-700">Email support</label>
              <input
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="mt-1 h-11 w-full max-w-md rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-yellow-400"
                placeholder="support@digicode-immo.com"
              />
            </div>
          </div>
        </div>
      </div>
    </RequireRole>
  );
}
