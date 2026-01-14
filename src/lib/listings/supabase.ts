import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export type SupabaseListing = {
  id: string;
  ownerUserId: string;
  title: string;
  type: "room" | "studio" | "apartment" | "house";
  priceXof: number;
  description: string;
  city: string;
  neighborhood: string;
  latitude?: number;
  longitude?: number;
  photoDataUrls: string[];
  createdAt: string;
};

function mapRowToListing(row: any): SupabaseListing {
  return {
    id: String(row.id),
    ownerUserId: String(row.owner_user_id),
    title: String(row.title ?? ""),
    type: row.type as SupabaseListing["type"],
    priceXof: Number(row.price_xof ?? 0),
    description: String(row.description ?? ""),
    city: String(row.city ?? ""),
    neighborhood: String(row.neighborhood ?? ""),
    latitude: row.latitude ?? undefined,
    longitude: row.longitude ?? undefined,
    photoDataUrls: Array.isArray(row.photo_data_urls) ? row.photo_data_urls : [],
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

export async function listPublicListings(params?: {
  limit?: number;
}): Promise<SupabaseListing[]> {
  const supabase = createSupabaseBrowserClient();
  const limit = params?.limit;

  let query = supabase
    .from("listings")
    .select("*")
    .order("created_at", { ascending: false });

  if (typeof limit === "number") {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapRowToListing);
}

export async function listListingsForUser(userId: string): Promise<SupabaseListing[]> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("owner_user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapRowToListing);
}

export async function getListingById(id: string): Promise<SupabaseListing | null> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapRowToListing(data);
}

export async function createListing(params: {
  ownerUserId: string;
  title: string;
  type: SupabaseListing["type"];
  priceXof: number;
  description: string;
  city: string;
  neighborhood: string;
  latitude?: number;
  longitude?: number;
  photoDataUrls: string[];
}): Promise<SupabaseListing> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("listings")
    .insert({
      owner_user_id: params.ownerUserId,
      title: params.title,
      type: params.type,
      price_xof: params.priceXof,
      description: params.description,
      city: params.city,
      neighborhood: params.neighborhood,
      latitude: params.latitude ?? null,
      longitude: params.longitude ?? null,
      photo_data_urls: params.photoDataUrls,
    })
    .select("*")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Erreur création annonce");
  return mapRowToListing(data);
}

export async function deleteListing(listingId: string): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.from("listings").delete().eq("id", listingId);
  if (error) throw new Error(error.message);
}
