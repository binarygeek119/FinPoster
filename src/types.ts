/**
 * FinPoster type definitions
 *
 * This file defines all the shared types used across the app so that
 * display modes, settings, and media sources all speak the same language.
 * Adding new media types or display options should start here.
 */

/** Which display mode is currently active (used for rotation logic). */
export type DisplayMode = 'media-showcase' | 'now-showing' | 'ads';

/** Media types we support in showcase and now showing (matches Jellyfin library types). */
export type MediaType = 'Movie' | 'Series' | 'Music' | 'Book';

/** Where a piece of media or artwork came from (for fallback and cache keys). */
export type MediaSourceKind = 'jellyfin' | 'plex' | 'emby' | 'cache' | 'tmdb' | 'tvdb' | 'user';

/**
 * Normalized media item used by display pages.
 * We convert Jellyfin (or future Plex/Emby) responses into this shape so
 * Media Showcase and Now Showing don't need to know the source.
 */
export interface MediaItem {
  id: string;
  /** External IDs for metadata fallback (TMDb, TheTVDB). */
  tmdbId?: string;
  tvdbId?: string;
  type: MediaType;
  title: string;
  /** Short one-liner often shown under the title. */
  tagline?: string;
  plot?: string;
  year?: number;
  rating?: string;
  studio?: string;
  network?: string;
  publisher?: string;
  artist?: string;
  author?: string;
  /** URL to primary poster image. */
  posterUrl?: string;
  /** URL to backdrop (full-screen background). */
  backdropUrl?: string;
  /** URL to logo image if available (e.g. show logo). */
  logoUrl?: string;
  /** Artist/author image for music/books. */
  artistImageUrl?: string;
  authorImageUrl?: string;
  /** When this item is "playing", we show the playback overlay. */
  playbackStartTime?: number;
  playbackEndTime?: number;
  /** Source we got this from (for cache keying and debugging). */
  source: MediaSourceKind;
}

/**
 * Ad item: just an image URL and optional label.
 * Stored in uploads; ads display mode shows these in rotation.
 */
export interface AdItem {
  id: string;
  imageUrl: string;
  label?: string;
}

/**
 * Single entry on the "Now Showing" board (one row with poster + showtime).
 */
export interface NowShowingEntry {
  id: string;
  media: MediaItem;
  /** Display time for this "showtime" (e.g. "7:00 PM"). */
  showtime: string;
  /** Optional ticker text for this row. */
  tickerText?: string;
}

/** Jellyfin connection and library settings. */
export interface JellyfinSettings {
  serverUrl: string;
  authMode: 'apikey' | 'password';
  apiKey: string;
  username: string;
  password: string;
  /** User or device ID used to detect "currently playing". */
  playbackUserId: string;
  /** Library IDs to use for Media Showcase / Now Showing. */
  libraryIds: string[];
  enabledMediaTypes: MediaType[];
}

/** Placeholder for future Plex support; same idea as Jellyfin. */
export interface PlexSettings {
  serverUrl: string;
  token: string;
  libraryIds: string[];
}

/** Placeholder for future Emby support. */
export interface EmbySettings {
  serverUrl: string;
  apiKey: string;
  libraryIds: string[];
}

/** Media Showcase display options (timing, ticker, colors). */
export interface MediaShowcaseSettings {
  posterDisplaySeconds: number;
  showTagline: boolean;
  tickerScrollSpeedPxPerSec: number;
  /** Hex color overrides for ticker/overlay (optional). */
  tickerColor: string;
  accentColor: string;
  enabledMediaTypes: MediaType[];
}

/** How we build the Now Showing list and showtimes. */
export interface NowShowingSettings {
  /** Manually entered TMDb movie IDs for showtime entries. */
  manualTmdbIds: string[];
  /** Manually entered TheTVDB IDs (e.g. for TV). */
  manualTvdbIds: string[];
  mediaTypeForEntries: MediaType;
  theaterCount: number;
  /** 'manual' = use manual IDs only; 'random' = mix with server libraries. */
  sourceMode: 'manual' | 'random';
  /** User-defined showtimes or 'random' to generate. */
  showtimeMode: 'manual' | 'random';
  manualShowtimes: string[];
}

/** Ads display mode behavior. */
export interface AdsSettings {
  enabled: boolean;
  /** Which ad IDs are enabled (others are skipped). */
  enabledAdIds: string[];
  adDisplaySeconds: number;
  /** Show ads after this many poster rotations in Media Showcase. */
  insertionIntervalPosters: number;
}

/** External API keys for metadata fallback (TMDb, TheTVDB). */
export interface MetadataSettings {
  tmdbApiKey: string;
  tvdbApiKey: string;
}

/** Cache clear options (which buckets to clear). */
export type CacheBucket = 'primary' | 'logo' | 'metadata' | 'artists' | 'authors' | 'backdrop';

/** Upload categories we support (textures, ads). */
export type UploadCategory = 'textures' | 'ads';

/** One uploaded file reference (we store URL from object URL or future backend). */
export interface UploadedFile {
  id: string;
  category: UploadCategory;
  name: string;
  url: string;
  /** For ads: optional label. */
  label?: string;
}

/**
 * Full app settings object persisted to localStorage and backup.
 * Every settings page reads/writes a slice of this.
 */
export interface AppSettings {
  jellyfin: JellyfinSettings;
  plex: PlexSettings;
  emby: EmbySettings;
  mediaShowcase: MediaShowcaseSettings;
  nowShowing: NowShowingSettings;
  ads: AdsSettings;
  metadata: MetadataSettings;
  /** List of uploaded files (ads, textures). */
  uploads: UploadedFile[];
}
