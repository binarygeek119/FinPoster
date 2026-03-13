/**
 * Media Showcase – main display mode: full-screen posters with metadata ticker
 *
 * Replaces the old "Random Poster" page. Shows one media item at a time with
 * backdrop, center poster, Jellyfin logo bottom-left, and scrolling ticker.
 * When playback is active we show start/end time and a live-updating progress bar.
 * Poster display duration and ticker speed come from Media Showcase settings.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import type { MediaItem, PosterTransitionId } from '../types';
import { getTickerText } from '../utils/tickerText';
import { getDisplayFontFamily } from '../constants/displayFonts';
import { useSettings } from '../store/settingsStore';
import { DEFAULT_TEXTURES } from '../constants/defaultTextures';
import { resolveAssetUrl } from '../services/jellyfin';
import { getEffectiveDisplayColors } from '../utils/displayColors';
import { useViewportBackdrop } from '../context/DisplayViewportBackdrop';
import { TickerSlide } from './TickerSlide';
import { Metapills } from './Metapills';
import './MediaShowcase.css';
import mainBackground from '../assets/mainbackground.png';

interface MediaShowcaseProps {
  /** Current item to show; if null, parent should switch to fallback or next mode. */
  item: MediaItem | null;
  /** Whether this item is currently "playing" (show overlay). */
  isPlaying?: boolean;
  /** Progress 0..1 for the bar. */
  progress?: number;
}

