"use client";

import RequireRole from "@/components/auth/RequireRole";

export default function BrokerMessagesPage() {
  return (
    <RequireRole role="broker">
      <div className="mx-auto w-full max-w-5xl">
        <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold tracking-tight">Messages</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Messagerie en temps réel (par annonce) — en cours.
          </p>

          <div className="mt-6 rounded-2xl border border-black/10 bg-zinc-50 p-4 text-sm text-zinc-700">
            Prochaine étape : liste des conversations, chat temps réel et notifications.
          </div>
        </div>
      </div>
    </RequireRole>
  );
}
