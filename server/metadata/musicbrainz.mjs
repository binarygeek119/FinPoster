/**
 * MusicBrainz metadata routes – enrich Music items (album/release), test connectivity.
 * Uses OAuth client ID and client secret from musicbrainz.org/account/applications (Client ID used in User-Agent).
 */

const DEFAULT_USER_AGENT = 'FinPoster/1.0 (https://github.com/finposter)';

function getUserAgent(clientId) {
  const id = (clientId && String(clientId).trim()) || '';
  return id ? `FinPoster/1.0 (client_id: ${id})` : DEFAULT_USER_AGENT;
}

function mbFetch(url, userAgent = DEFAULT_USER_AGENT) {
  return fetch(url, {
    headers: { 'User-Agent': userAgent },
  });
}

export function registerMusicBrainzRoutes(app, { downloadImageToCache }) {
  app.post('/api/metadata/musicbrainz/test', async (req, res) => {
    const clientId = (req.body?.clientId || '').trim();
    const userAgent = getUserAgent(clientId);
    try {
      const r = await mbFetch(
        'https://musicbrainz.org/ws/2/artist/?query=test&fmt=json&limit=1',
        userAgent
      );
      res.json({ ok: r.ok });
    } catch {
      res.json({ ok: false });
    }
  });

  app.post('/api/metadata/musicbrainz/enrich', async (req, res) => {
    const { item, clientId } = req.body || {};
    const userAgent = getUserAgent(clientId);
    if (!item || item.type !== 'Music') {
      res.status(400).json({ error: 'Missing or invalid item (type must be Music)' });
      return;
    }
    const title = (item.title || '').trim();
    const artist = (item.artist || '').trim();
    if (!title) {
      res.json({});
      return;
    }
    try {
      const queryParts = [`release:${title}`];
      if (artist) queryParts.push(`artist:${artist}`);
      const queryStr = queryParts.join(' AND ');
      const searchUrl = `https://musicbrainz.org/ws/2/release/?query=${encodeURIComponent(
        queryStr
      )}&fmt=json&limit=1`;
      const searchRes = await mbFetch(searchUrl, userAgent);
      if (!searchRes.ok) {
        res.status(502).json({ error: 'MusicBrainz search failed' });
        return;
      }
      const searchData = await searchRes.json();
      const release = searchData?.releases?.[0];
      if (!release?.id) {
        res.json({});
        return;
      }
      const mbid = release.id;
      const update = {};
      if (!item.year && release.date) {
        const yearStr = String(release.date).slice(0, 4);
        if (yearStr) update.year = parseInt(yearStr, 10);
      }
      if (!item.artist && release['artist-credit']?.length) {
        const name = release['artist-credit'][0].artist?.name || release['artist-credit'][0].name;
        if (name) update.artist = name;
      }
      if (!item.posterUrl) {
        const coverRes = await fetch(
          `https://coverartarchive.org/release/${mbid}`,
          { headers: { 'User-Agent': userAgent } }
        );
        if (coverRes.ok) {
          const coverData = await coverRes.json();
          const front = coverData?.images?.find((img) => img.front === true);
          const imageUrl = front?.image || front?.thumb;
          if (imageUrl) {
            const cached = await downloadImageToCache(imageUrl, 'primary', {
              keyHint: `musicbrainz_${mbid}`,
            });
            update.posterUrl = cached || imageUrl;
          }
        }
      }
      res.json(update);
    } catch (e) {
      res.status(502).json({ error: String(e) });
    }
  });
}
