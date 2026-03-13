/**
 * Display layout – wrapper for all display-mode pages (Media Showcase, Now Showing, Ads)
 *
 * Design rule: display pages must NOT show a settings button. Instead, clicking
 * anywhere on the display opens settings. This keeps the signage view clean while
 * still allowing quick access to configuration. We use a single invisible
 * click layer that navigates to /settings/general.
 */

import { useNavigate } from 'react-router-dom';

interface DisplayLayoutProps {
  children: React.ReactNode;
}

export function DisplayLayout({ children }: DisplayLayoutProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/settings/general');
  };

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
    >
      {children}
    </div>
  );
}
