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
  artists: 'Artists',
  authors: 'Authors',
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {cacheService.getBuckets().map((bucket) => (
          <div key={bucket} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>{BUCKET_LABELS[bucket]}</span>
            <button
              type="button"
              className="btn"
              onClick={() => clearBucket(bucket)}
            >
              Clear
            </button>
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
