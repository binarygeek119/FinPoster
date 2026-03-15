/**
 * MusicBrainz metadata – enrich Music items (album/release). Uses OAuth client ID and secret.
 */

import type { MediaItem } from '../../types';
import { postJson } from './api';

export interface MusicBrainzOAuth {
  clientId?: string;
  clientSecret?: string;
}

export async function fetchMusicBrainzEnrich(
  item: MediaItem,
  oauth?: MusicBrainzOAuth
): Promise<Partial<MediaItem> | null> {
  if (item.type !== 'Music') return null;
  return postJson<Partial<MediaItem>>('/api/metadata/musicbrainz/enrich', {
    item,
    clientId: oauth?.clientId ?? '',
    clientSecret: oauth?.clientSecret ?? '',
  });
}

/** Test connectivity to MusicBrainz. Pass OAuth client ID and secret. */
export async function testMusicBrainzApiKey(oauth?: MusicBrainzOAuth): Promise<boolean> {
  const data = await postJson<{ ok: boolean }>(
    '/api/metadata/musicbrainz/test',
    { clientId: oauth?.clientId ?? '', clientSecret: oauth?.clientSecret ?? '' }
  );
  return !!data?.ok;
}
