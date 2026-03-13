/**
 * FinPoster type definitions
 *
 * This file defines all the shared types used across the app so that
 * display modes, settings, and media sources all speak the same language.
 * Adding new media types or display options should start here.
 */

/** Which display mode is currently active (used for rotation logic). */
export type DisplayMode = 'media-showcase' | 'homecinema' | 'now-showing' | 'ads' | 'tickerslide' | 'metapills' | 'progressslide';

/** Media types we support in showcase and now showing (matches Jellyfin library types). */
export type MediaType = 'Movie' | 'Series' | 'Music' | 'Book' | 'Photo' | 'People';

/** Where a piece of media or artwork came from (for fallback and cache keys). */
export type MediaSourceKind =
  | 'jellyfin'
  | 'plex'
  | 'emby'
  | 'cache'
  | 'tmdb'
  | 'tvdb'
  | 'googlebooks'
  | 'comicvine'
  | 'user';

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
  /** For Series: episode-specific plot when showing an episode (show plot + this in ticker). */
  episodePlot?: string;
  /** For Music: album name (ticker shows artist + album info). */
  album?: string;
  year?: number;
  /** Parental/content rating (e.g. G, PG, PG-13, R, NR, TV-MA). */
  rating?: string;
  /** Community rating (e.g. 7.5 out of 10). */
  communityRating?: number;
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
  /** Runtime string (e.g. "2h 15m", "45 min") for movies/episodes. */
  runtime?: string;
  /** Source we got this from (for cache keying and debugging). */
  source: MediaSourceKind;
}

/**
 * Ad item: image + optional label and pricing lines.
 * Stored in uploads; ads display mode shows these in rotation.
 */
export interface AdPriceLine {
  /** Short label, e.g. \"Small\", \"Combo 1\", \"per month\". */
  label: string;
  /** Price text, e.g. \"$9.99\". */
  price: string;
}

export interface AdItem {
  id: string;
  imageUrl: string;
  label?: string;
  /** Optional one or more price lines to show over the ad. */
  prices?: AdPriceLine[];
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
  /** Whether Jellyfin is currently used as an active media source. */
  enabled: boolean;
  serverUrl: string;
  authMode: 'apikey' | 'password';
  apiKey: string;
  username: string;
  password: string;
  /** Whether playback-based features are enabled. */
  playbackEnabled?: boolean;
  /** Primary user or device ID used to detect \"currently playing\". */
  playbackUserId: string;
  /** Additional user/device IDs to watch for playback (optional). */
  playbackWatchIds?: string[];
  /** Last loaded library list (so we can show it without reloading). */
  cachedLibraries?: { id: string; name: string; type: string }[];
  /** Library IDs to use for Media Showcase / Now Showing. */
  libraryIds: string[];
  enabledMediaTypes: MediaType[];
}

/** Placeholder for future Plex support; same idea as Jellyfin. */
export interface PlexSettings {
  /** Whether Plex is currently used as an active media source. */
  enabled?: boolean;
  serverUrl: string;
  token: string;
  libraryIds: string[];
}

/** Placeholder for future Emby support. */
export interface EmbySettings {
  /** Whether Emby is currently used as an active media source. */
  enabled?: boolean;
  serverUrl: string;
  apiKey: string;
  libraryIds: string[];
}

/** Poster transition IDs for Media Showcase (randomly chosen when poster changes). */
export type PosterTransitionId =
  | 'fade'
  | 'slideLeft'
  | 'slideRight'
  | 'slideUp'
  | 'slideDown'
  | 'zoomIn'
  | 'zoomOut';

