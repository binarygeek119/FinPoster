/**
 * HomeCinema – display mode with a large title above the poster.
 * Title scales to fit the full width so the whole title is always visible.
 */

import { useEffect, useRef, useState } from 'react';
import type { MediaItem } from '../types';
import { useSettings } from '../store/settingsStore';
import { getDisplayFontFamily } from '../constants/displayFonts';
import { resolveAssetUrl } from '../services/jellyfin';
import { getEffectiveDisplayColors } from '../utils/displayColors';
import mainBackground from '../assets/mainbackground.png';
import './HomeCinema.css';

interface HomeCinemaProps {
  /** Current item to show; if null, parent should switch to fallback or next mode. */
  item: MediaItem | null;
}

export function HomeCinema({ item }: HomeCinemaProps) {
  const { settings } = useSettings();
  const opts = settings.mediaShowcase;
  const showMediaLogoSetting = opts?.showMediaLogo !== false;
  const titleRef = useRef<HTMLDivElement>(null);
  const titleWrapRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLSpanElement>(null);
  const subtitleWrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [subtitleScale, setSubtitleScale] = useState(1);

  // Scale top title down so it fits the container width.
  useEffect(() => {
    const wrap = titleWrapRef.current;
    const title = titleRef.current;
    if (!wrap || !title || !item?.title) {
      setScale(1);
      return;
    }
    const updateScale = () => {
      const wrapWidth = wrap.clientWidth;
      const scrollWidth = title.scrollWidth;
      if (wrapWidth > 0 && scrollWidth > wrapWidth) {
        setScale(wrapWidth / scrollWidth);
      } else {
        setScale(1);
      }
    };
    updateScale();
    const ro = new ResizeObserver(updateScale);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [item?.title]);

  // Preload media logo when enabled so it appears without delay in HomeCinema.
  useEffect(() => {
    if (!item?.logoUrl || !showMediaLogoSetting) return;
    const url = resolveAssetUrl(item.logoUrl);
    if (!url) return;
    const img = new Image();
    img.src = url;
  }, [item?.logoUrl, item?.id, showMediaLogoSetting]);

  // Scale media title (below poster) to fit when showing text instead of logo.
  useEffect(() => {
    const wrap = subtitleWrapRef.current;
    const sub = subtitleRef.current;
    if (!wrap || !sub || !item?.title) {
      setSubtitleScale(1);
      return;
    }
    const updateScale = () => {
      const wrapWidth = wrap.clientWidth;
      const scrollWidth = sub.scrollWidth;
      if (wrapWidth > 0 && scrollWidth > wrapWidth) {
        setSubtitleScale(wrapWidth / scrollWidth);
      } else {
        setSubtitleScale(1);
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
  const titleFontFamily = getDisplayFontFamily(opts.homeCinemaFont && opts.homeCinemaFont !== 'default' ? opts.homeCinemaFont : opts.displayFont);
  const colors = getEffectiveDisplayColors(opts);
  const titleColor = colors.homeCinemaTitleColor;
  const displayTitle = (settings.ui?.homeCinemaTitle?.trim() || 'Home Cinema') || '';
  const showMediaLogo = showMediaLogoSetting;
  const showLogoBelow = showMediaLogo && !!logoUrl;

  return (
    <div className="homecinema">
      <div
        className="homecinema-backdrop"
        style={{
          backgroundImage: backdropUrl ? `url(${backdropUrl})` : undefined,
          filter: blurPx > 0 ? `blur(${blurPx}px)` : 'none',
        }}
      />
      <div className="homecinema-overlay" />

      <div className="homecinema-content">
        <div ref={titleWrapRef} className="homecinema-title-wrap">
          <h1
            ref={titleRef}
            className="homecinema-title"
            style={{
              transform: `scale(${scale})`,
              ...(titleFontFamily ? { fontFamily: titleFontFamily } : {}),
              ...(titleColor ? { color: titleColor } : {}),
            }}
          >
            {displayTitle}
          </h1>
        </div>

        <div className="homecinema-poster-wrap">
          <div
            className={`homecinema-poster-block glass-panel${showMediaLogo ? '' : ' homecinema-poster-block--no-media-label'}`}
            style={{
              ['--poster-border-color' as string]: colors.borderColor,
            }}
          >
            <div className="homecinema-poster">
              {posterUrl ? (
                <img src={posterUrl} alt="" className="homecinema-poster-img" />
              ) : (
                <div className="homecinema-poster-placeholder">
                  <span>{item.title}</span>
                </div>
              )}
            </div>
            {showMediaLogo && (
              <div ref={subtitleWrapRef} className="homecinema-media-label-wrap">
                {showLogoBelow ? (
                  <img
                    src={logoUrl!}
                    alt=""
                    className="homecinema-media-logo"
                  />
                ) : (
                  <span
                    ref={subtitleRef}
                    className="homecinema-media-title"
                    style={{
                      transform: `scale(${subtitleScale})`,
                      ...(titleFontFamily ? { fontFamily: titleFontFamily } : {}),
                      ...(titleColor ? { color: titleColor } : {}),
                    }}
                  >
                    {item.title}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
