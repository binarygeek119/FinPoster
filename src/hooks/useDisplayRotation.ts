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
import { useSettings } from '../store/settingsStore';
import { getJellyfinLibraryItems } from '../services/jellyfin';
import { enrichFromTmdb } from '../services/metadataFallback';

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

/** Build now showing entries from settings (manual IDs or random from library). */
async function buildNowShowingEntries(
  jellyfinUrl: string,
  jellyfinKey: string,
  libraryIds: string[],
  _manualTmdbIds: string[],
  _manualTvdbIds: string[],
  theaterCount: number,
  sourceMode: 'manual' | 'random',
  userId?: string
): Promise<NowShowingEntry[]> {
  const entries: NowShowingEntry[] = [];
  const usedIds = new Set<string>();

  // Placeholder: for manual IDs we would need TMDb/TheTVDB to get poster/title.
  // For now we only support random from Jellyfin.
  if (sourceMode === 'random' && jellyfinUrl && jellyfinKey && libraryIds.length) {
    for (const libId of libraryIds) {
      const items = await getJellyfinLibraryItems(
        jellyfinUrl,
        jellyfinKey,
        libId,
        ['Movie', 'Series'],
        theaterCount * 2,
        userId
      );
      for (const item of items) {
        if (entries.length >= theaterCount) break;
        if (usedIds.has(item.id)) continue;
        usedIds.add(item.id);
        const hour = 18 + (entries.length % 4);
        const min = entries.length % 2 === 0 ? 0 : 30;
        entries.push({
          id: item.id,
          media: item,
          showtime: `${hour}:${min.toString().padStart(2, '0')}`,
          tickerText: item.tagline || item.plot?.slice(0, 80),
        });
      }
      if (entries.length >= theaterCount) break;
    }
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

  // Load media pool from Jellyfin (and optionally enrich with TMDb).
  const loadMediaPool = useCallback(async () => {
    if (
      !mediaShowcase.enabled ||
      !jellyfin.enabled ||
      !jellyfin.serverUrl ||
      !jellyfin.apiKey ||
      !jellyfin.libraryIds.length
    ) {
      setMediaPool([]);
      return;
    }
    const all: MediaItem[] = [];
    for (const libId of jellyfin.libraryIds) {
      const items = await getJellyfinLibraryItems(
        jellyfin.serverUrl,
        jellyfin.apiKey,
        libId,
        jellyfin.enabledMediaTypes,
        50,
        jellyfin.playbackUserId
      );
      all.push(...items);
    }
    // Optional: try to enrich first few with TMDb if we have key
    if (settings.metadata.tmdbApiKey) {
      for (let i = 0; i < Math.min(5, all.length); i++) {
        const updated = await enrichFromTmdb(settings.metadata.tmdbApiKey, all[i]);
        if (updated) {
          all[i] = { ...all[i], ...updated };
        }
      }
    }
    setMediaPool(all);
    setCurrentIndex(0);
  }, [jellyfin.serverUrl, jellyfin.apiKey, jellyfin.libraryIds, jellyfin.enabledMediaTypes, jellyfin.playbackUserId, settings.metadata.tmdbApiKey]);

  useEffect(() => {
    loadMediaPool();
    const interval = setInterval(loadMediaPool, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadMediaPool]);

  // Build now showing list when we need it.
  useEffect(() => {
    if (mode !== 'now-showing') return;
    if (!nowShowingSettings.enabled || !jellyfin.enabled) {
      setNowShowingEntries([]);
      return;
    }
    buildNowShowingEntries(
      jellyfin.serverUrl,
      jellyfin.apiKey,
      jellyfin.libraryIds,
      nowShowingSettings.manualTmdbIds,
      nowShowingSettings.manualTvdbIds,
      nowShowingSettings.theaterCount,
      nowShowingSettings.sourceMode,
      jellyfin.playbackUserId
    ).then(setNowShowingEntries);
  }, [mode, jellyfin.serverUrl, jellyfin.apiKey, jellyfin.libraryIds, jellyfin.playbackUserId, nowShowingSettings.manualTmdbIds, nowShowingSettings.manualTvdbIds, nowShowingSettings.theaterCount, nowShowingSettings.sourceMode]);

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

  // After each poster duration, advance index and maybe switch mode.
  useEffect(() => {
    if (mode !== 'media-showcase') return;
    if (!mediaShowcase.enabled) return;
    if (!currentMedia) return;
    const duration = mediaShowcase.posterDisplaySeconds * 1000;
    const t = setTimeout(() => {
      setCurrentIndex((i) => i + 1);
      setPosterRotationCount((c) => c + 1);
    }, duration);
    return () => clearTimeout(t);
  }, [mode, currentMedia?.id, mediaShowcase.enabled, mediaShowcase.posterDisplaySeconds]);

  // After N poster rotations, switch to Ads (if enabled and have ads) or Now Showing.
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

  // After now showing, return to showcase (e.g. after 30 seconds).
  useEffect(() => {
    if (mode !== 'now-showing') return;
    const t = setTimeout(() => {
      setMode('media-showcase');
    }, 30000);
    return () => clearTimeout(t);
  }, [mode]);

  return {
    mode,
    currentMedia,
    nowShowingEntries,
    adsList,
    adsDurationSeconds: adsSettings.adDisplaySeconds,
    showFallback: mode === 'media-showcase' && !currentMedia && mediaPool.length === 0,
  };
}
