/**
 * Cache settings – clear specific cache groups or all cache
 *
 * The cache stores metadata and image URLs locally to reduce API calls and
 * improve loading. User can clear individual buckets (primary, logo, metadata,
 * people, backdrop) or clear all. Also shows backend media cache count (from Jellyfin sync).
 */

import { useEffect, useState } from 'react';
import { useSettings } from '../../store/settingsStore';
import { cacheService } from '../../services/cache';
import type { CacheBucket } from '../../types';

const BUCKET_LABELS: Record<CacheBucket, string> = {
  primary: 'Primary (posters)',
  logo: 'Logos',
  metadata: 'Metadata',
  people: 'People (artists, authors, cast, directors)',
  backdrop: 'Backdrops',
  music: 'Music (artwork)',
  photos: 'Photos',
};

/** Server cache folder has no "metadata" bucket (metadata is localStorage only). */
const SERVER_CACHE_BUCKETS: CacheBucket[] = ['primary', 'logo', 'people', 'backdrop', 'music', 'photos'];

export function CacheSettings() {
  const { setSettings } = useSettings();
  const [refreshKey, setRefreshKey] = useState(0);
  const [mediaCacheCount, setMediaCacheCount] = useState<number | null>(null);
  const [mediaCountError, setMediaCountError] = useState<string | null>(null);
  /** Per-bucket file count from server cache folder (syncs menu count to on-disk images). */
  const [serverCacheCounts, setServerCacheCounts] = useState<Record<string, number> | null>(null);

  const refreshCounts = () => {
    setRefreshKey((k) => k + 1);
    setSettings(() => ({}));
  };

  const fetchMediaCount = () => {
    setMediaCountError(null);
    fetch('/api/media/count')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        const raw = data?.count;
        const n = typeof raw === 'number' ? raw : typeof raw === 'string' ? parseInt(raw, 10) : null;
        setMediaCacheCount(Number.isFinite(n) ? n : null);
      })
      .catch((e) => {
        setMediaCacheCount(null);
        setMediaCountError(e?.message || 'Failed to load');
      });
  };

  const fetchServerCacheCounts = () => {
    fetch('/api/cache/count')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (data && typeof data === 'object') {
          setServerCacheCounts(data as Record<string, number>);
        } else {
          setServerCacheCounts(null);
        }
      })
      .catch(() => setServerCacheCounts(null));
  };

  useEffect(() => {
    refreshCounts();
    fetchMediaCount();
    fetchServerCacheCounts();
  }, []);

  useEffect(() => {
    const onFocus = () => {
      refreshCounts();
      fetchMediaCount();
      fetchServerCacheCounts();
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const clearBucket = (bucket: CacheBucket) => {
    try {
      cacheService.clearBucket(bucket);
    } finally {
      setRefreshKey((k) => k + 1);
    }
  };

  const clearAll = async () => {
    if (!window.confirm('Clear all cached metadata and artwork (browser + server cache folder)? This cannot be undone.')) {
      return;
    }
    try {
      const r = await fetch('/api/cache/clear', { method: 'POST' });
      if (!r.ok) throw new Error(`Server: ${r.status}`);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Failed to clear server cache';
      setMediaCountError(message);
    }
    cacheService.clearAll();
    setRefreshKey((k) => k + 1);
    fetchMediaCount();
    fetchServerCacheCounts();
  };

  return (
    <div className="glass-panel" style={{ padding: 24, maxWidth: 640 }}>
      <h1>Cache</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
        Clear cached metadata and image references. Next load will re-fetch from
        the primary source and fallback services.
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        {mediaCountError && (
          <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            {mediaCountError}
          </span>
        )}
        {mediaCacheCount !== null && !mediaCountError && (
          <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            Media cache (from Jellyfin sync): <strong>{mediaCacheCount}</strong> item(s)
          </span>
        )}
        <button
          type="button"
          className="btn"
          onClick={() => {
            refreshCounts();
            fetchMediaCount();
            fetchServerCacheCounts();
          }}
        >
          Refresh counts
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 16,
        }}
      >
        <span>Enable all cache</span>
        <button
          type="button"
          onClick={() => {
            const next = !cacheService.isAllEnabled();
            cacheService.setAllEnabled(next);
            refreshCounts();
          }}
          aria-pressed={cacheService.isAllEnabled()}
          style={{
            position: 'relative',
            width: 46,
            height: 24,
            borderRadius: 999,
            border: '1px solid var(--glass-border)',
            background: cacheService.isAllEnabled()
              ? 'var(--accent)'
              : 'rgba(255,255,255,0.08)',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: 2,
              left: cacheService.isAllEnabled() ? 24 : 2,
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: '#ffffff',
              boxShadow: '0 0 6px rgba(0,0,0,0.4)',
              transition: 'left 0.18s ease',
            }}
          />
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }} key={refreshKey}>
        {cacheService.getBuckets().map((bucket) => (
          <div
            key={bucket}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span>{BUCKET_LABELS[bucket]}</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }} key={`${bucket}-${refreshKey}`}>
                {SERVER_CACHE_BUCKETS.includes(bucket) && serverCacheCounts != null
                  ? `${serverCacheCounts[bucket] ?? 0} image(s) in cache folder`
                  : `${cacheService.count(bucket)} item(s) in browser cache`}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                type="button"
                onClick={() => {
                  const next = !cacheService.isBucketEnabled(bucket);
                  cacheService.setBucketEnabled(bucket, next);
                  refreshCounts();
                }}
                aria-pressed={cacheService.isBucketEnabled(bucket)}
                style={{
                  position: 'relative',
                  width: 46,
                  height: 24,
                  borderRadius: 999,
                  border: '1px solid var(--glass-border)',
                  background: cacheService.isBucketEnabled(bucket)
                    ? 'var(--accent)'
                    : 'rgba(255,255,255,0.08)',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    top: 2,
                    left: cacheService.isBucketEnabled(bucket) ? 24 : 2,
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: '#ffffff',
                    boxShadow: '0 0 6px rgba(0,0,0,0.4)',
                    transition: 'left 0.18s ease',
                  }}
                />
              </button>
              <button
                type="button"
                className="btn"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  clearBucket(bucket);
                }}
                aria-label={`Clear ${BUCKET_LABELS[bucket]}`}
              >
                Clear
              </button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--glass-border)' }}>
        <button
          type="button"
          className="btn btn-danger"
          onClick={clearAll}
        >
          Clear all cache
        </button>
      </div>
    </div>
  );
}
