/**
 * Jellyfin API client – primary media source for FinPoster
 *
 * This module talks to the user's Jellyfin server to fetch libraries, items,
 * and artwork. We normalize responses into our MediaItem type so the rest of
 * the app doesn't need to know Jellyfin's response shape. If the server is
 * not configured or returns errors, callers should fall back to cache/metadata
 * services or the default poster display.
 */

import type { MediaItem, MediaType } from '../types';
import { logDebug } from './logger';

/** In dev we use relative URLs so Vite proxies /api and /cache to the backend (no CORS). */
export function apiBaseUrl(): string {
  if (import.meta.env.DEV) return '';
  return window.location.origin;
}

/** Resolve cache/asset URLs. Uses relative paths so in dev Vite proxies /cache to backend; in prod same origin. */
export function resolveAssetUrl(url: string | undefined): string {
  if (!url) return '';
  return url;
}

const JF_MEDIA_TYPES: Record<MediaType, string> = {
  Movie: 'Movie',
  Series: 'Series',
  Music: 'Music',
  Book: 'Book',
  Photo: 'Photo',
  People: 'Person',
};

const base = () => apiBaseUrl();

async function postJson<T>(path: string, body: unknown): Promise<T | null> {
  try {
    const res = await fetch(`${base()}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function getJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${base()}${path}`);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/**
 * Load media from the backend cache only (cache-first). Returns items stored
 * from previous syncs (Jellyfin/TMDb fill the cache; display reads only from here).
 */
export async function getCachedMedia(
  source?: string,
  limit = 50
): Promise<MediaItem[]> {
  const params = new URLSearchParams();
  const safeLimit = Math.min(Math.max(1, Number(limit) || 50), 500);
  params.set('limit', String(safeLimit));
  if (source) params.set('source', source);
  const q = params.toString();
  const data = await getJson<{
    id: string;
    title: string;
    type?: string;
    tagline?: string;
    plot?: string;
    year?: number;
    rating?: string;
    communityRating?: number;
    studio?: string;
    posterUrl?: string;
    backdropUrl?: string;
    logoUrl?: string;
    runtime?: string;
    cast?: Array<{ name: string; role?: string }>;
    source: string;
  }[]>(`/api/media${q ? `?${q}` : ''}`);
  if (!data?.length) {
    logDebug('getCachedMedia: no items', source ?? 'any', limit);
    return [];
  }
  logDebug('getCachedMedia: got', data.length, 'items', source ?? 'any');
  return data.map((it) => ({
    id: it.id,
    tmdbId: undefined,
    tvdbId: undefined,
    type: (it.type as MediaType) || 'Movie',
    title: it.title || 'Unknown',
    tagline: it.tagline,
    plot: it.plot,
    year: it.year,
    rating: it.rating,
    communityRating: it.communityRating,
    studio: it.studio,
    artist: undefined,
    author: undefined,
    posterUrl: it.posterUrl,
    backdropUrl: it.backdropUrl,
    logoUrl: it.logoUrl,
    runtime: it.runtime,
    cast: it.cast,
    source: it.source as MediaItem['source'],
  }));
}

/** Get libraries for the server (used in settings to let user pick which to use). */
export async function getJellyfinLibraries(
  serverUrl: string,
  apiKey: string,
  userId?: string
): Promise<{ id: string; name: string; type: string }[]> {
  const data = await postJson<{ id: string; name: string; type: string }[]>(
    '/api/jellyfin/libraries',
    { serverUrl, apiKey, userId }
  );
  return data ?? [];
}

/**
 * Fetch items from a single library. Used to build the pool for Media Showcase
 * and Now Showing when source is Jellyfin.
 * @param limit - 0 or omit = sync full library (small requests until done); >0 = max items to fetch.
 */
export async function getJellyfinLibraryItems(
  serverUrl: string,
  apiKey: string,
  libraryId: string,
  types: MediaType[],
  limit: number = 0,
  userId?: string
): Promise<MediaItem[]> {
  const includeTypes = types.map((t) => JF_MEDIA_TYPES[t]);
  const data = await postJson<{
    id: string;
    title: string;
    type?: string;
    tagline?: string;
    plot?: string;
    year?: number;
    rating?: string;
    communityRating?: number;
    studio?: string;
    posterUrl?: string;
    backdropUrl?: string;
    logoUrl?: string;
    runtime?: string;
    cast?: Array<{ name: string; role?: string }>;
  }[]>('/api/jellyfin/items', {
    serverUrl,
    apiKey,
    libraryId,
    types: includeTypes,
    limit: limit <= 0 ? 0 : limit,
    userId,
  });
  if (!data?.length) return [];
  return data.map((it) => ({
    id: it.id,
    tmdbId: undefined,
    tvdbId: undefined,
    type: (it.type as MediaType) || 'Movie',
    title: it.title || 'Unknown',
    tagline: it.tagline,
    plot: it.plot,
    year: it.year,
    rating: it.rating,
    communityRating: it.communityRating,
    studio: it.studio,
    artist: undefined,
    author: undefined,
    posterUrl: it.posterUrl,
    backdropUrl: it.backdropUrl,
    logoUrl: it.logoUrl,
    runtime: it.runtime,
    cast: it.cast,
    source: 'jellyfin',
  }));
}

/**
 * Fetch a single item by ID from Jellyfin and cache its images (poster, backdrop, logo).
 * Used when playback shows an item whose poster is not yet cached.
 */
export async function getJellyfinItem(
  serverUrl: string,
  apiKey: string,
  itemId: string,
  userId?: string
): Promise<MediaItem | null> {
  const data = await postJson<{
    id: string;
    title: string;
    type?: string;
    tagline?: string;
    plot?: string;
    year?: number;
    rating?: string;
    studio?: string;
    posterUrl?: string;
    backdropUrl?: string;
    logoUrl?: string;
    cast?: Array<{ name: string; role?: string }>;
  } | null>('/api/jellyfin/item', {
    serverUrl,
    apiKey,
    itemId,
    userId: userId ?? '',
  });
  if (!data) return null;
  return {
    id: data.id,
    tmdbId: undefined,
    tvdbId: undefined,
    type: (data.type as MediaType) || 'Movie',
    title: data.title || 'Unknown',
    tagline: data.tagline,
    plot: data.plot,
    year: data.year,
    rating: data.rating,
    studio: data.studio,
    artist: undefined,
    author: undefined,
    posterUrl: data.posterUrl,
    backdropUrl: data.backdropUrl,
    logoUrl: data.logoUrl,
    cast: data.cast,
    source: 'jellyfin',
  };
}

/** Result from getNowPlaying when something is playing. */
export interface NowPlayingResult {
  itemId: string;
  progress: number;
  isPaused: boolean;
}

/**
 * Fetch current "now playing" from Jellyfin Sessions (proxied). Returns the
 * first active session's item and progress, or null if nothing is playing.
 */
export async function getNowPlaying(
  serverUrl: string,
  apiKey: string,
  userId?: string,
  watchIds?: string[]
): Promise<NowPlayingResult | null> {
  if (!serverUrl || !apiKey) return null;
  const data = await postJson<{
    itemId: string;
    progress: number;
    isPaused: boolean;
  } | null>('/api/jellyfin/now-playing', {
    serverUrl,
    apiKey,
    userId: userId ?? '',
    watchIds: watchIds ?? [],
  });
  if (!data?.itemId) return null;
  return {
    itemId: data.itemId,
    progress: typeof data.progress === 'number' ? data.progress : 0,
    isPaused: !!data.isPaused,
  };
}

/**
 * Simple connectivity test used by the Jellyfin settings \"Test\" button.
 * We call the /System/Info endpoint, which does not require a specific user,
 * and return true if the server responds successfully.
 */
export async function testJellyfinConnection(
  serverUrl: string,
  apiKey: string
): Promise<boolean> {
  if (!serverUrl || !apiKey) return false;
  const data = await postJson<{ ok: boolean }>('/api/jellyfin/test', {
    serverUrl,
    apiKey,
  });
  return !!data?.ok;
}
