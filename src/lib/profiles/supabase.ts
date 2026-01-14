import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { type UserRole } from "@/lib/auth/local";

export type SupabaseProfile = {
  id: string;
  role: UserRole;
  display_name: string;
  whatsapp: string | null;
  phone?: string | null;
  city?: string | null;
  avatar_url?: string | null;
};

export async function upsertProfile(params: {
  id: string;
  role: UserRole;
  displayName: string;
  whatsapp?: string;
}) {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.from("profiles").upsert(
    {
      id: params.id,
      role: params.role,
      display_name: params.displayName,
      whatsapp: params.whatsapp?.trim() || null,
    },
    { onConflict: "id" }
  );

  if (error) {
    throw new Error(
      `Impossible de créer le profil utilisateur: ${error.message}`
    );
  }
}

export async function getPublicProfile(userId: string): Promise<SupabaseProfile | null> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, role, display_name, whatsapp, phone, city, avatar_url")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return data as SupabaseProfile;
}

export async function updateProfileFields(params: {
  id: string;
  display_name?: string;
  whatsapp?: string | null;
  phone?: string | null;
  city?: string | null;
  avatar_url?: string | null;
}): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: params.display_name,
      whatsapp: params.whatsapp,
      phone: params.phone,
      city: params.city,
      avatar_url: params.avatar_url,
    })
    .eq("id", params.id);

  if (error) throw new Error(error.message);
}

export async function uploadAvatar(params: {
  userId: string;
  file: File;
}): Promise<string> {
  const supabase = createSupabaseBrowserClient();

  const ext = (params.file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${params.userId}/avatar.${ext}`;

  const { error: uploadError } = await supabase
    .storage
    .from("avatars")
    .upload(path, params.file, { upsert: true, cacheControl: "3600" });

  if (uploadError) throw new Error(uploadError.message);

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  const publicUrl = data.publicUrl;
  if (!publicUrl) throw new Error("Impossible de récupérer l’URL publique de l’avatar");
  return publicUrl;
}
