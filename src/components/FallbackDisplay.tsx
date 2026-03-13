/**
 * Fallback display – safe default when no media or ads are available
 *
 * Per spec: if no media can be displayed (e.g. no Jellyfin connection, no items,
 * or ads disabled and no ads uploaded), we show this screen so the signage never
 * goes blank or broken. It shows a default poster area and optional message.
 */

import './FallbackDisplay.css';

export function FallbackDisplay() {
  return (
    <div className="fallback-display">
      <div className="fallback-poster glass-panel">
        <div className="fallback-poster-inner">
          <span className="fallback-logo" aria-hidden>FinPoster</span>
          <p className="fallback-message">No media available. Click to open settings.</p>
        </div>
      </div>
    </div>
  );
}
