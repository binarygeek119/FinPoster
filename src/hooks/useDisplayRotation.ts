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

import { useEffect, useState, useCallback } from 'react';
import type { DisplayMode, MediaItem, NowShowingEntry, AdItem } from '../types';
import { getTickerText } from '../utils/tickerText';
import { useSettings } from '../store/settingsStore';
import { getCachedMedia, getJellyfinLibraryItems } from '../services/jellyfin';
import { logDebug } from '../services/logger';

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
async function buildNowShowingEntries(
  theaterCount: number,
  sourceMode: 'manual' | 'random'
): Promise<NowShowingEntry[]> {
  const entries: NowShowingEntry[] = [];
  if (sourceMode !== 'random') return entries;

  const cached = await getCachedMedia('jellyfin', theaterCount * 3);
  const movieOrSeries = cached.filter((m) => m.type === 'Movie' || m.type === 'Series');
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

export function useDisplayRotation() {
  const { settings } = useSettings();
  const [mode, setMode] = useState<DisplayMode>('media-showcase');
  const [mediaPool, setMediaPool] = useState<MediaItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [posterRotationCount, setPosterRotationCount] = useState(0);
  const [nowShowingEntries, setNowShowingEntries] = useState<NowShowingEntry[]>([]);
  const [adsList, setAdsList] = useState<AdItem[]>([]);

  const jellyfin = settings.jellyfin;
  const mediaShowcase = settings.mediaShowcase;
  const adsSettings = settings.ads;
  const nowShowingSettings = settings.nowShowing;

  /** True when at least one display mode needs media from cache (showcase or now-showing random). */
  const needsMediaCache =
    mediaShowcase.enabled ||
    (nowShowingSettings.enabled && nowShowingSettings.sourceMode === 'random');

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
    setMediaPool(cached);
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
        50,
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
      if (!cancelled) {
        setMediaPool(cached);
        setCurrentIndex(0);
      }
      logDebug('useDisplayRotation: initial cache size', cached.length);
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
          setMediaPool(after);
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
    buildNowShowingEntries(
      nowShowingSettings.theaterCount,
      nowShowingSettings.sourceMode
    ).then(setNowShowingEntries);
  }, [mode, nowShowingSettings.enabled, nowShowingSettings.theaterCount, nowShowingSettings.sourceMode]);

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
        const next = Math.floor(Math.random() * poolLength);
        return next === i ? (i + 1) % poolLength : next;
      });
      setPosterRotationCount((c) => c + 1);
    }, duration);
    return () => clearTimeout(t);
  }, [mode, currentMedia?.id, mediaShowcase.enabled, mediaShowcase.posterDisplaySeconds, mediaPool.length]);

  // After N poster rotations (media-showcase cycles), switch to Ads or Now Showing.
  useEffect(() => {
    if (mode !== 'media-showcase') return;
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
    const totalAdTime = adsList.length * adsSettings.adDisplaySeconds * 1000;
    const t = setTimeout(() => {
      setMode('media-showcase');
    }, Math.max(totalAdTime, adsSettings.adDisplaySeconds * 1000));
    return () => clearTimeout(t);
  }, [mode, adsList.length, adsSettings.adDisplaySeconds]);

  // Full duration (ms) for Metapills, ProgressSlide – always run fully every time. TickerSlide is static (not in rotation).
  const FULL_SLIDE_DURATION_MS = 30000;

  // After now showing, go to Metapills for full duration.
  useEffect(() => {
    if (mode !== 'now-showing') return;
    const t = setTimeout(() => setMode('metapills'), FULL_SLIDE_DURATION_MS);
    return () => clearTimeout(t);
  }, [mode]);

  // After Metapills, show ProgressSlide for full duration.
  useEffect(() => {
    if (mode !== 'metapills') return;
    const t = setTimeout(() => setMode('progressslide'), FULL_SLIDE_DURATION_MS);
    return () => clearTimeout(t);
  }, [mode]);

  // After ProgressSlide, return to media showcase.
  useEffect(() => {
    if (mode !== 'progressslide') return;
    const t = setTimeout(() => setMode('media-showcase'), FULL_SLIDE_DURATION_MS);
    return () => clearTimeout(t);
  }, [mode]);

  return {
    mode,
    currentMedia,
    nextMedia,
    nowShowingEntries,
    adsList,
    adsDurationSeconds: adsSettings.adDisplaySeconds,
    showFallback: mode === 'media-showcase' && !currentMedia && mediaPool.length === 0,
    /** Playback progress 0..1 (e.g. from Jellyfin now-playing; 0 when not available). */
    playingProgress: 0,
  };
}
