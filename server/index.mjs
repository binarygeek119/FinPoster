import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { initDb, getMediaItems, getMediaItemCount, upsertMediaItems, clearMediaItems, clearMediaItemUrlsForBucket } from './db.mjs';
import { registerTmdbRoutes } from './metadata/tmdb.mjs';
import { registerTvdbRoutes } from './metadata/tvdb.mjs';
import { registerGoogleBooksRoutes } from './metadata/googlebooks.mjs';
import { registerComicVineRoutes } from './metadata/comicvine.mjs';
import { registerMusicBrainzRoutes } from './metadata/musicbrainz.mjs';

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

// Clear a single cache bucket (on-disk folder + null that URL column in media_items)
app.post('/api/cache/clear-bucket', (req, res) => {
  try {
    const bucket = req.body?.bucket;
    if (!bucket || !IMAGE_CACHE_BUCKETS.includes(bucket)) {
      res.status(400).json({ error: 'Invalid or missing bucket' });
      return;
    }
    const dir = path.join(cacheDir, bucket);
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir);
      for (const f of files) {
        try {
          fs.unlinkSync(path.join(dir, f));
        } catch (_) {}
      }
    }
    clearMediaItemUrlsForBucket(bucket);
    res.json({ ok: true });
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

// Get now-playing from Jellyfin Sessions (for playback display)
app.post('/api/jellyfin/now-playing', async (req, res) => {
  const { serverUrl, apiKey, userId, watchIds } = req.body || {};
  if (!serverUrl || !apiKey) {
    res.status(400).json({ error: 'Missing serverUrl or apiKey' });
    return;
  }
  try {
    const path = '/Sessions?nowPlaying=true';
    const data = await jfFetchJson(serverUrl, apiKey, path);
    const sessions = Array.isArray(data) ? data : [];
    const userIdTrim = (userId && String(userId).trim()) || '';
    const watchSet = Array.isArray(watchIds) && watchIds.length
      ? new Set(watchIds.map((id) => String(id).trim()).filter(Boolean))
      : null;
    let fallback = null;
    for (const s of sessions) {
      const np = s.NowPlayingItem;
      if (!np || !np.Id) continue;
      const playState = s.PlayState || {};
      const positionTicks = playState.PositionTicks != null ? Number(playState.PositionTicks) : 0;
      const runTimeTicks = np.RunTimeTicks != null ? Number(np.RunTimeTicks) : null;
      const progress = runTimeTicks && runTimeTicks > 0
        ? Math.min(1, Math.max(0, positionTicks / runTimeTicks))
        : 0;
      const payload = {
        itemId: np.Id,
        positionTicks,
        runTimeTicks: runTimeTicks ?? 0,
        isPaused: !!playState.IsPaused,
        progress,
      };
      if (userIdTrim && (s.UserId || '').toString().trim() !== userIdTrim) {
        if (!fallback) fallback = payload;
        continue;
      }
      if (watchSet && watchSet.size && !watchSet.has((s.Id || '').toString())) {
        if (!fallback) fallback = payload;
        continue;
      }
      res.json(payload);
      return;
    }
    if (fallback) res.json(fallback);
    else res.json(null);
  } catch (e) {
    res.status(502).json({ error: String(e) });
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

// ==== Metadata proxy APIs (TMDb, TheTVDB, Google Books, Comic Vine) ====
registerTmdbRoutes(app, { downloadImageToCache });
registerTvdbRoutes(app, { downloadImageToCache });
registerGoogleBooksRoutes(app, { downloadImageToCache });
registerComicVineRoutes(app, { downloadImageToCache });
registerMusicBrainzRoutes(app, { downloadImageToCache });

// Fetch a single item by ID and cache its images (e.g. when playback shows an item without a poster).
app.post('/api/jellyfin/item', async (req, res) => {
  const { serverUrl, apiKey, itemId, userId } = req.body || {};
  if (!serverUrl || !apiKey || !itemId) {
    res.status(400).json({ error: 'Missing serverUrl, apiKey or itemId' });
    return;
  }
  const userSegment = userId && String(userId).trim().length > 0 ? String(userId).trim() : 'Public';
  const fields =
    'ProviderIds,Overview,Taglines,ProductionYear,CommunityRating,Studios,People,ImageTags,BackdropImageTags,SeriesId';
  try {
    const pathPart = `/Users/${encodeURIComponent(userSegment)}/Items/${encodeURIComponent(itemId)}?Fields=${encodeURIComponent(fields)}`;
    const it = await jfFetchJson(serverUrl, apiKey, pathPart, userSegment);
    if (!it || !it.Id) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }
    const base = jfBaseUrl(serverUrl);
    let posterUrl, logoUrl, backdropUrl;
    const isEpisode = (it.Type || '').toLowerCase() === 'episode';
    const seriesId = it.SeriesId;
    if (isEpisode && seriesId) {
      const seriesPath = `/Users/${encodeURIComponent(userSegment)}/Items/${encodeURIComponent(seriesId)}?Fields=${encodeURIComponent(fields)}`;
      const series = await jfFetchJson(serverUrl, apiKey, seriesPath, userSegment);
      if (series && series.Id) {
        const pTag = series.ImageTags?.Primary;
        const lTag = series.ImageTags?.Logo;
        const bTags = series.BackdropImageTags ?? series.ImageTags?.Backdrop ?? [];
        const b0 = Array.isArray(bTags) ? bTags[0] : bTags;
        posterUrl = pTag ? `${base}/Items/${series.Id}/Images/Primary?tag=${encodeURIComponent(pTag)}` : undefined;
        logoUrl = lTag ? `${base}/Items/${series.Id}/Images/Logo?tag=${encodeURIComponent(lTag)}` : undefined;
        backdropUrl = (Array.isArray(bTags) && bTags.length > 0) || b0
          ? `${base}/Items/${series.Id}/Images/Backdrop/0${b0 ? `?tag=${encodeURIComponent(b0)}` : ''}`
          : undefined;
      }
    }
    if (!isEpisode && posterUrl == null) {
      const posterTag = it.ImageTags?.Primary;
      const logoTag = it.ImageTags?.Logo;
      const backdropTags = it.BackdropImageTags ?? it.ImageTags?.Backdrop ?? [];
      const firstBackdropTag = Array.isArray(backdropTags) ? backdropTags[0] : backdropTags;
      posterUrl = posterTag
        ? `${base}/Items/${it.Id}/Images/Primary?tag=${encodeURIComponent(posterTag)}`
        : undefined;
      logoUrl = logoTag
        ? `${base}/Items/${it.Id}/Images/Logo?tag=${encodeURIComponent(logoTag)}`
        : undefined;
      backdropUrl =
        (Array.isArray(backdropTags) && backdropTags.length > 0) || firstBackdropTag
          ? `${base}/Items/${it.Id}/Images/Backdrop/0${firstBackdropTag ? `?tag=${encodeURIComponent(firstBackdropTag)}` : ''}`
          : undefined;
    }
    const cast = (it.People || []).map((p) => ({ name: p.Name || '', role: p.Role })).filter((c) => c.name);
    const raw = {
      id: it.Id,
      title: it.Name || 'Unknown',
      type: it.Type,
      tagline: it.Taglines?.[0],
      plot: it.Overview,
      year: it.ProductionYear,
      rating: it.CommunityRating != null ? String(it.CommunityRating) : undefined,
      studio: it.Studios?.[0]?.Name,
      posterUrl: posterUrl || undefined,
      backdropUrl: backdropUrl || undefined,
      logoUrl: logoUrl || undefined,
      cast,
    };
    const authHeaders = jfAuthHeaders(apiKey, userSegment);
    const [cachedPoster, cachedBackdrop, cachedLogo] = await Promise.all([
      raw.posterUrl ? downloadImageToCache(raw.posterUrl, 'primary', { headers: authHeaders }) : null,
      raw.backdropUrl ? downloadImageToCache(raw.backdropUrl, 'backdrop', { headers: authHeaders }) : null,
      raw.logoUrl ? downloadImageToCache(raw.logoUrl, 'logo', { headers: authHeaders }) : null,
    ]);
    raw.posterUrl = cachedPoster || null;
    raw.backdropUrl = cachedBackdrop || null;
    raw.logoUrl = cachedLogo || null;
    upsertMediaItems([
      {
        id: raw.id,
        source: 'jellyfin',
        libraryId: null,
        title: raw.title,
        type: raw.type,
        year: raw.year,
        rating: raw.rating,
        posterUrl: raw.posterUrl,
        backdropUrl: raw.backdropUrl,
        logoUrl: raw.logoUrl,
        metadata: { tagline: raw.tagline, plot: raw.plot, studio: raw.studio, cast: raw.cast },
      },
    ]);
    res.json({
      id: raw.id,
      title: raw.title,
      type: raw.type,
      tagline: raw.tagline,
      plot: raw.plot,
      year: raw.year,
      rating: raw.rating,
      studio: raw.studio,
      posterUrl: raw.posterUrl,
      backdropUrl: raw.backdropUrl,
      logoUrl: raw.logoUrl,
      cast: raw.cast,
    });
  } catch (e) {
    res.status(502).json({ error: String(e) });
  }
});

// Get items from a Jellyfin library
app.post('/api/jellyfin/items', async (req, res) => {
  const { serverUrl, apiKey, libraryId, types, limit, userId } = req.body || {};
  if (!serverUrl || !apiKey || !libraryId) {
    res.status(400).json({ error: 'Missing serverUrl, apiKey or libraryId' });
    return;
  }
  const includeItemTypes = Array.isArray(types) && types.length ? types.join(',') : 'Movie,Series';
  const userSegment = userId && userId.trim().length > 0 ? userId.trim() : 'Public';
  const fields =
    'ProviderIds,Overview,Taglines,ProductionYear,CommunityRating,Studios,People,ImageTags,BackdropImageTags';

  try {
    // Pull items from Jellyfin in small pages. If limit is 0 or omitted, keep requesting
    // until the full library is cached; otherwise stop at limit (sanity cap 100k).
    const pageSize = 100;
    const requestedLimit = Number(limit);
    const syncFullLibrary = !Number.isFinite(requestedLimit) || requestedLimit <= 0;
    const maxItems = syncFullLibrary ? 100000 : Math.min(requestedLimit, 100000);
    const allItems = [];
    let startIndex = 0;

    while (syncFullLibrary ? true : allItems.length < maxItems) {
      const remaining = syncFullLibrary ? pageSize : maxItems - allItems.length;
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
      startIndex += items.length;
      if (allItems.length >= maxItems) break;
      // If Jellyfin returned fewer than requested it may be end of library, or a server cap (e.g. 50).
      // Only stop when we got zero items; otherwise keep requesting from the new startIndex.
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

        const cast = (it.People || [])
          .map((p) => ({ name: p.Name || '', role: p.Role }))
          .filter((c) => c.name);

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
          cast,
        };
      });

    // Download images to on-disk cache for all items (full server cache).
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
          cast: it.cast,
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
        cast: metadata.cast,
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

