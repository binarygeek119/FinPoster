/**
 * Cache settings – database-first view of cached media and images
 *
 * Structure:
 * 1. Media cache (database) – media_items table, filled by Jellyfin sync; display reads from here.
 * 2. Image cache (server) – on-disk poster/backdrop/logo files that back the URLs in the DB.
 * 3. Browser cache – fallback metadata/URLs on this device (e.g. TMDb); enable/disable and clear.
 * 4. Clear all – wipes database, server images, and browser cache.
 */

import { useEffect, useState } from 'react';
import { useSettings } from '../../store/settingsStore';
import { cacheService } from '../../services/cache';
import { apiBaseUrl } from '../../services/jellyfin';
import type { CacheBucket } from '../../types';

const IMAGE_BUCKET_LABELS: Record<string, string> = {
  primary: 'Posters',
  backdrop: 'Backdrops',
  logo: 'Logos',
  people: 'People',
  music: 'Music',
  photos: 'Photos',
};

const SERVER_IMAGE_BUCKETS = ['primary', 'backdrop', 'logo', 'people', 'music', 'photos'] as const;

const BROWSER_BUCKET_LABELS: Record<CacheBucket, string> = {
  primary: 'Primary (posters)',
  logo: 'Logos',
  people: 'People',
  backdrop: 'Backdrops',
  music: 'Music',
  photos: 'Photos',
};

type ConfirmKind = { kind: 'bucket'; bucket: CacheBucket } | { kind: 'all' } | null;

function Toggle({
  checked,
  onChange,
  ariaLabel,
}: { checked: boolean; onChange: () => void; ariaLabel: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked ? 'true' : 'false'}
      aria-label={ariaLabel}
      onClick={onChange}
      style={{
        position: 'relative',
        width: 46,
        height: 24,
        borderRadius: 999,
        border: '1px solid var(--glass-border)',
        background: checked ? 'var(--accent)' : 'rgba(255,255,255,0.08)',
        cursor: 'pointer',
        padding: 0,
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 2,
          left: checked ? 24 : 2,
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: '#fff',
          boxShadow: '0 0 6px rgba(0,0,0,0.4)',
          transition: 'left 0.18s ease',
        }}
      />
    </button>
  );
}

