/**
 * TMDb metadata – enrich movie/series from TMDb, test API key.
 */

import type { MediaItem } from '../../types';
import { postJson } from './api';

export async function fetchTmdbEnrich(
  apiKey: string,
  item: MediaItem
): Promise<Partial<MediaItem> | null> {
  if (!apiKey) return null;
  return postJson<Partial<MediaItem>>('/api/metadata/tmdb/enrich', {
    apiKey,
    item,
  });
}

export async function testTmdbApiKey(apiKey: string): Promise<boolean> {
  if (!apiKey) return false;
  const data = await postJson<{ ok: boolean }>('/api/metadata/tmdb/test', {
    apiKey,
  });
  return !!data?.ok;
}