/** Media Showcase display options (timing, ticker, colors, transitions). */
export interface MediaShowcaseSettings {
  /** Whether the Media Showcase mode is enabled as a display. */
  enabled: boolean;
  posterDisplaySeconds: number;
  showTagline: boolean;
  tickerScrollSpeedPxPerSec: number;
  /** Backdrop blur in pixels (0 = none). */
  backdropBlurPx: number;
  /** Hex color for ticker bar scrolling text. */
  tickerColor: string;
  /** Hex color for time pill text (and border). */
  timePillColor: string;
  /** Font for ticker bar (e.g. 'bebas-neue', 'oswald'). 'default' = theme font. */
  displayFont: string;
  /** Font for Home Cinema title (e.g. 'bebas-neue', 'oswald'). 'default' = use displayFont. */
  homeCinemaFont: string;
  /** Hex color for Home Cinema title (and media title below poster). */
  homeCinemaTitleColor: string;
  /** When true, show media logo or title below the poster in Home Cinema (with border). */
  showMediaLogo: boolean;
  /** When true, include Home Cinema in the rotation after each poster in Media Showcase. */
  showHomeCinema: boolean;
  /** Hex color for poster/showcase borders (Media Showcase and Home Cinema). */
  borderColor: string;
  accentColor: string;
  /** 'off' = use user-entered colors; 'colorful' = use default palette; 'mono' = override all to light gray. */
  colorMode?: 'off' | 'colorful' | 'mono';
  /** Optional hex color per metapill key (e.g. type, year, runtime). When set, that pill’s value uses this color. */
  metapillsColors?: Record<string, string>;
  enabledMediaTypes: MediaType[];
  /** Which poster transitions are enabled (one is picked at random when the poster changes). */
  enabledTransitions: PosterTransitionId[];
}

/** How we build the Now Showing list and showtimes. */
export interface NowShowingSettings {
  /** Whether the Now Showing board is enabled as a display mode. */
  enabled: boolean;
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

/** External API keys for metadata fallback (TMDb, TheTVDB, Google Books, Comic Vine). */
export interface MetadataSettings {
  /** When true, use TMDb/TheTVDB/Google Books/Comic Vine to enrich missing artwork and metadata. */
  metadataAsSource: boolean;
  tmdbApiKey: string;
  tvdbApiKey: string;
  googleBooksApiKey: string;
  comicVineApiKey: string;
}

/** Cache clear options (which buckets to clear). */
export type CacheBucket = 'primary' | 'logo' | 'metadata' | 'people' | 'backdrop' | 'music' | 'photos';

/** Logging options – console, file, redaction, debug. */
export interface LoggingSettings {
  logToConsole: boolean;
  logToFile: boolean;
  redact: boolean;
  debug: boolean;
}

/** Simple UI/theme-level options (non-media, non-provider). */
export interface UiSettings {
  /** Active poster texture upload id (if any). */
  activeTextureId?: string | null;
  /** Texture visibility on poster: 0 = invisible, 100 = full strength (only when a texture is active). */
  textureStrength: number;
  /** Texture visibility on full-screen background: 0 = invisible, 100 = full (when a texture is active). */
  backgroundTextureStrength?: number;
  /** When true, dim display pages but keep settings fully bright. */
  dimDisplays: boolean;
  /** How strong the dim overlay is, from 0 (none) to 100 (fully black). */
  dimStrength: number;
  /** Set to Date.now() when user clicks Sync on a media server to force a media pull. */
  mediaSyncRequestedAt?: number;
  /** Sync media from Jellyfin every N minutes (0 = disabled). */
  mediaSyncIntervalMinutes: number;
  /** When true, scheduled and in-progress media sync is stopped until next "Sync media". */
  mediaSyncStopped?: boolean;
  /** User-entered title for the Home Cinema display (when set, shown instead of media title). */
  homeCinemaTitle?: string;
  /** Settings sidebar: Media servers section expanded (remembered per user). */
  navMediaServersOpen?: boolean;
  /** Settings sidebar: Arr section expanded (remembered per user). */
  navArrOpen?: boolean;
}
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
  /** For ads: optional longer description/notes. */
  description?: string;
   /** For ads: optional repeated price lines. */
  prices?: AdPriceLine[];
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
  logging: LoggingSettings;
  ui: UiSettings;
  /** List of uploaded files (ads, textures). */
  uploads: UploadedFile[];
}
