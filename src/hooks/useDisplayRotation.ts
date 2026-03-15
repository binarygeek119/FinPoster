/**
 * Display rotation hook – drives which mode is visible and when to switch
 *
 * Rotation behavior: Media Showcase runs by default. After a configured number
 * of poster rotations we may show Ads (if enabled and ads exist) or Now Showing.
 * After those modes finish we return to Media Showcase. This hook returns the
 * current mode, current media item for showcase, now showing entries, and ads
 * list so the DisplayRotator can render the right child. It also handles
 * fetching from Jellyfin and building fallback when nothing is available.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import type { DisplayMode, MediaItem, NowShowingEntry, AdItem } from '../types';
import { getTickerText } from '../utils/tickerText';
import { useSettings } from '../store/settingsStore';
import { getCachedMedia, getJellyfinLibraryItems, getJellyfinItem, getNowPlaying, resolveAssetUrl } from '../services/jellyfin';
import { logDebug } from '../services/logger';

/** Only include items that have a poster image (skip until poster is in cache / available). */
function onlyWithPoster(items: MediaItem[]): MediaItem[] {
  return items.filter((m) => !!resolveAssetUrl(m.posterUrl));
}

/** Build list of ads from uploads that are enabled in ads settings. */
function getEnabledAds(uploads: { id: string; category: string; url: string; label?: string }[], enabledAdIds: string[]): AdItem[] {
  const adUploads = uploads.filter((u) => u.category === 'ads');
  if (enabledAdIds.length) {
    return enabledAdIds
      .map((id) => adUploads.find((u) => u.id === id))
      .filter(Boolean)
      .map((u) => ({ id: u!.id, imageUrl: u!.url, label: u!.label }));
  }
  return adUploads.map((u) => ({ id: u.id, imageUrl: u.url, label: u.label }));
}

/** Build now showing entries from cached media (cache-first: no direct Jellyfin). */
async function buildNowShowingEntries(theaterCount: number): Promise<NowShowingEntry[]> {
  const entries: NowShowingEntry[] = [];
  const cached = await getCachedMedia('jellyfin', theaterCount * 3);
  const withPoster = onlyWithPoster(cached);
  const movieOrSeries = withPoster.filter((m) => m.type === 'Movie' || m.type === 'Series');
  const shuffled = [...movieOrSeries].sort(() => Math.random() - 0.5);
  for (let i = 0; i < Math.min(theaterCount, shuffled.length); i++) {
    const item = shuffled[i];
    const hour = 18 + (i % 4);
    const min = i % 2 === 0 ? 0 : 30;
    entries.push({
      id: item.id,
      media: item,
      showtime: `${hour}:${min.toString().padStart(2, '0')}`,
      tickerText: getTickerText(item),
    });
  }
  return entries;
}

export type PlaybackStatus = 'playing' | 'paused' | 'stopped' | null;

