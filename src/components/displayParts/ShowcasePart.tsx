/**
 * ShowcasePart – poster + logo/title + texture overlay. Shared by Media Showcase and Playback display.
 * Manages poster load state so new poster only appears after load.
 */

import { useEffect, useRef, useState } from 'react';
import type { MediaItem, PosterTransitionId } from '../../types';
import { resolveAssetUrl } from '../../services/jellyfin';
import type { DefaultTexture } from '../../constants/defaultTextures';
import type { EffectiveDisplayColors } from '../../utils/displayColors';

export interface ShowcasePartProps {
  item: MediaItem | null;
  /** e.g. "media-showcase-showcase" or "playback-showcase" */
  className: string;
  /** No-logo modifier when not showing logo (e.g. "media-showcase-showcase--no-logo") */
  noLogoClassName?: string;
  showMediaLogo: boolean;
  colors: EffectiveDisplayColors;
  posterTexture: DefaultTexture | null;
  posterTextureStrength: number;
  currentTransition: PosterTransitionId;
  posterDisplaySeconds: number;
  titleFontFamily?: string;
  titleColor?: string;
}

export function ShowcasePart({
  item,
  className,
  noLogoClassName = 'media-showcase-showcase--no-logo',
  showMediaLogo,
  colors,
  posterTexture,
  posterTextureStrength,
  currentTransition,
  posterDisplaySeconds,
  titleFontFamily,
  titleColor,
}: ShowcasePartProps) {
  const [displayedPosterUrl, setDisplayedPosterUrl] = useState<string | null>(null);
  const posterUrlRef = useRef<string | null>(null);

  const posterUrl = item ? resolveAssetUrl(item.posterUrl) : null;
  const logoUrl = item ? resolveAssetUrl(item.logoUrl) : null;
  const showLogoBelow = showMediaLogo && !!logoUrl;
  posterUrlRef.current = posterUrl ?? null;

  useEffect(() => {
    if (!posterUrl) setDisplayedPosterUrl(null);
  }, [posterUrl]);

  const handlePosterLoad = () => {
    if (posterUrlRef.current === posterUrl) setDisplayedPosterUrl(posterUrl ?? null);
  };

  if (!item) return null;

  const showcaseClassName = `${className} glass-panel${showMediaLogo ? '' : ` ${noLogoClassName}`}`;

  return (
    <div
      className={showcaseClassName}
      style={{ ['--poster-border-color' as string]: colors.borderColor }}
    >
      <div
        className={`media-showcase-poster media-showcase-poster--${currentTransition}`}
        style={{ ['--show-duration' as string]: `${posterDisplaySeconds}s` }}
      >
        {posterUrl ? (
          <>
            {displayedPosterUrl ? (
              <img
                key={displayedPosterUrl}
                src={displayedPosterUrl}
                alt=""
                className="media-showcase-poster-img"
                width={360}
                height={540}
              />
            ) : (
              <div className="media-showcase-poster-placeholder">
                <span>{item.title}</span>
              </div>
            )}
            {posterUrl !== displayedPosterUrl && (
              <img
                src={posterUrl}
                alt=""
                aria-hidden
                onLoad={handlePosterLoad}
                style={{
                  position: 'absolute',
                  width: 0,
                  height: 0,
                  opacity: 0,
                  pointerEvents: 'none',
                }}
              />
            )}
          </>
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
      {posterTexture && posterTextureStrength > 0 && (
        <div
          className="media-showcase-showcase-texture"
          style={{
            backgroundImage: `url(${posterTexture.url})`,
            opacity: posterTextureStrength,
          }}
        />
      )}
    </div>
  );
}
