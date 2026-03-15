/**
 * Google Books metadata – enrich book items, test API key.
 */

import type { MediaItem } from '../../types';
import { postJson } from './api';

export async function fetchGoogleBooksEnrich(
  apiKey: string,
  item: MediaItem
): Promise<Partial<MediaItem> | null> {
  if (item.type !== 'Book') return null;
  return postJson<Partial<MediaItem>>('/api/metadata/googlebooks/enrich', {
    apiKey,
    item,
  });
}

export async function testGoogleBooksApiKey(apiKey: string): Promise<boolean> {
  const data = await postJson<{ ok: boolean }>(
    '/api/metadata/googlebooks/test',
    { apiKey }
  );
  return !!data?.ok;
}
