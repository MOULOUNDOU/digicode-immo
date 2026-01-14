import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function requireAdmin() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false as const, status: 401 as const, user: null };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return { ok: false as const, status: 500 as const, user: null };
  }

  if (profile?.role !== "admin") {
    return { ok: false as const, status: 403 as const, user: null };
  }

  return { ok: true as const, status: 200 as const, user };
}
