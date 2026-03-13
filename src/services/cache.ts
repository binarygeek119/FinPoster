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

const BUCKETS: CacheBucket[] = [
  'primary',
  'logo',
  'metadata',
  'artists',
  'authors',
  'backdrop',
];

/** Key for a bucket + item id (e.g. poster URL for a TMDb id). */
function key(bucket: CacheBucket, id: string): string {
  return `${PREFIX}${bucket}_${id}`;
}

/** List all keys that belong to a bucket (for clear operations). */
function listKeysInBucket(bucket: CacheBucket): string[] {
  const out: string[] = [];
  const prefix = `${PREFIX}${bucket}_`;
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith(prefix)) out.push(k);
  }
  return out;
}

export const cacheService = {
  /** Get a cached string value (e.g. image URL or JSON string). */
  get(bucket: CacheBucket, id: string): string | null {
    return localStorage.getItem(key(bucket, id));
  },

  /** Set a cached value. */
  set(bucket: CacheBucket, id: string, value: string): void {
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
    for (const k of listKeysInBucket(bucket)) {
      localStorage.removeItem(k);
    }
  },

  /** Clear all cache buckets. */
  clearAll(): void {
    for (const b of BUCKETS) {
      this.clearBucket(b);
    }
  },

  getBuckets(): CacheBucket[] {
    return [...BUCKETS];
  },
};
