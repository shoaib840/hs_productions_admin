/**
 * Client-side caching and synchronization utility for Studio Gallery Lookbook.
 * Implements two-tier caching: Fast in-memory singleton + Persistent LocalStorage.
 * Keeps cached images until Firebase Firestore data changes.
 */

export interface GalleryItem {
  id: string;
  imageUrl: string;
  cloudinaryPublicId?: string;
  createdAt?: number;
}

const CACHE_KEY = "hs_studio_gallery_cache_v2";
const HASH_KEY = "hs_studio_gallery_hash_v2";

// Tier 1: In-Memory Singleton Cache (instant 0ms retrieval)
let memoryCache: GalleryItem[] | null = null;
let memoryHash: string = "";

/**
 * Computes a lightweight deterministic hash signature from gallery items
 * to quickly compare whether Firebase data has actually changed.
 */
export function computeGalleryHash(items: GalleryItem[]): string {
  if (!items || items.length === 0) return "empty";
  // Hash based on count, first item, last item, and all item ids + updated times
  return items.map((i) => `${i.id}_${i.imageUrl}_${i.createdAt || 0}`).join("|");
}

/**
 * Preloads images into the browser cache in the background
 * so that when the gallery displays, images load instantly without flickering.
 */
export function preloadGalleryImages(items: GalleryItem[]): void {
  if (typeof window === "undefined" || !items) return;

  // Preload up to top 30 images asynchronously
  items.slice(0, 30).forEach((item) => {
    if (item.imageUrl) {
      const img = new window.Image();
      img.src = item.imageUrl;
    }
  });
}

/**
 * Retrieves cached gallery items from memory or localStorage.
 * Returns null if no cache is present.
 */
export function getCachedGallery(): { items: GalleryItem[]; hash: string } | null {
  // Check in-memory cache first
  if (memoryCache && memoryCache.length > 0) {
    return { items: memoryCache, hash: memoryHash };
  }

  // Fallback to localStorage in browser environment
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(CACHE_KEY);
      const storedHash = localStorage.getItem(HASH_KEY) || "";
      if (stored) {
        const parsed: GalleryItem[] = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          memoryCache = parsed;
          memoryHash = storedHash || computeGalleryHash(parsed);
          return { items: parsed, hash: memoryHash };
        }
      }
    } catch (e) {
      console.warn("Failed to read gallery from localStorage cache:", e);
    }
  }

  return null;
}

/**
 * Saves gallery items to both memory and localStorage cache,
 * and triggers background preloading into browser image cache.
 */
export function setCachedGallery(items: GalleryItem[]): void {
  const hash = computeGalleryHash(items);

  // If already matching current cache, no write needed
  if (memoryHash === hash && memoryCache) {
    return;
  }

  memoryCache = items;
  memoryHash = hash;

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(items));
      localStorage.setItem(HASH_KEY, hash);
    } catch (e) {
      console.warn("Failed to write gallery to localStorage cache:", e);
    }
  }

  // Preload into browser image cache
  preloadGalleryImages(items);
}

/**
 * Clears the gallery cache from both memory and localStorage.
 */
export function clearGalleryCache(): void {
  memoryCache = null;
  memoryHash = "";
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(HASH_KEY);
    } catch (e) {
      // Ignore
    }
  }
}
