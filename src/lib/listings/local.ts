import type { UserRole } from "@/lib/auth/local";

export type LocalListing = {
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

const LISTINGS_KEY = "digicode_immo_listings_v1";

function getBrowserStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  const storage = window.localStorage;
  if (!storage || typeof storage.getItem !== "function") return null;
  return storage;
}

function safeParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function generateId() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function listAllListings(): LocalListing[] {
  const storage = getBrowserStorage();
  if (!storage) return [];
  const items = safeParse<LocalListing[]>(storage.getItem(LISTINGS_KEY));
  return Array.isArray(items) ? items : [];
}

export function listListingsForUser(userId: string): LocalListing[] {
  return listAllListings().filter((l) => l.ownerUserId === userId);
}

export function createListing(params: {
  ownerUserId: string;
  title: string;
  type: LocalListing["type"];
  priceXof: number;
  description: string;
  city: string;
  neighborhood: string;
  latitude?: number;
  longitude?: number;
  photoDataUrls: string[];
}): LocalListing {
  const storage = getBrowserStorage();
  if (!storage) {
    throw new Error("Stockage local indisponible");
  }

  const listing: LocalListing = {
    id: generateId(),
    ownerUserId: params.ownerUserId,
    title: params.title,
    type: params.type,
    priceXof: params.priceXof,
    description: params.description,
    city: params.city,
    neighborhood: params.neighborhood,
    latitude: params.latitude,
    longitude: params.longitude,
    photoDataUrls: params.photoDataUrls,
    createdAt: new Date().toISOString(),
  };

  const next = [listing, ...listAllListings()];
  storage.setItem(LISTINGS_KEY, JSON.stringify(next));
  return listing;
}

export function deleteListing(listingId: string, userId: string) {
  const storage = getBrowserStorage();
  if (!storage) return;
  const next = listAllListings().filter(
    (l) => !(l.id === listingId && l.ownerUserId === userId)
  );
  storage.setItem(LISTINGS_KEY, JSON.stringify(next));
}

export function deleteListingAsAdmin(listingId: string) {
  const storage = getBrowserStorage();
  if (!storage) return;
  const next = listAllListings().filter((l) => l.id !== listingId);
  storage.setItem(LISTINGS_KEY, JSON.stringify(next));
}

export function assertCanCreateListing(role: UserRole) {
  if (role !== "broker") {
    throw new Error("Seuls les courtiers peuvent publier une annonce");
  }
}
