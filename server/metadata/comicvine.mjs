/**
 * Comic Vine metadata routes – test API key, enrich comics/graphic novels.
 * Caches poster images with filename comicvine_<id>.
 */

export function registerComicVineRoutes(app, { downloadImageToCache }) {
  app.post('/api/metadata/comicvine/test', async (req, res) => {
    const { apiKey } = req.body || {};
    if (!apiKey) {
      res.json({ ok: false });
      return;
    }
    try {
      const url =
        `https://comicvine.gamespot.com/api/issues/?api_key=${encodeURIComponent(
          apiKey,
        )}&format=json&field_list=id&limit=1`;
      const r = await fetch(url, {
        headers: {
          'User-Agent': 'FinPoster/1.0 (metadata check)',
        },
      });
      res.json({ ok: r.ok });
    } catch {
      res.json({ ok: false });
    }
  });

  app.post('/api/metadata/comicvine/enrich', async (req, res) => {
    const { apiKey, item } = req.body || {};
    if (!apiKey || !item || !item.title) {
      res.status(400).json({ error: 'Missing apiKey or item title' });
      return;
    }
    try {
      const url =
        `https://comicvine.gamespot.com/api/search/?api_key=${encodeURIComponent(
          apiKey,
        )}&format=json&resources=issue&field_list=name,deck,image,cover_date&limit=1&query=${encodeURIComponent(
          item.title,
        )}`;
      const r = await fetch(url, {
        headers: {
          'User-Agent': 'FinPoster/1.0 (metadata enrich)',
        },
      });
      if (!r.ok) {
        res.status(502).json({ error: 'Comic Vine request failed' });
        return;
      }
      const data = await r.json();
      const issue = data?.results?.[0];
      if (!issue) {
        res.json({});
        return;
      }
      const update = {};
      if (!item.plot && issue.deck) update.plot = issue.deck;
      if (!item.year && issue.cover_date) {
        const yearStr = String(issue.cover_date).slice(0, 4);
        if (yearStr) update.year = parseInt(yearStr, 10);
      }
      if (!item.posterUrl && issue.image?.original_url) {
        const comicvineId = String(issue.id ?? 'unknown');
        const cached = await downloadImageToCache(
          issue.image.original_url,
          'primary',
          { keyHint: `comicvine_${comicvineId}` }
        );
        update.posterUrl = cached || issue.image.original_url;
      }
      res.json(update);
    } catch (e) {
      res.status(502).json({ error: String(e) });
    }
  });
}
