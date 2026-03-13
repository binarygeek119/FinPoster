/**
 * Display page – single route that shows the rotating signage display
 *
 * Uses DisplayLayout (click anywhere -> settings) and useDisplayRotation to
 * decide which mode to show: Media Showcase, Now Showing, Ads, or Fallback.
 * No settings button is visible; the whole viewport is clickable to open settings.
 */

import { useEffect } from 'react';
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
  const { settings } = useSettings();
  const {
    mode,
    currentMedia,
    nextMedia,
    nowShowingEntries,
    adsList,
    adsDurationSeconds,
    showFallback,
    playingProgress,
  } = useDisplayRotation();
  const showProgressSlide = hasPlayback(currentMedia);

  // Preload next media item's poster, backdrop, and logo so the next slide is ready.
  useEffect(() => {
    if (!nextMedia) return;
    const poster = resolveAssetUrl(nextMedia.posterUrl);
    const backdrop = resolveAssetUrl(nextMedia.backdropUrl);
    const logo = resolveAssetUrl(nextMedia.logoUrl);
    if (poster) preloadImage(poster);
    if (backdrop) preloadImage(backdrop);
    if (logo) preloadImage(logo);
  }, [nextMedia?.id]);

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
    ) : mode === 'progressslide' && showProgressSlide ? (
      <PlaybackDisplay item={currentMedia} progress={playingProgress} />
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
