/**
 * Cache service – local storage for metadata and image URLs
 *
 * The spec asks for cache folders like cache/primary, cache/logo, etc. In a
 * browser-only app we can't write real folders; we use localStorage keys
 * prefixed by bucket (e.g. finposter_cache_primary). A future Electron or
 * backend version could replace this with actual file paths. The cache helps
 * reduce repeated API calls and keeps recovered metadata/artwork available
 * when the primary source is down.
 */

import type { CacheBucket } from '../types';

const PREFIX = 'finposter_cache_';
const FLAG_PREFIX = 'finposter_cache_flag_';
const GLOBAL_FLAG_KEY = 'finposter_cache_enabled_all';

const BUCKETS: CacheBucket[] = [
  'primary',
  'logo',
  'metadata',
  'people',
  'backdrop',
  'music',
  'photos',
];

/** Key for a bucket + item id (e.g. poster URL for a TMDb id). */
function key(bucket: CacheBucket, id: string): string {
  return `${PREFIX}${bucket}_${id}`;
}

/** List all keys that belong to a bucket (for clear operations). */
function listKeysInBucket(bucket: CacheBucket): string[] {
  const out: string[] = [];
  const prefix = `${PREFIX}${bucket}_`;
  const n = localStorage.length;
  for (let i = 0; i < n; i++) {
    const k = localStorage.key(i);
    if (k != null && k.startsWith(prefix)) out.push(k);
  }
  return out;
}

/** List all cache data keys (any key starting with PREFIX, excluding flag keys). */
function listAllCacheKeys(): string[] {
  const out: string[] = [];
  const n = localStorage.length;
  for (let i = 0; i < n; i++) {
    const k = localStorage.key(i);
    if (k != null && k.startsWith(PREFIX) && !k.startsWith(FLAG_PREFIX) && k !== GLOBAL_FLAG_KEY) {
      out.push(k);
    }
  }
  return out;
}

function isGlobalEnabled(): boolean {
  const v = localStorage.getItem(GLOBAL_FLAG_KEY);
  // Default is enabled when unset
  return v !== '0';
}

function setGlobalEnabled(enabled: boolean): void {
  localStorage.setItem(GLOBAL_FLAG_KEY, enabled ? '1' : '0');
}

function isBucketEnabled(bucket: CacheBucket): boolean {
  const v = localStorage.getItem(`${FLAG_PREFIX}${bucket}`);
  // Default to enabled when unset
  return v !== '0';
}

function setBucketEnabled(bucket: CacheBucket, enabled: boolean): void {
  localStorage.setItem(`${FLAG_PREFIX}${bucket}`, enabled ? '1' : '0');
}

export const cacheService = {
  /** Get a cached string value (e.g. image URL or JSON string). */
  get(bucket: CacheBucket, id: string): string | null {
    return localStorage.getItem(key(bucket, id));
  },

  /** Set a cached value. */
  set(bucket: CacheBucket, id: string, value: string): void {
    if (!isGlobalEnabled() || !isBucketEnabled(bucket)) return;
    try {
      localStorage.setItem(key(bucket, id), value);
    } catch {
      // Quota exceeded; ignore
    }
  },

  /** Remove one entry. */
  remove(bucket: CacheBucket, id: string): void {
    localStorage.removeItem(key(bucket, id));
  },

  /** Clear all entries in a bucket. */
  clearBucket(bucket: CacheBucket): void {
    const keys = listKeysInBucket(bucket);
    for (const k of keys) {
      localStorage.removeItem(k);
    }
  },

  /** Clear all cache buckets (all keys with cache data prefix). */
  clearAll(): void {
    const keys = listAllCacheKeys();
    for (const k of keys) {
      localStorage.removeItem(k);
    }
  },

  getBuckets(): CacheBucket[] {
    return [...BUCKETS];
  },

  /** Count how many entries exist in a bucket. */
  count(bucket: CacheBucket): number {
    return listKeysInBucket(bucket).length;
  },

  /** Whether caching is enabled globally. */
  isAllEnabled(): boolean {
    return isGlobalEnabled();
  },

  setAllEnabled(enabled: boolean): void {
    setGlobalEnabled(enabled);
  },

  /** Whether a specific bucket is enabled. */
  isBucketEnabled(bucket: CacheBucket): boolean {
    return isBucketEnabled(bucket);
  },

  setBucketEnabled(bucket: CacheBucket, enabled: boolean): void {
    setBucketEnabled(bucket, enabled);
  },
};