export function MediaShowcase({ item, isPlaying, progress = 0 }: MediaShowcaseProps) {
  const { settings } = useSettings();
  const opts = settings.mediaShowcase;

  // Pick a random enabled transition when the poster item changes.
  const currentTransition = useMemo((): PosterTransitionId => {
    const list = opts.enabledTransitions ?? ['fade'];
    if (!item?.id || list.length === 0) return 'fade';
    return list[Math.floor(Math.random() * list.length)];
  }, [item?.id, opts.enabledTransitions]);

  // Ticker shows only: plot (movie/TV) or album info (music). Rendered via TickerSlide at bottom.
  const tickerText = getTickerText(item) || item?.title || '';
  const titleRef = useRef<HTMLHeadingElement>(null);
  const titleWrapRef = useRef<HTMLDivElement>(null);
  const [titleScale, setTitleScale] = useState(1);

  useEffect(() => {
    const wrap = titleWrapRef.current;
    const title = titleRef.current;
    if (!wrap || !title || !item?.title) {
      setTitleScale(1);
      return;
    }
    const updateScale = () => {
      const wrapWidth = wrap.clientWidth;
      const scrollWidth = title.scrollWidth;
      if (wrapWidth > 0 && scrollWidth > wrapWidth) {
        setTitleScale(wrapWidth / scrollWidth);
      } else {
        setTitleScale(1);
      }
    };
    updateScale();
    const ro = new ResizeObserver(updateScale);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [item?.title]);

  if (!item) {
    return null;
  }

  const backdropUrl = resolveAssetUrl(item.backdropUrl) || mainBackground || '';
  const posterUrl = resolveAssetUrl(item.posterUrl);
  const logoUrl = resolveAssetUrl(item.logoUrl);
  const blurPx = opts.backdropBlurPx ?? 18;
  const { setViewportBackdrop } = useViewportBackdrop();

  useEffect(() => {
    setViewportBackdrop(backdropUrl || null, blurPx);
    return () => setViewportBackdrop(null, 0);
  }, [backdropUrl, blurPx, setViewportBackdrop]);

  const displayTitle = (settings.ui?.homeCinemaTitle?.trim() || 'Home Cinema') || '';
  const showMediaLogo = opts.showMediaLogo !== false;
  const showLogoBelow = showMediaLogo && !!logoUrl;
  const titleFontFamily = getDisplayFontFamily(opts.homeCinemaFont && opts.homeCinemaFont !== 'default' ? opts.homeCinemaFont : opts.displayFont);
  const colors = useMemo(() => getEffectiveDisplayColors(opts), [opts]);
  const titleColor = colors.homeCinemaTitleColor;

  const ui = settings.ui;
  const textureList = useMemo(
    () => [
      ...DEFAULT_TEXTURES,
      ...settings.uploads.filter((u) => u.category === 'textures'),
    ],
    [settings.uploads],
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
      {/* Backdrop is rendered at viewport level by DisplayLayout (not scaled) */}
      <div className="media-showcase-overlay" />

      {/* Home Cinema title (static) */}
      <div ref={titleWrapRef} className="media-showcase-title-wrap">
        <h1
          ref={titleRef}
          className="media-showcase-title"
          style={{
            transform: `scale(${titleScale})`,
            ...(titleFontFamily ? { fontFamily: titleFontFamily } : {}),
            ...(titleColor ? { color: titleColor } : {}),
          }}
        >
          {displayTitle}
        </h1>
      </div>

      {/* Main content: poster (+ optional logo below) then Metapills */}
      <div className="media-showcase-main">
        <div className="media-showcase-poster-wrap">
          <div
            className={`media-showcase-poster-block glass-panel${showMediaLogo ? '' : ' media-showcase-poster-block--no-logo'}`}
            style={{
              ['--poster-border-color' as string]: colors.borderColor,
            }}
          >
            <div
              key={item.id}
              className={`media-showcase-poster media-showcase-poster--${currentTransition}`}
              style={{ ['--show-duration' as string]: `${opts.posterDisplaySeconds}s` }}
            >
              {posterUrl ? (
                <img src={posterUrl} alt="" className="media-showcase-poster-img" />
              ) : (
                <div className="media-showcase-poster-placeholder">
                  <span>{item.title}</span>
                </div>
              )}
            </div>
            {showMediaLogo && (
              <div className="media-showcase-media-label-wrap">
                {showLogoBelow ? (
                  <img src={logoUrl!} alt="" className="media-showcase-media-logo" />
                ) : (
                  <span
                    className="media-showcase-media-title"
                    style={{
                      ...(titleFontFamily ? { fontFamily: titleFontFamily } : {}),
                      ...(titleColor ? { color: titleColor } : {}),
                    }}
                  >
                    {item.title}
                  </span>
                )}
              </div>
            )}
            {/* Poster texture overlay: only over this poster block */}
            {posterTexture && posterTextureStrength > 0 && (
              <div
                className="media-showcase-poster-texture"
                style={{
                  backgroundImage: `url(${posterTexture.url})`,
                  opacity: posterTextureStrength,
                }}
              />
            )}
          </div>
        </div>
        {/* Metapills: rating, year, score, runtime – right below poster, above TickerSlide */}
        <div className="media-showcase-metapills-wrap">
          <Metapills item={item} pillColors={colors.metapillsColors} />
        </div>
      </div>

      {/* Playback overlay: start time, progress bar, end time */}
      {isPlaying && (
        <div className="media-showcase-playback glass-panel">
          <span className="media-showcase-time">
            {item.playbackStartTime != null
              ? formatTime(item.playbackStartTime)
              : '--:--'}
          </span>
          <div className="media-showcase-progress-wrap">
            <div
              className="media-showcase-progress-fill"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <span className="media-showcase-time">
            {item.playbackEndTime != null
              ? formatTime(item.playbackEndTime)
              : '--:--'}
          </span>
        </div>
      )}

      {/* TickerSlide at bottom: logo | scrolling ticker (plot/album info) | time pill */}
      <div className="media-showcase-tickerslide-wrap">
        <TickerSlide
          tickerText={tickerText}
          tickerSpeedPxPerSec={opts.tickerScrollSpeedPxPerSec}
          tickerColor={colors.tickerColor}
          timePillColor={colors.timePillColor}
          tickerFontFamily={getDisplayFontFamily(opts.displayFont)}
        />
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
