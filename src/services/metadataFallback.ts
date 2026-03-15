/**
 * Metadata fallback service – recover missing artwork and metadata from TMDb/TheTVDB/Google Books/Comic Vine/MusicBrainz
 *
 * Lookup order per spec: primary source -> local cache -> TMDb -> TheTVDB -> default poster.
 * Music items can use MusicBrainz (no API key). This module composes the per-provider clients
 * (see services/metadata/*) and applies cache storage for TMDb poster/backdrop.
 */

import type { MediaItem } from '../types';
import { cacheService } from './cache';
import { fetchTmdbEnrich, testTmdbApiKey } from './metadata/tmdb';
import { fetchTvdbEnrich, testTvdbApiKey } from './metadata/tvdb';
import { fetchGoogleBooksEnrich, testGoogleBooksApiKey } from './metadata/googlebooks';
import { testComicVineApiKey } from './metadata/comicvine';
import { fetchMusicBrainzEnrich, testMusicBrainzApiKey } from './metadata/musicbrainz';

/**
 * Try to fill in poster/backdrop/tagline/plot/year from TMDb by movie or TV ID.
 * Returns a partial update to merge into the existing MediaItem, or null if nothing found.
 */
export async function enrichFromTmdb(
  apiKey: string,
  item: MediaItem,
  cacheBucket: 'primary' | 'backdrop' = 'primary'
): Promise<Partial<MediaItem> | null> {
  const update = await fetchTmdbEnrich(apiKey, item);
  if (!update) return null;
  if (update.posterUrl) {
    const id = item.tmdbId || item.id;
    const cacheKey = `tmdb_${item.type}_${id}`;
    cacheService.set(cacheBucket, cacheKey + '_poster', update.posterUrl);
  }
  if (update.backdropUrl) {
    const id = item.tmdbId || item.id;
    const cacheKey = `tmdb_${item.type}_${id}`;
    cacheService.set('backdrop', cacheKey + '_backdrop', update.backdropUrl);
  }
  return update;
}

/**
 * TheTVDB v4 – series metadata and poster. Requires tvdbId on the item.
 */
export async function enrichFromTvdb(
  apiKey: string,
  item: MediaItem
): Promise<Partial<MediaItem> | null> {
  return fetchTvdbEnrich(apiKey, item);
}

/**
 * Google Books – used mainly for Book items when the primary source is missing
 * metadata like description, publisher, author, etc.
 */
export async function enrichFromGoogleBooks(
  apiKey: string,
  item: MediaItem
): Promise<Partial<MediaItem> | null> {
  return fetchGoogleBooksEnrich(apiKey, item);
}

/**
 * MusicBrainz – Music (album/release) metadata and cover art. Uses OAuth client ID and secret.
 */
export async function enrichFromMusicBrainz(
  item: MediaItem,
  oauth?: { clientId?: string; clientSecret?: string }
): Promise<Partial<MediaItem> | null> {
  return fetchMusicBrainzEnrich(item, oauth);
}

/** Test API keys (used by Metadata settings page). */
export {
  testTmdbApiKey,
  testTvdbApiKey,
  testGoogleBooksApiKey,
  testComicVineApiKey,
  testMusicBrainzApiKey,
};
