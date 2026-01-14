import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { type UserRole } from "@/lib/auth/local";

export async function getRoleForUser(userId: string): Promise<UserRole> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error("Impossible de récupérer le rôle utilisateur");
  }

  const role = (data?.role ?? "client") as UserRole;
  if (role === "admin" || role === "broker" || role === "client") return role;
  return "client";
}

export async function getSupabaseUser() {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    return { user: null } as const;
  }
  return { user: data.user } as const;
}

export async function signOutSupabase() {
  const supabase = createSupabaseBrowserClient();
  await supabase.auth.signOut();
}
