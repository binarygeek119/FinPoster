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

/** TMDb config response (base URL for images). */
let tmdbImageBase: string | null = null;

async function getTmdbConfig(apiKey: string): Promise<string | null> {
  if (tmdbImageBase) return tmdbImageBase;
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/configuration?api_key=${apiKey}`
    );
    const data = await res.json();
    const base = data?.images?.secure_base_url;
    const size = data?.images?.poster_sizes?.find((s: string) => s === 'w500') || 'w500';
    if (base) {
      tmdbImageBase = `${base}${size}`;
      return tmdbImageBase;
    }
  } catch {
    // ignore
  }
  return null;
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

  const type = item.type === 'Series' ? 'tv' : 'movie';
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/${type}/${id}?api_key=${apiKey}&language=en-US`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const base = await getTmdbConfig(apiKey);
    const posterPath = data.poster_path;
    const backdropPath = data.backdrop_path;
    const update: Partial<MediaItem> = {
      tagline: item.tagline || data.tagline || undefined,
      plot: item.plot || data.overview || undefined,
      year: item.year || (data.release_date || data.first_air_date || '').slice(0, 4) ? parseInt((data.release_date || data.first_air_date || '').slice(0, 4), 10) : undefined,
    };
    if (base && posterPath) {
      update.posterUrl = base + posterPath;
      cacheService.set(cacheBucket, cacheKey + '_poster', update.posterUrl);
    }
    if (base && backdropPath) {
      update.backdropUrl = `https://image.tmdb.org/t/p/original${backdropPath}`;
      cacheService.set('backdrop', cacheKey + '_backdrop', update.backdropUrl);
    }
    cacheService.set('metadata', cacheKey, JSON.stringify(update));
    return update;
  } catch {
    return null;
  }
}

/**
 * TheTVDB is more complex (v4 API requires token). Placeholder: we could add
 * token fetch and then series/poster endpoints. For now we just return null
 * so the fallback chain continues to default poster.
 */
export async function enrichFromTvdb(
  _apiKey: string,
  _item: MediaItem
): Promise<Partial<MediaItem> | null> {
  // TODO: implement TheTVDB v4 auth and lookup when needed
  return null;
}
