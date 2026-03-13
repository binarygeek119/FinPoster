/**
 * Cache settings – clear specific cache groups or all cache
 *
 * The cache stores metadata and image URLs locally to reduce API calls and
 * improve loading. User can clear individual buckets (primary, logo, metadata,
 * artists, authors, backdrop) or clear all. Same glass styling.
 */

import { useSettings } from '../../store/settingsStore';
import { cacheService } from '../../services/cache';
import type { CacheBucket } from '../../types';

const BUCKET_LABELS: Record<CacheBucket, string> = {
  primary: 'Primary (posters)',
  logo: 'Logos',
  metadata: 'Metadata',
  artists: 'Artists (people images)',
  authors: 'Authors (people images)',
  backdrop: 'Backdrops',
};

export function CacheSettings() {
  const { setSettings } = useSettings();

  const clearBucket = (bucket: CacheBucket) => {
    cacheService.clearBucket(bucket);
    setSettings({}); // trigger re-read so UI can show "cleared"
  };

  const clearAll = () => {
    if (window.confirm('Clear all cached metadata and artwork? This cannot be undone.')) {
      cacheService.clearAll();
      setSettings({});
    }
  };

  return (
    <div className="glass-panel" style={{ padding: 24, maxWidth: 640 }}>
      <h1>Cache</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
        Clear cached metadata and image references. Next load will re-fetch from
        the primary source and fallback services.
      </p>

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
            setSettings({});
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {cacheService.count(bucket)} item(s) in cache
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                type="button"
                onClick={() => {
                  const next = !cacheService.isBucketEnabled(bucket);
                  cacheService.setBucketEnabled(bucket, next);
                  setSettings({});
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
                onClick={() => clearBucket(bucket)}
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
