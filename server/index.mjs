import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { initDb, getMediaItems, getMediaItemCount, upsertMediaItems, clearMediaItems } from './db.mjs';

// Resolve __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// App root is one level up from server/
const appRoot = path.resolve(__dirname, '..');
const uploadsDir = path.join(appRoot, 'uploads');
const cacheDir = path.join(appRoot, 'cache');

const IMAGE_CACHE_BUCKETS = ['primary', 'backdrop', 'logo', 'people', 'music', 'photos'];

// Ensure cache root and bucket subdirs exist on startup
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
}
for (const bucket of IMAGE_CACHE_BUCKETS) {
  const d = path.join(cacheDir, bucket);
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const CACHE_MAX_AGE_MS = 60 * 24 * 60 * 60 * 1000; // 60 days

/**
 * Sanitize a source id for use as a cache filename stem (e.g. tmdb_12345, tvdb_789).
 */
function sanitizeCacheKeyHint(keyHint) {
  if (!keyHint || typeof keyHint !== 'string') return null;
  return keyHint.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80);
}

/**
 * Download an image from url (with optional auth headers), save to cache/bucket/{key}.ext,
 * return the public path /cache/bucket/key.ext. Re-downloads only if the cached file
 * is missing or older than 60 days. If options.keyHint is provided (e.g. "tmdb_12345"),
 * the file is named after that instead of a hash of the URL.
 */
async function downloadImageToCache(imageUrl, bucket, options = {}) {
  if (!imageUrl || !bucket || !IMAGE_CACHE_BUCKETS.includes(bucket)) return null;
  const keyHint = sanitizeCacheKeyHint(options.keyHint);
  const key = keyHint || crypto.createHash('sha256').update(imageUrl).digest('hex').slice(0, 24);
  const dir = path.join(cacheDir, bucket);
  const cutoff = Date.now() - CACHE_MAX_AGE_MS;

  const matchPrefix = keyHint ? key + '.' : key;
  const existing = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.startsWith(matchPrefix)) : [];
  if (existing.length > 0) {
    const first = path.join(dir, existing[0]);
    try {
      const stat = fs.statSync(first);
      if (stat.mtimeMs >= cutoff) {
        return `/cache/${bucket}/${existing[0]}`;
      }
    } catch (_) {}
  }

  try {
    const res = await fetch(imageUrl, {
      headers: options.headers || {},
      redirect: 'follow',
    });
    if (!res.ok) return null;
    const contentType = res.headers.get('content-type') || '';
    const ext = contentType.includes('png') ? '.png' : contentType.includes('webp') ? '.webp' : '.jpg';
    const filename = key.includes('.') ? key : `${key}${ext}`;
    for (const f of existing) {
      try { fs.unlinkSync(path.join(dir, f)); } catch (_) {}
    }
    const filepath = path.join(dir, filename);
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(filepath, buf);
    return `/cache/${bucket}/${filename}`;
  } catch {
    return null;
  }
}

const app = express();
const port = process.env.PORT || 3000;

// Basic JSON body support for APIs
app.use(express.json());

// Simple CORS setup for local dev (frontend on 5173)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

// Static hosting for built frontend (when running in Docker / production)
const distDir = path.join(appRoot, 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
}

// Configure multer to write into /uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const upload = multer({ storage });

// ==== Upload APIs ====

// List uploaded files
app.get('/api/uploads', (_req, res) => {
  fs.readdir(uploadsDir, (err, files) => {
    if (err) {
      res.status(500).json({ error: 'Failed to read uploads directory' });
      return;
    }
    res.json(
      files.map((name) => ({
        name,
        path: `/uploads/${name}`,
      })),
    );
  });
});

// Handle file upload
app.post('/api/uploads', upload.single('file'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }
  res.status(201).json({
    name: req.file.filename,
    originalName: req.file.originalname,
    path: `/uploads/${req.file.filename}`,
  });
});

// Expose raw uploaded files under /uploads
app.use('/uploads', express.static(uploadsDir));

// On-disk image cache (posters, backdrops, logos)
app.use('/cache', express.static(cacheDir));

