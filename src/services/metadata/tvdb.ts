/**
 * TheTVDB metadata – enrich series from TheTVDB v4, test API key.
 */

import type { MediaItem } from '../../types';
import { postJson } from './api';

export async function fetchTvdbEnrich(
  apiKey: string,
  item: MediaItem
): Promise<Partial<MediaItem> | null> {
  if (!apiKey || !item.tvdbId) return null;
  return postJson<Partial<MediaItem>>('/api/metadata/tvdb/enrich', {
    apiKey,
    item,
  });
}

export async function testTvdbApiKey(apiKey: string): Promise<boolean> {
  if (!apiKey) return false;
  const data = await postJson<{ ok: boolean }>('/api/metadata/tvdb/test', {
    apiKey,
  });
  return !!data?.ok;
}
