/**
 * Display layout – wrapper for all display-mode pages (Media Showcase, Now Showing, Ads)
 *
 * Design rule: display pages must NOT show a settings button. Instead, clicking
 * anywhere on the display opens settings. This keeps the signage view clean while
 * still allowing quick access to configuration. We use a single invisible
 * click layer that navigates to /settings/general.
 *
 * Content is laid out at a fixed design size (DESIGN_WIDTH x DESIGN_HEIGHT) and
 * scaled to fit the browser window so the layout stays the same at any window size.
 */

import { useMemo, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../store/settingsStore';
import { DEFAULT_TEXTURES } from '../constants/defaultTextures';
import { useViewportBackdrop } from '../context/DisplayViewportBackdrop';
import mainBackground from '../assets/mainbackground.png';

const DESIGN_WIDTH = 1920;
const DESIGN_HEIGHT = 1080;

interface DisplayLayoutProps {
  children: React.ReactNode;
}

/** Scale so poster fills the whole window (whole page = poster; may crop edges on narrow/tall windows). */
function getScaleCover(): number {
  if (typeof window === 'undefined') return 1;
  const w = window.innerWidth;
  const h = window.innerHeight;
  if (w <= 0 || h <= 0) return 1;
  return Math.max(w / DESIGN_WIDTH, h / DESIGN_HEIGHT);
}

export function DisplayLayout({ children }: DisplayLayoutProps) {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const [scale, setScale] = useState(getScaleCover);

  useEffect(() => {
    const onResize = () => setScale(getScaleCover());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleClick = () => {
    navigate('/settings/general');
  };

  const ui = settings.ui;
  const textureList = useMemo(
    () => [
      ...DEFAULT_TEXTURES,
      ...settings.uploads.filter((u) => u.category === 'textures'),
    ],
    [settings.uploads],
  );
  const backgroundTexture = useMemo(() => {
    const id = ui.activeTextureId;
    if (!id) return null;
    if (id === 'random') {
      if (textureList.length === 0) return null;
      return textureList[Math.floor(Math.random() * textureList.length)];
    }
    return textureList.find((u) => u.id === id) ?? null;
  }, [ui.activeTextureId, textureList]);
  const backgroundTextureStrength = Math.max(0, Math.min(100, ui.backgroundTextureStrength ?? ui.textureStrength ?? 100)) / 100;
  const { state: viewportBackdrop } = useViewportBackdrop();

  return (
    <div
      className="display-viewport"
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      aria-label="Click to open settings"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--jellyfin-dark)',
      }}
    >
      {/* Background/backdrop: fill viewport */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          backgroundImage: mainBackground ? `url(${mainBackground})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundColor: 'var(--jellyfin-dark)',
          pointerEvents: 'none',
        }}
      />
      {viewportBackdrop.backdropUrl && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 1,
            backgroundImage: `url(${viewportBackdrop.backdropUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            filter: viewportBackdrop.blurPx > 0 ? `blur(${viewportBackdrop.blurPx}px)` : 'none',
            pointerEvents: 'none',
          }}
        />
      )}
      {backgroundTexture && backgroundTextureStrength > 0 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 2,
            backgroundImage: `url(${backgroundTexture.url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: backgroundTextureStrength,
            filter: 'grayscale(100%)',
            pointerEvents: 'none',
          }}
        />
      )}
      {/* Poster content: scaled to cover whole page (same size as poster, fills window) */}
      <div
        className="display-scaled"
        style={{
          position: 'relative',
          zIndex: 3,
          width: DESIGN_WIDTH,
          height: DESIGN_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          flexShrink: 0,
          overflow: 'visible',
        }}
      >
        <div style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1 }}>
          {children}
        </div>
        {/* Dim overlay on top of content (capped so content stays visible) */}
        {ui.dimDisplays && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 10,
              background: `rgba(0,0,0,${Math.min(
                0.7,
                Math.max(0, ui.dimStrength / 100),
              )})`,
              pointerEvents: 'none',
            }}
          />
        )}
      </div>
    </div>
  );
}
