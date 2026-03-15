/**
 * TheTVDB (v4) metadata routes – enrich series metadata/poster, test API key.
 */

export function registerTvdbRoutes(app, { downloadImageToCache }) {
  app.post('/api/metadata/tvdb/test', async (req, res) => {
    const { apiKey } = req.body || {};
    if (!apiKey) {
      res.json({ ok: false });
      return;
    }
    try {
      const r = await fetch('https://api4.thetvdb.com/v4/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apikey: apiKey }),
      });
      res.json({ ok: r.ok });
    } catch {
      res.json({ ok: false });
    }
  });

  app.post('/api/metadata/tvdb/enrich', async (req, res) => {
    const { apiKey, item } = req.body || {};
    if (!apiKey || !item || !item.tvdbId) {
      res.status(400).json({ error: 'Missing apiKey or tvdbId' });
      return;
    }
    try {
      const loginRes = await fetch('https://api4.thetvdb.com/v4/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apikey: apiKey }),
      });
      if (!loginRes.ok) {
        res.status(502).json({ error: 'TVDB login failed' });
        return;
      }
      const login = await loginRes.json();
      const token = login?.data?.token;
      if (!token) {
        res.status(502).json({ error: 'TVDB token missing' });
        return;
      }
      const seriesRes = await fetch(
        `https://api4.thetvdb.com/v4/series/${encodeURIComponent(item.tvdbId)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (!seriesRes.ok) {
        res.status(502).json({ error: 'TVDB series fetch failed' });
        return;
      }
      const seriesData = await seriesRes.json();
      const data = seriesData?.data;
      const update = {};
      if (!item.tagline && data?.overview) update.tagline = data.overview;
      if (!item.plot && data?.overview) update.plot = data.overview;
      if (!item.year && data?.year) update.year = data.year;
      const artwork = Array.isArray(data?.artwork) ? data.artwork : [];
      const poster = artwork.find(
        (a) => a.type === 2 || a.type === 'poster',
      );
      if (!item.posterUrl && poster?.image) {
        const tvdbId = String(item.tvdbId || data?.id || 'unknown');
        const cached = await downloadImageToCache(poster.image, 'primary', {
          keyHint: `tvdb_${tvdbId}`,
        });
        update.posterUrl = cached || poster.image;
      }
      res.json(update);
    } catch (e) {
      res.status(502).json({ error: String(e) });
    }
  });
}
