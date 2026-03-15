/**
 * Media Showcase – main display mode: full-screen posters with metadata ticker
 *
 * Shows one media item at a time with backdrop, cinema title, center poster,
 * metapills, and ticker. Playback (progress bar) is shown only on the separate
 * Playback display when rotation switches to progressslide.
 */

import { useEffect, useMemo } from 'react';
import type { MediaItem, PosterTransitionId } from '../types';
import { getTickerText } from '../utils/tickerText';
import { getDisplayFontFamily } from '../constants/displayFonts';
import { useSettings } from '../store/settingsStore';
import { DEFAULT_TEXTURES } from '../constants/defaultTextures';
import { resolveAssetUrl } from '../services/jellyfin';
import { getEffectiveDisplayColors } from '../utils/displayColors';
import { useViewportBackdrop } from '../context/DisplayViewportBackdrop';
import { CinemaPart, ShowcasePart, MetapillsPart, TickerPart } from './displayParts';
import './MediaShowcase.css';
import mainBackground from '../assets/background/mainbackground.png';

interface MediaShowcaseProps {
  /** Current item to show; if null, parent should switch to fallback or next mode. */
  item: MediaItem | null;
  /** Unused – playback is shown on the separate Playback display only. */
  isPlaying?: boolean;
  /** Unused – playback is shown on the separate Playback display only. */
  progress?: number;
}

export function MediaShowcase({ item }: MediaShowcaseProps) {
  const { settings } = useSettings();
  const opts = settings.mediaShowcase;

  const currentTransition = useMemo((): PosterTransitionId => {
    const list = opts.enabledTransitions ?? ['fade'];
    if (!item?.id || list.length === 0) return 'fade';
    return list[Math.floor(Math.random() * list.length)];
  }, [item?.id, opts.enabledTransitions]);

  const tickerText = getTickerText(item) || item?.title || '';
  const backdropUrl = item ? resolveAssetUrl(item.backdropUrl) || mainBackground || '' : '';
  const blurPx = opts.backdropBlurPx ?? 18;

  const { setViewportBackdrop } = useViewportBackdrop();
  useEffect(() => {
    setViewportBackdrop(backdropUrl || null, blurPx, true);
    return () => setViewportBackdrop(null, 0, false);
  }, [backdropUrl, blurPx, setViewportBackdrop]);

  if (!item) return null;

  const displayTitle = (settings.ui?.homeCinemaTitle?.trim() || 'Home Cinema') || '';
  const showMediaLogo = opts.showMediaLogo !== false;
  const titleFontFamily = getDisplayFontFamily(
    opts.homeCinemaFont && opts.homeCinemaFont !== 'default' ? opts.homeCinemaFont : opts.displayFont
  );
  const colors = useMemo(() => getEffectiveDisplayColors(opts), [opts]);
  const titleColor = colors.homeCinemaTitleColor;

  const ui = settings.ui;
  const textureList = useMemo(
    () => [...DEFAULT_TEXTURES, ...settings.uploads.filter((u) => u.category === 'textures')],
    [settings.uploads]
  );
  const posterTexture = useMemo(() => {
    const id = ui.activeTextureId;
    if (!id) return null;
    if (id === 'random') {
      if (textureList.length === 0) return null;
      return textureList[Math.floor(Math.random() * textureList.length)];
    }
    return textureList.find((u) => u.id === id) ?? null;
  }, [ui.activeTextureId, textureList]);
  const posterTextureStrength = Math.max(0, Math.min(100, ui.textureStrength ?? 100)) / 100;

  return (
    <div className="media-showcase">
      <div className="media-showcase-overlay" />
      <div className="media-showcase-main">
        <CinemaPart
          className="media-showcase-cinema"
          displayTitle={displayTitle}
          fontFamily={titleFontFamily}
          color={titleColor}
          titleClassName="media-showcase-title"
        />
        <div className="media-showcase-main-content">
          <ShowcasePart
            className="media-showcase-showcase"
            noLogoClassName="media-showcase-showcase--no-logo"
            item={item}
            showMediaLogo={showMediaLogo}
            colors={colors}
            posterTexture={posterTexture}
            posterTextureStrength={posterTextureStrength}
            currentTransition={currentTransition}
            posterDisplaySeconds={opts.posterDisplaySeconds ?? 10}
            titleFontFamily={titleFontFamily}
            titleColor={titleColor}
          />
          <MetapillsPart
            className="media-showcase-metapills-wrap"
            item={item}
            pillColors={colors.metapillsColors}
          />
        </div>
        <TickerPart
          className="media-showcase-tickerslide-wrap"
          tickerText={tickerText}
          tickerSpeedPxPerSec={opts.tickerScrollSpeedPxPerSec}
          tickerColor={colors.tickerColor}
          timePillColor={colors.timePillColor}
          tickerFontFamily={getDisplayFontFamily(opts?.displayFont)}
        />
      </div>
    </div>
  );
}
