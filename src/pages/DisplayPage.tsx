/**
 * Display page – single route that shows the rotating signage display
 *
 * Uses DisplayLayout (click anywhere -> settings) and useDisplayRotation to
 * decide which mode to show: Media Showcase, Now Showing, Ads, or Fallback.
 * No settings button is visible; the whole viewport is clickable to open settings.
 */

import { DisplayLayout } from '../components/DisplayLayout';
import { MediaShowcase } from '../components/MediaShowcase';
import { NowShowing } from '../components/NowShowing';
import { AdsDisplay } from '../components/AdsDisplay';
import { FallbackDisplay } from '../components/FallbackDisplay';
import { useDisplayRotation } from '../hooks/useDisplayRotation';

export function DisplayPage() {
  const {
    mode,
    currentMedia,
    nowShowingEntries,
    adsList,
    adsDurationSeconds,
    showFallback,
  } = useDisplayRotation();

  return (
    <DisplayLayout>
      {showFallback && <FallbackDisplay />}
      {!showFallback && mode === 'media-showcase' && (
        <MediaShowcase item={currentMedia} isPlaying={false} progress={0} />
      )}
      {!showFallback && mode === 'now-showing' && nowShowingEntries.length > 0 && (
        <NowShowing entries={nowShowingEntries} />
      )}
      {!showFallback && mode === 'now-showing' && nowShowingEntries.length === 0 && (
        <FallbackDisplay />
      )}
      {!showFallback && mode === 'ads' && adsList.length > 0 && (
        <AdsDisplay ads={adsList} durationSeconds={adsDurationSeconds} />
      )}
      {/* If mode is ads but no ads, show fallback for that duration (or skip – we already skip in hook by not setting mode to ads). */}
    </DisplayLayout>
  );
}
