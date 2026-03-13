/**
 * Display page – single route that shows the rotating signage display
 *
 * Uses DisplayLayout (click anywhere -> settings) and useDisplayRotation to
 * decide which mode to show: Media Showcase, Now Showing, Ads, or Fallback.
 * No settings button is visible; the whole viewport is clickable to open settings.
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { DisplayViewportBackdropProvider } from '../context/DisplayViewportBackdrop';
import { DisplayLayout } from '../components/DisplayLayout';
import { MediaShowcase } from '../components/MediaShowcase';
import { NowShowing } from '../components/NowShowing';
import { AdsDisplay } from '../components/AdsDisplay';
import { FallbackDisplay } from '../components/FallbackDisplay';
import { Metapills } from '../components/Metapills';
import { hasPlayback } from '../components/ProgressSlide';
import { PlaybackDisplay } from '../components/PlaybackDisplay';
import { useDisplayRotation } from '../hooks/useDisplayRotation';
import { useSettings } from '../store/settingsStore';
import { resolveAssetUrl } from '../services/jellyfin';
import { getEffectiveDisplayColors } from '../utils/displayColors';

function preloadImage(url: string) {
  if (!url) return;
  const img = new Image();
  img.src = url;
}

export function DisplayPage() {
  const location = useLocation();
  const { settings } = useSettings();
  const search = new URLSearchParams(location.search);
  const modeParam = search.get('mode');
  const initialMode =
    modeParam === 'ads'
      ? 'ads'
      : modeParam === 'now-showing'
        ? 'now-showing'
        : undefined;
  const {
    mode,
    currentMedia,
    nextMedia,
    upcomingMedia,
    nowShowingEntries,
    adsList,
    adsDurationSeconds,
    showFallback,
    playingProgress,
  } = useDisplayRotation(initialMode);
  // In progressslide mode, show playback UI: use item with playback times (real or synthetic).
  const playbackDisplayItem =
    mode === 'progressslide' && currentMedia
      ? hasPlayback(currentMedia)
        ? currentMedia
        : { ...currentMedia, playbackStartTime: 0, playbackEndTime: 7200 }
      : null;

  // Preload upcoming media posters/backdrops/logos so the next few slides are ready.
  useEffect(() => {
    const list = [nextMedia, ...(upcomingMedia ?? [])].filter(Boolean);
    if (!list.length) return;
    for (const item of list) {
      const poster = resolveAssetUrl(item!.posterUrl);
      const backdrop = resolveAssetUrl(item!.backdropUrl);
      const logo = resolveAssetUrl(item!.logoUrl);
      if (poster) preloadImage(poster);
      if (backdrop) preloadImage(backdrop);
      if (logo) preloadImage(logo);
    }
  }, [nextMedia?.id, upcomingMedia?.map((m) => m.id).join(',')]);

  // Never leave the display blank: when a mode has no content, show FallbackDisplay.
  const content =
    showFallback ? (
      <FallbackDisplay />
    ) : mode === 'media-showcase' && currentMedia ? (
      <MediaShowcase item={currentMedia} isPlaying={false} progress={0} />
    ) : mode === 'media-showcase' ? (
      <FallbackDisplay />
    ) : mode === 'now-showing' && nowShowingEntries.length > 0 ? (
      <NowShowing entries={nowShowingEntries} />
    ) : mode === 'now-showing' ? (
      <FallbackDisplay />
    ) : mode === 'ads' && adsList.length > 0 ? (
      <AdsDisplay ads={adsList} durationSeconds={adsDurationSeconds} />
    ) : mode === 'ads' ? (
      <FallbackDisplay />
    ) : mode === 'metapills' && currentMedia ? (
      <Metapills item={currentMedia} pillColors={getEffectiveDisplayColors(settings.mediaShowcase).metapillsColors} />
    ) : mode === 'metapills' ? (
      <FallbackDisplay />
    ) : mode === 'progressslide' && playbackDisplayItem ? (
      <PlaybackDisplay item={playbackDisplayItem} progress={playingProgress} />
    ) : mode === 'progressslide' ? (
      <FallbackDisplay />
    ) : (
      <FallbackDisplay />
    );

  return (
    <DisplayViewportBackdropProvider>
      <DisplayLayout>{content}</DisplayLayout>
    </DisplayViewportBackdropProvider>
  );
}
