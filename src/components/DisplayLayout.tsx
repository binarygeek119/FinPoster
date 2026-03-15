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

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../store/settingsStore';
import { DEFAULT_TEXTURES } from '../constants/defaultTextures';
import { useViewportBackdrop } from '../context/DisplayViewportBackdrop';
import { useViewport } from '../hooks/useViewport';
import mainBackground from '../assets/background/mainbackground.png';

/** Design size = content column only; width fits between red-line boundaries, nothing past them. */
const DESIGN_WIDTH = 560;
const DESIGN_HEIGHT = 1100;

interface DisplayLayoutProps {
  children: React.ReactNode;
}

/** Scale so content fits the viewport (contain) – layout stays the same at any resolution, no cropping. */
function getScale(width: number, height: number): number {
  const w = width > 0 ? width : DESIGN_WIDTH;
  const h = height > 0 ? height : DESIGN_HEIGHT;
  return Math.min(w / DESIGN_WIDTH, h / DESIGN_HEIGHT);
}

export function DisplayLayout({ children }: DisplayLayoutProps) {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { width, height } = useViewport();
  const effectiveWidth = width > 0 ? width : DESIGN_WIDTH;
  const effectiveHeight = height > 0 ? height : DESIGN_HEIGHT;
  const scale = useMemo(
    () => getScale(effectiveWidth, effectiveHeight),
    [effectiveWidth, effectiveHeight],
  );

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
    const id = ui.activeBackgroundTextureId;
    if (!id) return null;
    if (id === 'random') {
      if (textureList.length === 0) return null;
      return textureList[Math.floor(Math.random() * textureList.length)];
    }
    return textureList.find((u) => u.id === id) ?? null;
  }, [ui.activeBackgroundTextureId, textureList]);
  const backgroundTextureStrength = Math.max(0, Math.min(100, ui.backgroundTextureStrength ?? 100)) / 100;
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
        ...(width > 0 && height > 0 ? {} : { minWidth: DESIGN_WIDTH, minHeight: DESIGN_HEIGHT }),
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--jellyfin-dark)',
      }}
    >
      {viewportBackdrop.backdropUrl && !viewportBackdrop.cropToContentFrame && (
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
      {backgroundTexture && backgroundTextureStrength > 0 && !viewportBackdrop.cropToContentFrame && (
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
          overflow: 'hidden',
        }}
      >
        {/* Main background: inside scaled container so it scales with content */}
        {mainBackground && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 0,
              backgroundImage: `url(${mainBackground}), linear-gradient(180deg, #1c1c1c 0%, #101010 100%)`,
              backgroundSize: 'cover, 100% 100%',
              backgroundPosition: 'center, 0 0',
              backgroundRepeat: 'no-repeat, no-repeat',
              backgroundColor: 'var(--jellyfin-dark)',
              pointerEvents: 'none',
            }}
          />
        )}
        {/* Item backdrop + texture cropped to content frame (when cropToContentFrame) */}
        {viewportBackdrop.cropToContentFrame && (
          <>
            {viewportBackdrop.backdropUrl && (
              <div
                style={{
                  position: 'absolute',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: DESIGN_WIDTH,
                  maxWidth: '75%',
                  top: 0,
                  bottom: 0,
                  zIndex: 0,
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
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: DESIGN_WIDTH,
                  maxWidth: '75%',
                  top: 0,
                  bottom: 0,
                  zIndex: 0,
                  backgroundImage: `url(${backgroundTexture.url})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  opacity: backgroundTextureStrength,
                  filter: 'grayscale(100%)',
                  pointerEvents: 'none',
                }}
              />
            )}
          </>
        )}
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
