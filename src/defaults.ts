/**
 * Default settings and constants for FinPoster
 *
 * Used when the user has never saved settings, and as fallback values
 * when we add new options in future updates. Keeps the app from breaking
 * when settings structure changes.
 */

import type { AppSettings, LoggingSettings, MediaType, UiSettings } from './types';
import type { PosterTransitionId } from './types';

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
export const DEFAULT_HOME_CINEMA_TITLE_COLOR = '#ff0000';
export const DEFAULT_TIME_PILL_COLOR = '#eef207';

/** Light gray used for all display colors when color mode is "mono". */
export const MONO_GRAY = '#c0c0c0';

const DEFAULT_POSTER_TRANSITIONS: PosterTransitionId[] = [
  'fade',
  'slideLeft',
  'slideRight',
  'slideUp',
  'slideDown',
  'zoomIn',
  'zoomOut',
];

export const defaultMediaShowcase = {
  enabled: true,
  posterDisplaySeconds: DEFAULT_POSTER_DISPLAY_SECONDS,
  showTagline: true,
  tickerScrollSpeedPxPerSec: DEFAULT_TICKER_SPEED,
  backdropBlurPx: 18,
  tickerColor: DEFAULT_TICKER_COLOR,
  timePillColor: DEFAULT_TIME_PILL_COLOR,
  displayFont: 'default',
  homeCinemaFont: 'default',
  homeCinemaTitleColor: DEFAULT_HOME_CINEMA_TITLE_COLOR,
  showMediaLogo: true,
  showHomeCinema: true,
  borderColor: '#ffffff',
  accentColor: DEFAULT_ACCENT_HEX,
  colorMode: 'off' as const,
  metapillsColors: {} as Record<string, string>,
  enabledMediaTypes: [...DEFAULT_MEDIA_TYPES],
  enabledTransitions: [...DEFAULT_POSTER_TRANSITIONS],
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
  metadataAsSource: true,
  tmdbApiKey: '',
  tvdbApiKey: '',
  googleBooksApiKey: '',
  comicVineApiKey: '',
};

export const defaultLogging: LoggingSettings = {
  logToConsole: true,
  logToFile: true,
  redact: false,
  debug: false,
};

export const defaultUi: UiSettings = {
  activeTextureId: null,
  textureStrength: 100,
  backgroundTextureStrength: 100,
  dimDisplays: false,
  dimStrength: 45,
  mediaSyncIntervalMinutes: 0,
  homeCinemaTitle: '',
  navMediaServersOpen: false,
  navArrOpen: false,
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
  logging: defaultLogging,
  ui: defaultUi,
  uploads: [],
};

/** LocalStorage key we use to persist settings. */
export const SETTINGS_STORAGE_KEY = 'finposter-settings';
