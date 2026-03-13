/**
 * Display layout – wrapper for all display-mode pages (Media Showcase, Now Showing, Ads)
 *
 * Design rule: display pages must NOT show a settings button. Instead, clicking
 * anywhere on the display opens settings. This keeps the signage view clean while
 * still allowing quick access to configuration. We use a single invisible
 * click layer that navigates to /settings/general.
 *
 * General settings can optionally dim display pages and apply a global texture.
 * Settings pages remain bright; only the signage views are affected here.
 */

import { useNavigate } from 'react-router-dom';
import { useSettings } from '../store/settingsStore';
import mainBackground from '../assets/mainbackground.png';

interface DisplayLayoutProps {
  children: React.ReactNode;
}

export function DisplayLayout({ children }: DisplayLayoutProps) {
  const navigate = useNavigate();
  const { settings } = useSettings();

  const handleClick = () => {
    navigate('/settings/general');
  };

  const ui = settings.ui;
  const activeTexture = settings.uploads.find(
    (u) => u.category === 'textures' && u.id === ui.activeTextureId,
  );

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
        backgroundImage: activeTexture
          ? `url(${activeTexture.url})`
          : mainBackground
          ? `url(${mainBackground})`
          : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative',
      }}
    >
      {/* Optional dim overlay: only affects display pages, not settings */}
      {ui.dimDisplays && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `rgba(0,0,0,${Math.min(
              1,
              Math.max(0, ui.dimStrength / 100),
            )})`,
            pointerEvents: 'none',
          }}
        />
      )}
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>{children}</div>
    </div>
  );
}
