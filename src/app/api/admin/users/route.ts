import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(req: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return NextResponse.json({ ok: false }, { status: guard.status });
  }

  const url = new URL(req.url);
  const role = url.searchParams.get("role");

  const admin = createSupabaseAdminClient();
  const perPage = 200;
  let page = 1;
  const users: any[] = [];

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ perPage, page });
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const batch = data.users ?? [];
    users.push(...batch);
    if (batch.length < perPage) break;
    page += 1;
    if (page > 50) break;
  }

  const ids = users.map((u) => u.id);

  const { data: profiles, error: profilesError } = await admin
    .from("profiles")
    .select("id, role, display_name, whatsapp, phone, city, avatar_url")
    .in("id", ids);

  if (profilesError) {
    return NextResponse.json({ ok: false, error: profilesError.message }, { status: 500 });
  }

  const profileById = new Map((profiles ?? []).map((p: any) => [String(p.id), p]));

  const rows = users
    .map((u) => {
      const p = profileById.get(u.id) as any | undefined;
      return {
        id: u.id,
        email: u.email ?? "",
        createdAt: u.created_at,
        lastSignInAt: u.last_sign_in_at,
        role: (p?.role ?? "client") as string,
        displayName: (p?.display_name ?? "") as string,
        whatsapp: (p?.whatsapp ?? "") as string,
        phone: (p?.phone ?? "") as string,
        city: (p?.city ?? "") as string,
        avatarUrl: (p?.avatar_url ?? "") as string,
      };
    })
    .filter((r) => {
      if (!role) return true;
      return String(r.role) === role;
    });

  return NextResponse.json({ ok: true, users: rows });
}

export async function PATCH(req: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return NextResponse.json({ ok: false }, { status: guard.status });
  }

  const body = (await req.json().catch(() => null)) as null | {
    userId?: string;
    role?: "admin" | "broker" | "client";
  };

  const userId = body?.userId ?? "";
  const role = body?.role;

  if (!userId || (role !== "admin" && role !== "broker" && role !== "client")) {
    return NextResponse.json({ ok: false, error: "Paramètres invalides" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();

  const { error } = await admin.from("profiles").upsert(
    {
      id: userId,
      role,
    },
    { onConflict: "id" }
  );

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return NextResponse.json({ ok: false }, { status: guard.status });
  }

  const url = new URL(req.url);
  const userId = url.searchParams.get("userId") ?? "";

  if (!userId) {
    return NextResponse.json({ ok: false, error: "userId manquant" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
