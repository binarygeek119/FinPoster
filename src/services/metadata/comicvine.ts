/**
 * Comic Vine metadata – test API key (enrich is server-only; client can call enrich via generic POST if needed).
 */

import { postJson } from './api';

export async function testComicVineApiKey(apiKey: string): Promise<boolean> {
  if (!apiKey) return false;
  const data = await postJson<{ ok: boolean }>(
    '/api/metadata/comicvine/test',
    { apiKey }
  );
  return !!data?.ok;
}
