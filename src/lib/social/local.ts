export type LocalLike = {
  listingId: string;
  userId: string;
  createdAt: string;
};

export type LocalComment = {
  id: string;
  listingId: string;
  userId: string;
  text: string;
  createdAt: string;
};

const LIKES_KEY = "digicode_immo_likes_v1";
const COMMENTS_KEY = "digicode_immo_comments_v1";

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

function generateId() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function listLikes(): LocalLike[] {
  const storage = getBrowserStorage();
  if (!storage) return [];
  const items = safeParse<LocalLike[]>(storage.getItem(LIKES_KEY));
  return Array.isArray(items) ? items : [];
}

export function listComments(): LocalComment[] {
  const storage = getBrowserStorage();
  if (!storage) return [];
  const items = safeParse<LocalComment[]>(storage.getItem(COMMENTS_KEY));
  return Array.isArray(items) ? items : [];
}

export function getLikeCount(listingId: string): number {
  return listLikes().filter((l) => l.listingId === listingId).length;
}

export function hasLiked(listingId: string, userId: string): boolean {
  return listLikes().some((l) => l.listingId === listingId && l.userId === userId);
}

export function toggleLike(listingId: string, userId: string) {
  const storage = getBrowserStorage();
  if (!storage) {
    throw new Error("Stockage local indisponible");
  }
  const items = listLikes();
  const exists = items.some((l) => l.listingId === listingId && l.userId === userId);
  const next = exists
    ? items.filter((l) => !(l.listingId === listingId && l.userId === userId))
    : [{ listingId, userId, createdAt: nowIso() }, ...items];

  storage.setItem(LIKES_KEY, JSON.stringify(next));
}

export function listCommentsForListing(listingId: string): LocalComment[] {
  return listComments()
    .filter((c) => c.listingId === listingId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function addComment(listingId: string, userId: string, text: string) {
  const storage = getBrowserStorage();
  if (!storage) {
    throw new Error("Stockage local indisponible");
  }
  if (!text.trim()) throw new Error("Commentaire vide");
  const comment: LocalComment = {
    id: generateId(),
    listingId,
    userId,
    text: text.trim(),
    createdAt: nowIso(),
  };
  const next = [comment, ...listComments()];
  storage.setItem(COMMENTS_KEY, JSON.stringify(next));
  return comment;
}