export function CacheSettings() {
  const { setSettings } = useSettings();
  const [refreshKey, setRefreshKey] = useState(0);
  const [mediaCount, setMediaCount] = useState<number | null>(null);
  const [mediaCountError, setMediaCountError] = useState<string | null>(null);
  const [serverImageCounts, setServerImageCounts] = useState<Record<string, number> | null>(null);
  const [confirm, setConfirm] = useState<ConfirmKind>(null);

  const base = apiBaseUrl();
  const backendUnreachable = 'Backend not running (502). Start the server with: npm run server';

  const refreshCounts = () => {
    setRefreshKey((k) => k + 1);
    setSettings(() => ({}));
  };

  const fetchMediaCount = () => {
    setMediaCountError(null);
    fetch(`${base}/api/media/count`)
      .then((r) => {
        if (r.status === 502) throw new Error(backendUnreachable);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        const raw = data?.count;
        const n = typeof raw === 'number' ? raw : typeof raw === 'string' ? parseInt(raw, 10) : null;
        setMediaCount(Number.isFinite(n) ? n : null);
      })
      .catch((e) => {
        setMediaCount(null);
        setMediaCountError(e?.message || 'Failed to load');
      });
  };

  const fetchServerImageCounts = () => {
    fetch(`${base}/api/cache/count`)
      .then((r) => {
        if (r.status === 502) throw new Error(backendUnreachable);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (data && typeof data === 'object') setServerImageCounts(data as Record<string, number>);
        else setServerImageCounts(null);
      })
      .catch(() => {
        setServerImageCounts(null);
        setMediaCountError('Server cache count unavailable');
      });
  };

  useEffect(() => {
    refreshCounts();
    fetchMediaCount();
    fetchServerImageCounts();
  }, []);

  useEffect(() => {
    const onFocus = () => {
      refreshCounts();
      fetchMediaCount();
      fetchServerImageCounts();
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const clearBucket = async (bucket: CacheBucket) => {
    if (SERVER_IMAGE_BUCKETS.includes(bucket as (typeof SERVER_IMAGE_BUCKETS)[number])) {
      try {
        const r = await fetch(`${base}/api/cache/clear-bucket`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bucket }),
        });
        if (r.status === 502) throw new Error(backendUnreachable);
        if (!r.ok) throw new Error(`Server: ${r.status}`);
        setMediaCountError(null);
        fetchMediaCount();
        fetchServerImageCounts();
      } catch (e) {
        setMediaCountError(e instanceof Error ? e.message : 'Failed to clear server cache');
      }
    }
    cacheService.clearBucket(bucket);
    refreshCounts();
    setConfirm(null);
  };

  const clearAll = async () => {
    try {
      const r = await fetch(`${base}/api/cache/clear`, { method: 'POST' });
      if (r.status === 502) throw new Error(backendUnreachable);
      if (!r.ok) throw new Error(`Server: ${r.status}`);
      setMediaCountError(null);
    } catch (e) {
      setMediaCountError(e instanceof Error ? e.message : 'Failed to clear server cache');
    }
    cacheService.clearAll();
    refreshCounts();
    fetchMediaCount();
    fetchServerImageCounts();
    setConfirm(null);
  };

  const handleEnableAll = () => {
    const next = !cacheService.isAllEnabled();
    cacheService.setAllEnabled(next);
    refreshCounts();
  };

  const handleBucketEnable = (bucket: CacheBucket) => {
    const next = !cacheService.isBucketEnabled(bucket);
    cacheService.setBucketEnabled(bucket, next);
    refreshCounts();
  };

  const sectionStyle = {
    marginBottom: 24,
    paddingBottom: 24,
    borderBottom: '1px solid var(--glass-border)',
  };
  const rowStyle = {
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    gap: 12,
    padding: '10px 0',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  };
  const lastRowStyle = { ...rowStyle, borderBottom: 'none' };

  return (
    <div className="glass-panel" style={{ padding: 24, maxWidth: 640 }}>
      {/* Confirm modal */}
      {confirm !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cache-confirm-title"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.6)',
            padding: 24,
          }}
          onClick={() => setConfirm(null)}
        >
          <div
            className="glass-panel"
            style={{ padding: 24, maxWidth: 360, width: '100%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="cache-confirm-title" style={{ margin: '0 0 12px 0', fontSize: 18 }}>
              Clear cache?
            </h2>
            <p style={{ color: 'var(--text-secondary)', margin: '0 0 20px 0', fontSize: 14 }}>
              {confirm.kind === 'all'
                ? 'Clear all media database, server images, and browser cache? This cannot be undone. Run Jellyfin sync to repopulate.'
                : `Clear ${BROWSER_BUCKET_LABELS[confirm.bucket]} cache? This cannot be undone.`}
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button type="button" className="btn" onClick={() => setConfirm(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (confirm.kind === 'all') clearAll();
                  else clearBucket(confirm.bucket);
                }}
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      <h1 style={{ marginTop: 0 }}>Cache</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
        Display reads from the database cache. Jellyfin sync fills it; server stores images; browser holds fallback data.
      </p>

      {mediaCountError && (
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16 }}>{mediaCountError}</p>
      )}

      {/* 1. Media cache (database) */}
      <section style={sectionStyle}>
        <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 12px 0' }}>Media cache (database)</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: '0 0 12px 0' }}>
          Items from Jellyfin sync. The display uses only this cache.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            <strong>{mediaCount ?? '—'}</strong> item{mediaCount === 1 ? '' : 's'}
          </span>
          <button
            type="button"
            className="btn"
            onClick={() => {
              fetchMediaCount();
              fetchServerImageCounts();
            }}
          >
            Refresh
          </button>
        </div>
      </section>

      {/* 2. Image cache (server) */}
      <section style={sectionStyle}>
        <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 12px 0' }}>Image cache (server)</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: '0 0 12px 0' }}>
          Cached poster, backdrop, and logo files on the server. Clearing removes files and clears URLs in the database until next sync.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }} key={refreshKey}>
          {SERVER_IMAGE_BUCKETS.map((bucket, i) => (
            <div key={bucket} style={i === SERVER_IMAGE_BUCKETS.length - 1 ? lastRowStyle : rowStyle}>
              <span>{IMAGE_BUCKET_LABELS[bucket] ?? bucket}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {serverImageCounts != null ? serverImageCounts[bucket] ?? 0 : '—'} file(s)
                </span>
                <button
                  type="button"
                  className="btn"
                  style={{ minWidth: 72, minHeight: 36 }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setConfirm({ kind: 'bucket', bucket: bucket as CacheBucket });
                  }}
                >
                  Clear
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Browser cache */}
      <section style={sectionStyle}>
        <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 12px 0' }}>Browser cache</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: '0 0 12px 0' }}>
          Fallback metadata and URLs on this device (e.g. from TMDb). Enable or clear per category.
        </p>
        <div style={{ ...rowStyle, marginBottom: 8 }}>
          <span>Enable all</span>
          <Toggle
            checked={cacheService.isAllEnabled()}
            onChange={handleEnableAll}
            ariaLabel="Enable all browser cache"
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {cacheService.getBuckets().map((bucket, i) => (
            <div key={bucket} style={i === cacheService.getBuckets().length - 1 ? lastRowStyle : rowStyle}>
              <div>
                <span>{BROWSER_BUCKET_LABELS[bucket]}</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block' }}>
                  {cacheService.count(bucket)} item(s)
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Toggle
                  checked={cacheService.isBucketEnabled(bucket)}
                  onChange={() => handleBucketEnable(bucket)}
                  ariaLabel={`Enable ${BROWSER_BUCKET_LABELS[bucket]}`}
                />
                <button
                  type="button"
                  className="btn"
                  style={{ minWidth: 72, minHeight: 36 }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setConfirm({ kind: 'bucket', bucket });
                  }}
                >
                  Clear
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Clear all */}
      <section style={{ marginBottom: 0, paddingBottom: 0, borderBottom: 'none' }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 12px 0', color: 'var(--text-muted)' }}>Clear everything</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: '0 0 12px 0' }}>
          Remove all cached media from the database, server images, and browser. Run Jellyfin sync to repopulate.
        </p>
        <button
          type="button"
          className="btn btn-danger"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setConfirm({ kind: 'all' });
          }}
        >
          Clear all cache
        </button>
      </section>
    </div>
  );
}
