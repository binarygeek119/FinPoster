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

const DEV_BACKEND_BASE = 'http://localhost:3000';

function backendBaseUrl(): string {
  if (import.meta.env.DEV) {
    return DEV_BACKEND_BASE;
  }
  return window.location.origin;
}

const JF_MEDIA_TYPES: Record<MediaType, string> = {
  Movie: 'Movie',
  Series: 'Series',
  Music: 'Music',
  Book: 'Book',
  Photo: 'Photo',
  People: 'Person',
};

async function postJson<T>(path: string, body: unknown): Promise<T | null> {
  try {
    const res = await fetch(`${backendBaseUrl()}${path}`, {
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

/** Jellyfin library (we need Id and Name). */
interface JFLibrary {
  Id?: string;
  Name?: string;
  CollectionType?: string;
}

/** Jellyfin item from /Items endpoint. */
interface JFItem {
  Id?: string;
  Name?: string;
  Type?: string;
  Taglines?: string[];
  Overview?: string;
  ProductionYear?: number;
  CommunityRating?: number;
  Studios?: { Name?: string }[];
  ProviderIds?: { Tmdb?: string; Tvdb?: string };
  ImageTags?: { Primary?: string; Backdrop?: string[]; Logo?: string };
  SeriesName?: string;
  AlbumArtist?: string;
  People?: { Name?: string; Type?: string }[];
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
 */
export async function getJellyfinLibraryItems(
  serverUrl: string,
  apiKey: string,
  libraryId: string,
  types: MediaType[],
  limit: number,
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
    studio?: string;
    posterUrl?: string;
    backdropUrl?: string;
    logoUrl?: string;
  }[]>('/api/jellyfin/items', {
    serverUrl,
    apiKey,
    libraryId,
    types: includeTypes,
    limit,
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
    studio: it.studio,
    artist: undefined,
    author: undefined,
    posterUrl: it.posterUrl,
    backdropUrl: it.backdropUrl,
    logoUrl: it.logoUrl,
    source: 'jellyfin',
  }));
}

/**
 * Get a single item by ID (e.g. for "currently playing" or manual ID lookup).
 */
export async function getJellyfinItem(
  serverUrl: string,
  apiKey: string,
  itemId: string,
  userId?: string
): Promise<MediaItem | null> {
  // For now, just re-use the client-side fetch path if needed or return null.
  // Backend does not yet expose a single-item endpoint.
  return null;
}

/**
 * Optional: fetch "now playing" for a user/device to prioritize currently
 * playing media in Media Showcase. Returns item IDs or null if not implemented.
 */
export async function getNowPlayingItemIds(
  serverUrl: string,
  apiKey: string,
  userId: string
): Promise<string[]> {
  // Not yet proxied; keep using direct Jellyfin when we add Now Playing support.
  return [];
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