export function useDisplayRotation(initialMode?: DisplayMode | null) {
  const { settings } = useSettings();
  const jellyfin = settings.jellyfin;
  const mediaShowcase = settings.mediaShowcase;
  const adsSettings = settings.ads;
  const nowShowingSettings = settings.nowShowing;

  const onlyAdsEnabled =
    adsSettings.enabled && !mediaShowcase.enabled && !nowShowingSettings.enabled;
  const onlyNowShowingEnabled =
    nowShowingSettings.enabled && !mediaShowcase.enabled && !adsSettings.enabled;
  const onlyPlaybackEnabled =
    jellyfin.playbackEnabled &&
    !mediaShowcase.enabled &&
    !adsSettings.enabled &&
    !nowShowingSettings.enabled;
  const adsAndNowShowingOnly =
    adsSettings.enabled &&
    nowShowingSettings.enabled &&
    !mediaShowcase.enabled &&
    !onlyAdsEnabled &&
    !onlyNowShowingEnabled;

  const defaultMode: DisplayMode =
    initialMode ??
    (onlyAdsEnabled
      ? 'ads'
      : onlyNowShowingEnabled
        ? 'now-showing'
        : adsAndNowShowingOnly
          ? 'ads'
          : onlyPlaybackEnabled
            ? 'progressslide'
            : 'media-showcase');

  const [mode, setMode] = useState<DisplayMode>(defaultMode);
  const [mediaPool, setMediaPool] = useState<MediaItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [posterRotationCount, setPosterRotationCount] = useState(0);
  const [nowShowingEntries, setNowShowingEntries] = useState<NowShowingEntry[]>([]);
  const [adsList, setAdsList] = useState<AdItem[]>([]);
  /** When set (e.g. from Jellyfin now-playing), playback display stays until stopped or ended. */
  const [playbackStatus, setPlaybackStatus] = useState<PlaybackStatus>(null);
  const [playingProgress, setPlayingProgress] = useState(0);
  /** Item to show in playback display (pinned when entering progressslide so poster matches "playing" media). */
  const [playbackItem, setPlaybackItem] = useState<MediaItem | null>(null);
  const playbackItemRef = useRef<MediaItem | null>(null);

  /** True when at least one display mode needs media from cache (showcase or now-showing random/manual+fill). */
  const needsMediaCache =
    mediaShowcase.enabled ||
    (nowShowingSettings.enabled &&
      (nowShowingSettings.sourceMode === 'random' ||
        nowShowingSettings.manualFillWithRandom));

  // Cache-first: display reads only from cache. Sources (Jellyfin, TMDb) only fill the cache.
  const loadMediaPoolFromCache = useCallback(async () => {
    if (!mediaShowcase.enabled) {
      setMediaPool([]);
      return;
    }
    if (!needsMediaCache) {
      setMediaPool([]);
      return;
    }
    const cached = await getCachedMedia('jellyfin', 100);
    setMediaPool(onlyWithPoster(cached));
    setCurrentIndex(0);
  }, [mediaShowcase.enabled, needsMediaCache]);

  // Fill cache from Jellyfin (and optionally TMDb on backend). Call on Sync or when cache empty.
  const fillCacheFromJellyfin = useCallback(async () => {
    if (
      !jellyfin.enabled ||
      !jellyfin.serverUrl ||
      !jellyfin.apiKey ||
      !jellyfin.libraryIds.length
    ) {
      return;
    }
    for (const libId of jellyfin.libraryIds) {
      await getJellyfinLibraryItems(
        jellyfin.serverUrl,
        jellyfin.apiKey,
        libId,
        jellyfin.enabledMediaTypes,
        0,
        jellyfin.playbackUserId
      );
    }
  }, [jellyfin.enabled, jellyfin.serverUrl, jellyfin.apiKey, jellyfin.libraryIds.length, jellyfin.enabledMediaTypes, jellyfin.playbackUserId]);

  // On mount: load from cache only when a mode needs media. If cache empty and Jellyfin configured, fill then load again (unless sync stopped or interval is 0).
  const syncStopped = settings.ui.mediaSyncStopped === true;
  const syncIntervalMinutes = settings.ui.mediaSyncIntervalMinutes ?? 0;
  const autoSyncEnabled = syncIntervalMinutes > 0;
  useEffect(() => {
    if (!needsMediaCache) {
      setMediaPool([]);
      setCurrentIndex(0);
      return;
    }
    let cancelled = false;
    (async () => {
      const cached = await getCachedMedia('jellyfin', 100);
      const pool = onlyWithPoster(cached);
      if (!cancelled) {
        setMediaPool(pool);
        setCurrentIndex(0);
      }
      logDebug('useDisplayRotation: initial cache size', cached.length, 'with poster', pool.length);
      if (
        !syncStopped &&
        autoSyncEnabled &&
        cached.length === 0 &&
        jellyfin.enabled &&
        jellyfin.serverUrl &&
        jellyfin.apiKey &&
        jellyfin.libraryIds.length
      ) {
        logDebug('useDisplayRotation: cache empty, filling from Jellyfin');
        await fillCacheFromJellyfin();
        if (cancelled) return;
        const after = await getCachedMedia('jellyfin', 100);
        if (!cancelled) {
          setMediaPool(onlyWithPoster(after));
          setCurrentIndex(0);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [needsMediaCache, fillCacheFromJellyfin, jellyfin.enabled, jellyfin.serverUrl, jellyfin.apiKey, jellyfin.libraryIds.length, syncStopped, autoSyncEnabled]);

  // Periodic refetch from cache only (no Jellyfin call).
  useEffect(() => {
    const interval = setInterval(loadMediaPoolFromCache, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadMediaPoolFromCache]);

  // Optional: sync from Jellyfin every N minutes (General → Media sync). Respects "Stop sync". 0 = off.
  useEffect(() => {
    if (
      syncStopped ||
      syncIntervalMinutes <= 0 ||
      !jellyfin.enabled ||
      !jellyfin.serverUrl ||
      !jellyfin.apiKey ||
      !jellyfin.libraryIds.length
    ) {
      return;
    }
    const ms = syncIntervalMinutes * 60 * 1000;
    logDebug('useDisplayRotation: scheduled sync every', syncIntervalMinutes, 'minutes');
    const runSync = async () => {
      await fillCacheFromJellyfin();
      await loadMediaPoolFromCache();
    };
    runSync();
    const timer = setInterval(runSync, ms);
    return () => clearInterval(timer);
  }, [
    syncStopped,
    syncIntervalMinutes,
    fillCacheFromJellyfin,
    loadMediaPoolFromCache,
    jellyfin.enabled,
    jellyfin.serverUrl,
    jellyfin.apiKey,
    jellyfin.libraryIds.length,
  ]);

  // When playback starts but media cache is empty, pull from Jellyfin right away so playback media appears.
  useEffect(() => {
    if (
      (playbackStatus === 'playing' || playbackStatus === 'paused') &&
      mediaPool.length === 0 &&
      !syncStopped &&
      jellyfin.enabled &&
      jellyfin.serverUrl &&
      jellyfin.apiKey &&
      jellyfin.libraryIds.length
    ) {
      (async () => {
        logDebug('useDisplayRotation: playback active but cache empty, pulling from Jellyfin immediately');
        await fillCacheFromJellyfin();
        await loadMediaPoolFromCache();
      })();
    }
  }, [
    playbackStatus,
    mediaPool.length,
    syncStopped,
    jellyfin.enabled,
    jellyfin.serverUrl,
    jellyfin.apiKey,
    jellyfin.libraryIds.length,
    fillCacheFromJellyfin,
    loadMediaPoolFromCache,
  ]);

  // When user has just synced (from Jellyfin settings), refresh display from cache.
  const syncRequestedAt = settings.ui.mediaSyncRequestedAt;
  useEffect(() => {
    if (!syncRequestedAt || Date.now() - syncRequestedAt >= 60000) return;
    logDebug('useDisplayRotation: sync completed recently, reloading from cache');
    loadMediaPoolFromCache();
  }, [syncRequestedAt, loadMediaPoolFromCache]);

  // Build now showing list from cached media when we need it.
  useEffect(() => {
    if (mode !== 'now-showing') return;
    if (!nowShowingSettings.enabled) {
      setNowShowingEntries([]);
      return;
    }
    const useRandom =
      nowShowingSettings.sourceMode === 'random' ||
      nowShowingSettings.manualFillWithRandom;
    if (!useRandom) {
      setNowShowingEntries([]);
      return;
    }
    buildNowShowingEntries(nowShowingSettings.theaterCount).then(setNowShowingEntries);
  }, [
    mode,
    nowShowingSettings.enabled,
    nowShowingSettings.theaterCount,
    nowShowingSettings.sourceMode,
    nowShowingSettings.manualFillWithRandom,
  ]);

  // Ads list from uploads.
  useEffect(() => {
    setAdsList(
      getEnabledAds(settings.uploads, adsSettings.enabledAdIds)
    );
  }, [settings.uploads, adsSettings.enabledAdIds]);

  // Current media item for showcase (random from pool, or null).
  const currentMedia = mediaPool.length
    ? mediaPool[currentIndex % mediaPool.length]
    : null;
  // Next item in pool (for preloading).
  const nextMedia = mediaPool.length > 1
    ? mediaPool[(currentIndex + 1) % mediaPool.length]
    : null;
  // A few upcoming items in pool (for preloading metadata/images ahead of time).
  const UPCOMING_PRELOAD_COUNT = 4;
  const upcomingMedia: MediaItem[] = [];
  for (let offset = 1; offset <= UPCOMING_PRELOAD_COUNT && offset < mediaPool.length; offset += 1) {
    upcomingMedia.push(mediaPool[(currentIndex + offset) % mediaPool.length]);
  }

  // Track recently shown poster indices to improve randomness (avoid repeats in short windows).
  const [recentPosterIndices, setRecentPosterIndices] = useState<number[]>([]);

  useEffect(() => {
    // Reset recency window when pool changes significantly.
    setRecentPosterIndices([]);
  }, [mediaPool.length]);

  // After each poster duration in media-showcase, advance to a random next poster (avoid same poster twice in a row).
  useEffect(() => {
    if (mode !== 'media-showcase') return;
    if (!mediaShowcase.enabled) return;
    if (!currentMedia) return;
    const duration = mediaShowcase.posterDisplaySeconds * 1000;
    const poolLength = mediaPool.length;
    const t = setTimeout(() => {
      setCurrentIndex((i) => {
        if (poolLength <= 1) return i + 1;
        const avoidLast = Math.max(1, mediaShowcase.avoidRepeatWithinLast ?? 5);
        const recentSet = new Set<number>([i, ...recentPosterIndices]);
        let candidate = i;
        const maxAttempts = 10;
        for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
          const r = Math.floor(Math.random() * poolLength);
          if (!recentSet.has(r)) {
            candidate = r;
            break;
          }
        }
        if (candidate === i) {
          candidate = (i + 1) % poolLength;
        }
        setRecentPosterIndices((prev) => {
          const nextArr = [...prev, candidate];
          return nextArr.slice(-Math.max(0, avoidLast - 1));
        });
        return candidate;
      });
      setPosterRotationCount((c) => c + 1);
    }, duration);
    return () => clearTimeout(t);
  }, [mode, currentMedia?.id, mediaShowcase.enabled, mediaShowcase.posterDisplaySeconds, mediaShowcase.avoidRepeatWithinLast, mediaPool.length, recentPosterIndices]);

  // After N poster rotations (media-showcase cycles), switch to Ads or Now Showing.
  useEffect(() => {
    if (mode !== 'media-showcase') return;
    if (onlyNowShowingEnabled) {
      setMode('now-showing');
      return;
    }
    const interval = adsSettings.insertionIntervalPosters || 5;
    if (posterRotationCount > 0 && posterRotationCount % interval === 0) {
      if (adsSettings.enabled && adsList.length > 0) {
        setMode('ads');
        return;
      }
      setMode('now-showing');
    }
  }, [mode, posterRotationCount, adsSettings.enabled, adsSettings.insertionIntervalPosters, adsList.length]);

  // After ads duration, return to showcase. (AdsDisplay rotates internally; we switch mode after one "cycle" or fixed time.)
  useEffect(() => {
    if (mode !== 'ads') return;
    if (onlyAdsEnabled) return;
    const totalAdTime = adsList.length * adsSettings.adDisplaySeconds * 1000;
    const t = setTimeout(() => {
      setMode(adsAndNowShowingOnly ? 'now-showing' : 'media-showcase');
    }, Math.max(totalAdTime, adsSettings.adDisplaySeconds * 1000));
    return () => clearTimeout(t);
  }, [mode, adsList.length, adsSettings.adDisplaySeconds]);

  // Full duration (ms) for Metapills, ProgressSlide – always run fully every time. TickerSlide is static (not in rotation).
  const FULL_SLIDE_DURATION_MS = 30000;

  // After now showing, go to Metapills for full duration.
  useEffect(() => {
    if (mode !== 'now-showing') return;
    if (onlyNowShowingEnabled) return;
    const t = setTimeout(
      () => setMode(adsAndNowShowingOnly ? 'ads' : 'metapills'),
      FULL_SLIDE_DURATION_MS,
    );
    return () => clearTimeout(t);
  }, [mode]);

  // Keep ref updated so we know which item was on screen when we leave metapills.
  useEffect(() => {
    if (mode === 'metapills' && currentMedia) playbackItemRef.current = currentMedia;
  }, [mode, currentMedia]);

  // After Metapills, show ProgressSlide (playback display) only when playback is enabled. Otherwise go to media-showcase.
  useEffect(() => {
    if (mode !== 'metapills') return;
    const t = setTimeout(() => {
      if (!jellyfin.playbackEnabled) {
        setMode('media-showcase');
        return;
      }
      const item = playbackItemRef.current;
      setPlaybackItem(item ?? null);
      setMode('progressslide');
      setPlaybackStatus('paused');
      setPlayingProgress(0);
    }, FULL_SLIDE_DURATION_MS);
    return () => clearTimeout(t);
  }, [mode, jellyfin.playbackEnabled]);

  // When playback is enabled, poll Jellyfin Sessions to show/hide playback UI based on actual playback.
  const PLAYBACK_POLL_MS = 5000;
  useEffect(() => {
    if (!jellyfin.playbackEnabled || !jellyfin.serverUrl || !jellyfin.apiKey) return;
    let cancelled = false;
    const poll = async () => {
      if (cancelled) return;
      const np = await getNowPlaying(
        jellyfin.serverUrl,
        jellyfin.apiKey,
        jellyfin.playbackUserId || undefined,
        jellyfin.playbackWatchIds?.length ? jellyfin.playbackWatchIds : undefined
      );
      if (cancelled) return;
      logDebug('[Playback] poll now-playing', np ? { itemId: np.itemId, progress: np.progress, isPaused: np.isPaused } : 'nothing playing');
      if (np) {
        setPlaybackStatus(np.isPaused ? 'paused' : 'playing');
        setPlayingProgress(np.progress);
        setMode('progressslide');
        const placeholder: MediaItem = {
          id: np.itemId,
          type: 'Movie',
          title: 'Loading…',
          source: 'jellyfin',
        };
        setPlaybackItem((prev) => {
          if (prev?.id === np.itemId) return prev;
          return placeholder;
        });
        if (playbackItemRef.current?.id !== np.itemId) {
          playbackItemRef.current = placeholder;
          getJellyfinItem(
            jellyfin.serverUrl,
            jellyfin.apiKey,
            np.itemId,
            jellyfin.playbackUserId
          ).then((item) => {
            if (!cancelled && item) {
              playbackItemRef.current = item;
              setPlaybackItem(item);
            }
          });
        }
      } else {
        setPlaybackStatus('stopped');
      }
    };
    poll();
    const id = setInterval(poll, PLAYBACK_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [
    jellyfin.playbackEnabled,
    jellyfin.serverUrl,
    jellyfin.apiKey,
    jellyfin.playbackUserId,
    jellyfin.playbackWatchIds,
  ]);

  // When playback is disabled, exit playback mode and clear playback state immediately.
  useEffect(() => {
    if (jellyfin.playbackEnabled) return;
    setPlaybackStatus(null);
    setPlayingProgress(0);
    setPlaybackItem(null);
    playbackItemRef.current = null;
    if (mode === 'progressslide') {
      setMode('media-showcase');
    }
  }, [jellyfin.playbackEnabled, mode]);

  // When playback is showing an item without a cached poster, fetch that item from Jellyfin so the poster is cached.
  useEffect(() => {
    if (mode !== 'progressslide' || !playbackItem || playbackItem.posterUrl) return;
    if (!jellyfin.enabled || !jellyfin.serverUrl || !jellyfin.apiKey) return;
    let cancelled = false;
    getJellyfinItem(
      jellyfin.serverUrl,
      jellyfin.apiKey,
      playbackItem.id,
      jellyfin.playbackUserId
    ).then((item) => {
      if (cancelled || !item?.posterUrl) return;
      setPlaybackItem(item);
    });
    return () => { cancelled = true; };
  }, [mode, playbackItem?.id, playbackItem?.posterUrl, jellyfin.enabled, jellyfin.serverUrl, jellyfin.apiKey, jellyfin.playbackUserId]);

  // Playback display: stay on screen the whole time media is playing; only leave when stopped or progress >= 1 (ended).
  // No time-based exit – playback stays until playback stops or finishes.
  useEffect(() => {
    if (mode !== 'progressslide') return;
    if (onlyPlaybackEnabled) return;
    if (playbackStatus === 'stopped' || playingProgress >= 1) {
      setPlaybackStatus(null);
      setPlayingProgress(0);
      setPlaybackItem(null);
      setMode('media-showcase');
    }
  }, [mode, playbackStatus, playingProgress]);

  return {
    mode,
    currentMedia,
    /** Item to show in playback display (same as the media that is "playing"). */
    playbackItem,
    nextMedia,
    upcomingMedia,
    nowShowingEntries,
    adsList,
    adsDurationSeconds: adsSettings.adDisplaySeconds,
    showFallback: mode === 'media-showcase' && !currentMedia && mediaPool.length === 0,
    /** Playback progress 0..1. When >= 1, playback display exits. */
    playingProgress,
    /** When 'playing' or 'paused', poster + ProgressSlide stay on screen until stopped or ended. */
    playbackStatus,
    setPlaybackStatus,
    setPlayingProgress,
  };
}