// Return file count per bucket in the cache folder (so cache menu count matches on-disk images)
app.get('/api/cache/count', (req, res) => {
  try {
    const counts = {};
    for (const bucket of IMAGE_CACHE_BUCKETS) {
      const dir = path.join(cacheDir, bucket);
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir).filter((f) => {
          const p = path.join(dir, f);
          try {
            return fs.statSync(p).isFile();
          } catch {
            return false;
          }
        });
        counts[bucket] = files.length;
      } else {
        counts[bucket] = 0;
      }
    }
    res.json(counts);
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

// Clear all cache: delete on-disk cache files and media_items table (frontend also clears localStorage)
app.post('/api/cache/clear', (req, res) => {
  try {
    for (const bucket of IMAGE_CACHE_BUCKETS) {
      const dir = path.join(cacheDir, bucket);
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        for (const f of files) {
          try {
            fs.unlinkSync(path.join(dir, f));
          } catch (_) {}
        }
      }
    }
    clearMediaItems();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

// ==== Jellyfin proxy APIs ====

function jfBaseUrl(serverUrl) {
  return serverUrl.replace(/\/$/, '');
}

function jfAuthHeaders(apiKey, userId) {
  const headers = { 'X-Emby-Token': apiKey };
  if (userId && userId.trim().length > 0) {
    headers['X-Emby-UserId'] = userId.trim();
  }
  return headers;
}

async function jfFetchJson(serverUrl, apiKey, pathPart, userId) {
  const url = `${jfBaseUrl(serverUrl)}${pathPart.startsWith('/') ? pathPart : `/${pathPart}`}`;
  const res = await fetch(url, {
    headers: { ...jfAuthHeaders(apiKey, userId), 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Jellyfin error ${res.status}`);
  }
  return res.json();
}

// Test connection to Jellyfin (/System/Info)
app.post('/api/jellyfin/test', async (req, res) => {
  const { serverUrl, apiKey } = req.body || {};
  if (!serverUrl || !apiKey) {
    res.status(400).json({ ok: false, error: 'Missing serverUrl or apiKey' });
    return;
  }
  try {
    const url = `${jfBaseUrl(serverUrl)}/System/Info`;
    const r = await fetch(url, { headers: jfAuthHeaders(apiKey) });
    res.json({ ok: r.ok });
  } catch (e) {
    res.json({ ok: false, error: String(e) });
  }
});

// Get Jellyfin libraries for a user
app.post('/api/jellyfin/libraries', async (req, res) => {
  const { serverUrl, apiKey, userId } = req.body || {};
  if (!serverUrl || !apiKey) {
    res.status(400).json({ error: 'Missing serverUrl or apiKey' });
    return;
  }
  const userSegment = userId && userId.trim().length > 0 ? userId.trim() : 'Public';
  try {
    const data = await jfFetchJson(serverUrl, apiKey, `/Users/${encodeURIComponent(userSegment)}/Views`, userSegment);
    const libs = (data.Items || [])
      .filter((l) => l.Id)
      .map((l) => ({
        id: l.Id,
        name: l.Name || 'Unnamed',
        type: l.CollectionType || '',
      }));
    res.json(libs);
  } catch (e) {
    res.status(502).json({ error: String(e) });
  }
});

// ==== Metadata proxy APIs (TMDb, Google Books) ====

// TMDb enrich (movie/series details + images)
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

// TMDb API key test
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

// Google Books enrich for books
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
      const volumeId = (volume.id || '').toString();
      const cached = volumeId
        ? await downloadImageToCache(thumbUrl, 'primary', { keyHint: `googlebooks_${volumeId}` })
        : await downloadImageToCache(thumbUrl, 'primary');
      update.posterUrl = cached || thumbUrl;
    }
    res.json(update);
  } catch (e) {
    res.status(502).json({ error: String(e) });
  }
});

// Google Books API key test
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

// Comic Vine API key test (server-side only)
app.post('/api/metadata/comicvine/test', async (req, res) => {
  const { apiKey } = req.body || {};
  if (!apiKey) {
    res.json({ ok: false });
    return;
  }
  try {
    // Lightweight search; Comic Vine expects api_key as query param.
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

// TheTVDB API key test (v4 login)
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

// TheTVDB enrich for series metadata/poster
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
    // TVDB v4 includes image posters in artwork array; pick first poster if present.
    const artwork = Array.isArray(data?.artwork) ? data.artwork : [];
    const poster = artwork.find(
      (a) => a.type === 2 || a.type === 'poster',
    );
    if (!item.posterUrl && poster?.image) {
      const tvdbId = String(item.tvdbId || data?.id || '');
      const cached = tvdbId
        ? await downloadImageToCache(poster.image, 'primary', { keyHint: `tvdb_${tvdbId}` })
        : await downloadImageToCache(poster.image, 'primary');
      update.posterUrl = cached || poster.image;
    }
    res.json(update);
  } catch (e) {
    res.status(502).json({ error: String(e) });
  }
});

// Comic Vine enrich for comics/graphic novels (basic)
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
      update.posterUrl = issue.image.original_url;
    }
    res.json(update);
  } catch (e) {
    res.status(502).json({ error: String(e) });
  }
});

// Get items from a Jellyfin library
app.post('/api/jellyfin/items', async (req, res) => {
  const { serverUrl, apiKey, libraryId, types, limit = 50, userId } = req.body || {};
  if (!serverUrl || !apiKey || !libraryId) {
    res.status(400).json({ error: 'Missing serverUrl, apiKey or libraryId' });
    return;
  }
  const includeItemTypes = Array.isArray(types) && types.length ? types.join(',') : 'Movie,Series';
  const userSegment = userId && userId.trim().length > 0 ? userId.trim() : 'Public';
  const fields =
    'ProviderIds,Overview,Taglines,ProductionYear,CommunityRating,Studios,People,ImageTags,BackdropImageTags';

  try {
    // Pull items from Jellyfin in smaller pages until we've reached the requested
    // limit or there are no more items. This avoids a single huge response for
    // very large libraries while still giving the display a rich pool.
    const pageSize = 50;
    const maxItems = Number.isFinite(Number(limit)) ? Number(limit) || pageSize : pageSize;
    const allItems = [];
    let startIndex = 0;

    while (allItems.length < maxItems) {
      const remaining = maxItems - allItems.length;
      const thisPageSize = Math.min(pageSize, remaining);
      const pathPart = `/Users/${encodeURIComponent(
        userSegment,
      )}/Items?ParentId=${encodeURIComponent(
        libraryId,
      )}&IncludeItemTypes=${encodeURIComponent(
        includeItemTypes,
      )}&Fields=${encodeURIComponent(
        fields,
      )}&StartIndex=${encodeURIComponent(
        String(startIndex),
      )}&Limit=${encodeURIComponent(String(thisPageSize))}`;

      const data = await jfFetchJson(serverUrl, apiKey, pathPart, userSegment);
      const items = (data.Items || []).filter((it) => it.Id);
      if (!items.length) {
        break;
      }
      allItems.push(...items);
      if (items.length < thisPageSize) {
        // Jellyfin returned fewer than requested; we've reached the end.
        break;
      }
      startIndex += items.length;
    }

    const base = jfBaseUrl(serverUrl);
    const rawItems = allItems
      .map((it) => {
        // Jellyfin image paths:
        // - Primary poster: /Items/{Id}/Images/Primary?tag={PrimaryImageTag}
        // - Logo:          /Items/{Id}/Images/Logo?tag={LogoImageTag}
        // - Backdrop:      /Items/{Id}/Images/Backdrop/0?tag={BackdropImageTags[0]}
        const posterTag = it.ImageTags?.Primary;
        const logoTag = it.ImageTags?.Logo;
        const backdropTags = it.BackdropImageTags ?? it.ImageTags?.Backdrop ?? [];
        const firstBackdropTag = Array.isArray(backdropTags) ? backdropTags[0] : backdropTags;

        const posterUrl = posterTag
          ? `${base}/Items/${it.Id}/Images/Primary?tag=${encodeURIComponent(posterTag)}`
          : undefined;

        const logoUrl = logoTag
          ? `${base}/Items/${it.Id}/Images/Logo?tag=${encodeURIComponent(logoTag)}`
          : undefined;

        const backdropUrl =
          (Array.isArray(backdropTags) && backdropTags.length > 0) || firstBackdropTag
            ? `${base}/Items/${it.Id}/Images/Backdrop/0${
                firstBackdropTag ? `?tag=${encodeURIComponent(firstBackdropTag)}` : ''
              }`
            : undefined;

        return {
          id: it.Id,
          title: it.Name || 'Unknown',
          type: it.Type,
          tagline: it.Taglines?.[0],
          plot: it.Overview,
          year: it.ProductionYear,
          rating:
            it.CommunityRating != null ? String(it.CommunityRating) : undefined,
          studio: it.Studios?.[0]?.Name,
          posterUrl,
          backdropUrl,
          logoUrl,
        };
      });

    // Download images to on-disk cache and rewrite URLs to /cache/...
    // Only cache URLs are sent to the frontend; Jellyfin URLs require auth and would fail in the browser.
    const authHeaders = jfAuthHeaders(apiKey, userSegment);
    await Promise.all(
      rawItems.map(async (it) => {
        const [cachedPoster, cachedBackdrop, cachedLogo] = await Promise.all([
          it.posterUrl
            ? downloadImageToCache(it.posterUrl, 'primary', { headers: authHeaders })
            : null,
          it.backdropUrl
            ? downloadImageToCache(it.backdropUrl, 'backdrop', { headers: authHeaders })
            : null,
          it.logoUrl
            ? downloadImageToCache(it.logoUrl, 'logo', { headers: authHeaders })
            : null,
        ]);
        it.posterUrl = cachedPoster || null;
        it.backdropUrl = cachedBackdrop || null;
        it.logoUrl = cachedLogo || null;
      }),
    );

    // Upsert into the media_items table so /api/media can serve from cache.
    upsertMediaItems(
      rawItems.map((it) => ({
        id: it.id,
        source: 'jellyfin',
        libraryId,
        title: it.title,
        type: it.type,
        year: it.year,
        rating: it.rating,
        posterUrl: it.posterUrl,
        backdropUrl: it.backdropUrl,
        logoUrl: it.logoUrl,
        metadata: {
          tagline: it.tagline,
          plot: it.plot,
          studio: it.studio,
        },
      })),
    );
    res.json(rawItems);
  } catch (e) {
    res.status(502).json({ error: String(e) });
  }
});

// Simple health endpoint
app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

// Return cached media item count (for Cache settings display)
app.get('/api/media/count', (req, res) => {
  try {
    const { source } = req.query;
    const count = getMediaItemCount(source || null);
    res.json({ count: Number(count) });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// Return cached media items from the SQLite database (cache-first: display reads only from here)
app.get('/api/media', (req, res) => {
  const { source, limit } = req.query;
  const rows = getMediaItems({
    sourceKind: source,
    limit: limit ? Number(limit) || 50 : 50,
  });
  res.json(
    rows.map((r) => {
      let metadata = {};
      try {
        if (r.metadata_json) metadata = JSON.parse(r.metadata_json);
      } catch (_) {}
      return {
        id: r.id,
        title: r.title,
        type: r.type,
        year: r.year,
        rating: r.rating,
        posterUrl: r.poster_url,
        backdropUrl: r.backdrop_url,
        logoUrl: r.logo_url,
        source: r.source_kind,
        tagline: metadata.tagline,
        plot: metadata.plot,
        studio: metadata.studio,
      };
    }),
  );
});

// Database backup download (SQLite file)
app.get('/api/db/backup', (req, res) => {
  const dbFile = path.join(appRoot, 'data', 'finposter.db');
  if (!fs.existsSync(dbFile)) {
    res.status(404).json({ error: 'Database file not found' });
    return;
  }
  const filename = `finposter-db-${new Date().toISOString().slice(0, 10)}.sqlite`;
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.sendFile(dbFile);
});

// SPA fallback for production: always return index.html for unknown routes
app.get(/.*/, (req, res, next) => {
  if (!fs.existsSync(distDir)) {
    return next();
  }
  const indexPath = path.join(distDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    next();
  }
});

initDb();

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`FinPoster backend listening on port ${port}`);
});

