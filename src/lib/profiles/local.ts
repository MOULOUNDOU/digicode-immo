import type { UserRole } from "@/lib/auth/local";

export type LocalProfile = {
  userId: string;
  role: UserRole;
  displayName: string;
  avatarDataUrl?: string;
  phone?: string;
  whatsapp?: string;
  city?: string;
  createdAt: string;
  updatedAt: string;
};

const PROFILES_KEY = "digicode_immo_profiles_v1";

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

function nowIso() {
  return new Date().toISOString();
}

export function listProfiles(): LocalProfile[] {
  const storage = getBrowserStorage();
  if (!storage) return [];
  const items = safeParse<LocalProfile[]>(storage.getItem(PROFILES_KEY));
  return Array.isArray(items) ? items : [];
}

export function getProfile(userId: string): LocalProfile | null {
  return listProfiles().find((p) => p.userId === userId) ?? null;
}

export function upsertProfile(profile: Omit<LocalProfile, "createdAt" | "updatedAt">) {
  const storage = getBrowserStorage();
  if (!storage) {
    throw new Error("Stockage local indisponible");
  }
  const items = listProfiles();
  const existing = items.find((p) => p.userId === profile.userId);
  const next: LocalProfile = existing
    ? { ...existing, ...profile, updatedAt: nowIso() }
    : {
        ...profile,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };

  const out = [next, ...items.filter((p) => p.userId !== profile.userId)];
  storage.setItem(PROFILES_KEY, JSON.stringify(out));
  return next;
}

export async function fileToDataUrl(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Impossible de lire le fichier"));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}
