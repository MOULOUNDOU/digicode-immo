"use client";

export default function LoginError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md items-center px-4 py-10">
      <div className="w-full rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Erreur</h1>
        <p className="mt-2 text-sm text-zinc-600">{error.message}</p>
      </div>
    </div>
  );
}
