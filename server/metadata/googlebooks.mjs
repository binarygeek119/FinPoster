/**
 * Google Books metadata routes – enrich book metadata/poster, test API key.
 */

export function registerGoogleBooksRoutes(app, { downloadImageToCache }) {
  app.post('/api/metadata/googlebooks/enrich', async (req, res) => {
    const { apiKey, item } = req.body || {};
    if (!item || item.type !== 'Book' || !item.title) {
      res.status(400).json({ error: 'Missing or invalid item' });
      return;
    }
    const qParts = [];
    if (item.title) qParts.push(`intitle:${encodeURIComponent(item.title)}`);
    if (item.author) qParts.push(`inauthor:${encodeURIComponent(item.author)}`);
    const q = qParts.join('+');
    const url =
      `https://www.googleapis.com/books/v1/volumes?q=${q}` +
      (apiKey ? `&key=${encodeURIComponent(apiKey)}` : '');
    try {
      const r = await fetch(url);
      if (!r.ok) {
        res.status(502).json({ error: 'Google Books request failed' });
        return;
      }
      const data = await r.json();
      const volume = data?.items?.[0]?.volumeInfo;
      if (!volume) {
        res.json({});
        return;
      }
      const update = {};
      if (!item.plot && volume.description) update.plot = volume.description;
      if (!item.publisher && volume.publisher) update.publisher = volume.publisher;
      if (!item.year && volume.publishedDate) {
        const yearStr = String(volume.publishedDate).slice(0, 4);
        if (yearStr) update.year = parseInt(yearStr, 10);
      }
      if (!item.author && Array.isArray(volume.authors) && volume.authors.length) {
        update.author = volume.authors[0];
      }
      if (!item.posterUrl && volume.imageLinks) {
        const thumbUrl = volume.imageLinks.thumbnail || volume.imageLinks.smallThumbnail;
        const volumeId = (volume.id || 'unknown').toString();
        const cached = await downloadImageToCache(thumbUrl, 'primary', {
          keyHint: `googlebooks_${volumeId}`,
        });
        update.posterUrl = cached || thumbUrl;
      }
      res.json(update);
    } catch (e) {
      res.status(502).json({ error: String(e) });
    }
  });

  app.post('/api/metadata/googlebooks/test', async (req, res) => {
    const { apiKey } = req.body || {};
    try {
      const url =
        'https://www.googleapis.com/books/v1/volumes?q=harry+potter' +
        (apiKey ? `&key=${encodeURIComponent(apiKey)}` : '');
      const r = await fetch(url);
      res.json({ ok: r.ok });
    } catch {
      res.json({ ok: false });
    }
  });
}
