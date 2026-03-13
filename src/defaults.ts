/**
 * Default settings and constants for FinPoster
 *
 * Used when the user has never saved settings, and as fallback values
 * when we add new options in future updates. Keeps the app from breaking
 * when settings structure changes.
 */

import type { AppSettings, MediaType, UiSettings } from './types';

/** Default list of media types we consider "enabled" everywhere. */
export const DEFAULT_MEDIA_TYPES: MediaType[] = ['Movie', 'Series', 'Music', 'Book', 'Photo', 'People'];

/** Default Jellyfin settings (empty connection; user must configure). */
export const defaultJellyfin = {
  enabled: true,
  serverUrl: '',
  authMode: 'apikey' as const,
  apiKey: '',
  username: '',
  password: '',
  playbackEnabled: true,
  playbackUserId: '',
  playbackWatchIds: [] as string[],
  cachedLibraries: [] as { id: string; name: string; type: string }[],
  libraryIds: [] as string[],
  enabledMediaTypes: [...DEFAULT_MEDIA_TYPES],
};

/** Default Plex settings (placeholder for future). */
export const defaultPlex = {
  enabled: false,
  serverUrl: '',
  token: '',
  libraryIds: [] as string[],
};

/** Default Emby settings (placeholder for future). */
export const defaultEmby = {
  enabled: false,
  serverUrl: '',
  apiKey: '',
  libraryIds: [] as string[],
};

/** How long each poster shows by default (seconds). */
export const DEFAULT_POSTER_DISPLAY_SECONDS = 15;

/** Default ticker scroll speed in pixels per second. */
export const DEFAULT_TICKER_SPEED = 40;

/** Jellyfin-style purple used as default accent. */
export const DEFAULT_ACCENT_HEX = '#00a4dc';
export const DEFAULT_TICKER_COLOR = '#ffffff';

export const defaultMediaShowcase = {
  enabled: true,
  posterDisplaySeconds: DEFAULT_POSTER_DISPLAY_SECONDS,
  showTagline: true,
  tickerScrollSpeedPxPerSec: DEFAULT_TICKER_SPEED,
  tickerColor: DEFAULT_TICKER_COLOR,
  accentColor: DEFAULT_ACCENT_HEX,
  enabledMediaTypes: [...DEFAULT_MEDIA_TYPES],
};

export const defaultNowShowing = {
  enabled: true,
  manualTmdbIds: [] as string[],
  manualTvdbIds: [] as string[],
  mediaTypeForEntries: 'Movie' as MediaType,
  theaterCount: 4,
  sourceMode: 'random' as const,
  showtimeMode: 'random' as const,
  manualShowtimes: [] as string[],
};

export const defaultAds = {
  enabled: false,
  enabledAdIds: [] as string[],
  adDisplaySeconds: 10,
  insertionIntervalPosters: 5,
};

export const defaultMetadata = {
  tmdbApiKey: '',
  tvdbApiKey: '',
  googleBooksApiKey: '',
  comicVineApiKey: '',
};

export const defaultUi: UiSettings = {
  activeTextureId: null,
  dimDisplays: false,
  dimStrength: 45,
};

/** Full default settings object. */
export const defaultSettings: AppSettings = {
  jellyfin: defaultJellyfin,
  plex: defaultPlex,
  emby: defaultEmby,
  mediaShowcase: defaultMediaShowcase,
  nowShowing: defaultNowShowing,
  ads: defaultAds,
  metadata: defaultMetadata,
  ui: defaultUi,
  uploads: [],
};

/** LocalStorage key we use to persist settings. */
export const SETTINGS_STORAGE_KEY = 'finposter-settings';
