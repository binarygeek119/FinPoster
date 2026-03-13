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

const JF_MEDIA_TYPES: Record<MediaType, string> = {
  Movie: 'Movie',
  Series: 'Series',
  Music: 'Music',
  Book: 'Book',
};

/** Build auth header for Jellyfin (API key or auth token). */
function authHeader(apiKey: string): Record<string, string> {
  return { 'X-Emby-Token': apiKey };
}

/** Get base URL without trailing slash. */
function baseUrl(serverUrl: string): string {
  return serverUrl.replace(/\/$/, '');
}

/**
 * Fetch and parse JSON from Jellyfin. Returns null on any error so callers
 * can implement fallback without try/catch everywhere.
 */
async function jfFetch<T>(
  serverUrl: string,
  apiKey: string,
  path: string
): Promise<T | null> {
  const url = `${baseUrl(serverUrl)}${path.startsWith('/') ? path : `/${path}`}`;
  try {
    const res = await fetch(url, {
      headers: { ...authHeader(apiKey), 'Content-Type': 'application/json' },
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
  apiKey: string
): Promise<{ id: string; name: string; type: string }[]> {
  const data = await jfFetch<{ Items?: JFLibrary[] }>(
    serverUrl,
    apiKey,
    '/Users/Public/Views'
  );
  if (!data?.Items?.length) return [];
  return data.Items.filter((l) => l.Id).map((l) => ({
    id: l.Id!,
    name: l.Name || 'Unnamed',
    type: l.CollectionType || '',
  }));
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
  limit: number
): Promise<MediaItem[]> {
  const fields = 'ProviderIds,Overview,Taglines,ProductionYear,CommunityRating,Studios,People';
  const includeItemTypes = types.map((t) => JF_MEDIA_TYPES[t]).join(',');
  const path = `/Users/Public/Items?ParentId=${encodeURIComponent(libraryId)}&IncludeItemTypes=${includeItemTypes}&Fields=${fields}&Limit=${limit}`;
  const data = await jfFetch<{ Items?: JFItem[]; TotalRecordCount?: number }>(
    serverUrl,
    apiKey,
    path
  );
  if (!data?.Items?.length) return [];

  const base = baseUrl(serverUrl);
  const items: MediaItem[] = [];

  for (const it of data.Items) {
    if (!it.Id) continue;
    const imgPath = (tag?: string) =>
      tag ? `${base}/Items/${it.Id}/Images/${tag}` : undefined;
    const posterTag = it.ImageTags?.Primary;
    const backdropTags = it.ImageTags?.Backdrop;
    const logoTag = it.ImageTags?.Logo;

    const mediaType = (it.Type as MediaType) || 'Movie';
    const studio = it.Studios?.[0]?.Name;
    const artist = it.AlbumArtist || it.People?.find((p) => p.Type === 'Artist')?.Name;
    const author = it.People?.find((p) => p.Type === 'Author')?.Name;

    items.push({
      id: it.Id,
      tmdbId: it.ProviderIds?.Tmdb,
      tvdbId: it.ProviderIds?.Tvdb,
      type: mediaType,
      title: it.Name || 'Unknown',
      tagline: it.Taglines?.[0],
      plot: it.Overview,
      year: it.ProductionYear,
      rating: it.CommunityRating != null ? String(it.CommunityRating) : undefined,
      studio,
      artist,
      author,
      posterUrl: imgPath(posterTag),
      backdropUrl: backdropTags?.[0] ? imgPath(backdropTags[0]) : undefined,
      logoUrl: logoTag ? imgPath(logoTag) : undefined,
      source: 'jellyfin',
    });
  }

  return items;
}

/**
 * Get a single item by ID (e.g. for "currently playing" or manual ID lookup).
 */
export async function getJellyfinItem(
  serverUrl: string,
  apiKey: string,
  itemId: string
): Promise<MediaItem | null> {
  const path = `/Users/Public/Items/${itemId}?Fields=ProviderIds,Overview,Taglines,ProductionYear,CommunityRating,Studios,People,ImageTags`;
  const it = await jfFetch<JFItem>(serverUrl, apiKey, path);
  if (!it?.Id) return null;

  const base = baseUrl(serverUrl);
  const imgPath = (tag?: string) =>
    tag ? `${base}/Items/${it.Id}/Images/${tag}` : undefined;

  return {
    id: it.Id,
    tmdbId: it.ProviderIds?.Tmdb,
    tvdbId: it.ProviderIds?.Tvdb,
    type: (it.Type as MediaType) || 'Movie',
    title: it.Name || 'Unknown',
    tagline: it.Taglines?.[0],
    plot: it.Overview,
    year: it.ProductionYear,
    rating: it.CommunityRating != null ? String(it.CommunityRating) : undefined,
    studio: it.Studios?.[0]?.Name,
    artist: it.AlbumArtist || it.People?.find((p) => p.Type === 'Artist')?.Name,
    author: it.People?.find((p) => p.Type === 'Author')?.Name,
    posterUrl: imgPath(it.ImageTags?.Primary),
    backdropUrl: it.ImageTags?.Backdrop?.[0] ? imgPath(it.ImageTags.Backdrop[0]) : undefined,
    logoUrl: it.ImageTags?.Logo ? imgPath(it.ImageTags.Logo) : undefined,
    source: 'jellyfin',
  };
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
  const data = await jfFetch<{ Items?: { Id?: string }[] }>(
    serverUrl,
    apiKey,
    `/Users/${userId}/PlayingItems`
  );
  if (!data?.Items?.length) return [];
  return data.Items.map((i) => i.Id).filter(Boolean) as string[];
}
