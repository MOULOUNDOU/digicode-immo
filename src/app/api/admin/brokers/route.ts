import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return NextResponse.json({ ok: false }, { status: guard.status });
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 200, page: 1 });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const users = data.users;
  const ids = users.map((u) => u.id);

  const { data: profiles, error: profilesError } = await admin
    .from("profiles")
    .select("id, role, display_name, whatsapp")
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
      };
    })
    .filter((r) => String(r.role) === "broker");

  return NextResponse.json({ ok: true, brokers: rows });
}
