/**
 * Metadata fallback service – recover missing artwork and metadata from TMDb/TheTVDB
 *
 * Lookup order per spec: primary source -> local cache -> TMDb -> TheTVDB -> default poster.
 * This module handles the TMDb and TheTVDB steps. We use the public APIs with the user's
 * API keys from settings. If keys are missing or a request fails, callers should fall
 * back to the next step (e.g. default poster). Cache is used to store results so we
 * don't hammer the APIs on every load.
 */

import type { MediaItem } from '../types';
import { cacheService } from './cache';

const DEV_BACKEND_BASE = 'http://localhost:3000';

function backendBaseUrl(): string {
  if (import.meta.env.DEV) {
    return DEV_BACKEND_BASE;
  }
  return window.location.origin;
}

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

/**
 * Try to fill in poster/backdrop/tagline/plot/year from TMDb by movie or TV ID.
 * Returns a partial update to merge into the existing MediaItem, or null if nothing found.
 */
export async function enrichFromTmdb(
  apiKey: string,
  item: MediaItem,
  cacheBucket: 'primary' | 'backdrop' = 'primary'
): Promise<Partial<MediaItem> | null> {
  if (!apiKey) return null;
  const id = item.tmdbId || item.id;
  const cacheKey = `tmdb_${item.type}_${id}`;
  const cached = cacheService.get('metadata', cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached) as Partial<MediaItem>;
    } catch {
      // ignore
    }
  }

  const update = await postJson<Partial<MediaItem>>('/api/metadata/tmdb/enrich', {
    apiKey,
    item,
  });
  if (!update) return null;
  cacheService.set('metadata', cacheKey, JSON.stringify(update));
  if (update.posterUrl) {
    cacheService.set(cacheBucket, cacheKey + '_poster', update.posterUrl);
  }
  if (update.backdropUrl) {
    cacheService.set('backdrop', cacheKey + '_backdrop', update.backdropUrl);
  }
  return update;
}

/**
 * TheTVDB is more complex (v4 API requires token). Placeholder: we could add
 * token fetch and then series/poster endpoints. For now we just return null
 * so the fallback chain continues to default poster.
 */
export async function enrichFromTvdb(
  apiKey: string,
  item: MediaItem
): Promise<Partial<MediaItem> | null> {
  if (!apiKey || !item.tvdbId) return null;
  const cacheKey = `tvdb_${item.tvdbId}`;
  const cached = cacheService.get('metadata', cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached) as Partial<MediaItem>;
    } catch {
      // ignore
    }
  }
  const update = await postJson<Partial<MediaItem>>('/api/metadata/tvdb/enrich', {
    apiKey,
    item,
  });
  if (!update) return null;
  cacheService.set('metadata', cacheKey, JSON.stringify(update));
  return update;
}

/**
 * Google Books – used mainly for Book items when the primary source is missing
 * metadata like description, publisher, author image, etc. We use volume search
 * by title and author. API key is optional but recommended.
 */
export async function enrichFromGoogleBooks(
  apiKey: string,
  item: MediaItem
): Promise<Partial<MediaItem> | null> {
  if (item.type !== 'Book') return null;
  const cacheKey = `gbooks_${item.id}`;
  const cached = cacheService.get('metadata', cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached) as Partial<MediaItem>;
    } catch {
      // ignore
    }
  }

  const update = await postJson<Partial<MediaItem>>(
    '/api/metadata/googlebooks/enrich',
    { apiKey, item }
  );
  if (!update) return null;
  cacheService.set('metadata', cacheKey, JSON.stringify(update));
  return update;
}

/**
 * Comic Vine – placeholder for comics/graphic novels metadata.
 *
 * The public Comic Vine API normally expects requests from server-side code
 * (with JSONP or CORS headers), so browser-based fetches are unreliable and can
 * easily fail due to CORS even when the key is valid. To avoid confusing users,
 * we proxy tests through the FinPoster backend instead of calling from the browser.
 */
export async function testComicVineApiKey(
  apiKey: string
): Promise<boolean> {
  if (!apiKey) return false;
  const data = await postJson<{ ok: boolean }>(
    '/api/metadata/comicvine/test',
    { apiKey }
  );
  return !!data?.ok;
}

/**
 * Simple key tests for TMDb and Google Books so the Metadata page can
 * give quick feedback when the user hits \"Test API keys\".
 */
export async function testTmdbApiKey(apiKey: string): Promise<boolean> {
  if (!apiKey) return false;
  const data = await postJson<{ ok: boolean }>('/api/metadata/tmdb/test', {
    apiKey,
  });
  return !!data?.ok;
}

export async function testGoogleBooksApiKey(apiKey: string): Promise<boolean> {
  const data = await postJson<{ ok: boolean }>(
    '/api/metadata/googlebooks/test',
    { apiKey }
  );
  return !!data?.ok;
}

export async function testTvdbApiKey(apiKey: string): Promise<boolean> {
  if (!apiKey) return false;
  const data = await postJson<{ ok: boolean }>(
    '/api/metadata/tvdb/test',
    { apiKey }
  );
  return !!data?.ok;
}
