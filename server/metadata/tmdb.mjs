/**
 * TMDb metadata routes – enrich movie/series details and images, test API key.
 */

export function registerTmdbRoutes(app, { downloadImageToCache }) {
  app.post('/api/metadata/tmdb/enrich', async (req, res) => {
    const { apiKey, item } = req.body || {};
    if (!apiKey || !item || !item.id || !item.type) {
      res.status(400).json({ error: 'Missing apiKey or item' });
      return;
    }
    const tmdbId = item.tmdbId || item.id;
    const type = item.type === 'Series' ? 'tv' : 'movie';
    try {
      const cfgRes = await fetch(
        `https://api.themoviedb.org/3/configuration?api_key=${encodeURIComponent(apiKey)}`,
      );
      if (!cfgRes.ok) {
        res.status(502).json({ error: 'TMDb config failed' });
        return;
      }
      const cfg = await cfgRes.json();
      const base = cfg?.images?.secure_base_url;
      const size =
        (cfg?.images?.poster_sizes || []).find((s) => s === 'w500') || 'w500';

      const resItem = await fetch(
        `https://api.themoviedb.org/3/${type}/${encodeURIComponent(
          tmdbId,
        )}?api_key=${encodeURIComponent(apiKey)}&language=en-US`,
      );
      if (!resItem.ok) {
        res.status(502).json({ error: 'TMDb item fetch failed' });
        return;
      }
      const data = await resItem.json();
      const posterPath = data.poster_path;
      const backdropPath = data.backdrop_path;

      const update = {};
      if (!item.tagline && data.tagline) update.tagline = data.tagline;
      if (!item.plot && data.overview) update.plot = data.overview;
      if (!item.year) {
        const yearStr = (data.release_date || data.first_air_date || '').slice(0, 4);
        if (yearStr) update.year = parseInt(yearStr, 10);
      }
      if (base && posterPath && !item.posterUrl) {
        const url = `${base}${size}${posterPath}`;
        const cached = await downloadImageToCache(url, 'primary', { keyHint: `tmdb_${tmdbId}` });
        update.posterUrl = cached || url;
      }
      if (backdropPath && !item.backdropUrl) {
        const url = `https://image.tmdb.org/t/p/original${backdropPath}`;
        const cached = await downloadImageToCache(url, 'backdrop', { keyHint: `tmdb_${tmdbId}` });
        update.backdropUrl = cached || url;
      }
      res.json(update);
    } catch (e) {
      res.status(502).json({ error: String(e) });
    }
  });

  app.post('/api/metadata/tmdb/test', async (req, res) => {
    const { apiKey } = req.body || {};
    if (!apiKey) {
      res.json({ ok: false });
      return;
    }
    try {
      const r = await fetch(
        `https://api.themoviedb.org/3/configuration?api_key=${encodeURIComponent(apiKey)}`,
      );
      res.json({ ok: r.ok });
    } catch {
      res.json({ ok: false });
    }
  });
}
