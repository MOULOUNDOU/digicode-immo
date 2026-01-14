import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return NextResponse.json({ ok: false }, { status: guard.status });
  }

  const admin = createSupabaseAdminClient();

  const { data, error } = await admin
    .from("listings")
    .select("id, owner_user_id, title, type, price_xof, city, neighborhood, photo_data_urls, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, listings: data ?? [] });
}

export async function DELETE(req: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return NextResponse.json({ ok: false }, { status: guard.status });
  }

  const url = new URL(req.url);
  const id = url.searchParams.get("id") ?? "";

  if (!id) {
    return NextResponse.json({ ok: false, error: "id manquant" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("listings").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
