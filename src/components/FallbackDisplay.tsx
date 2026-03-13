/**
 * Fallback display – safe default when no media or ads are available
 *
 * Per spec: if no media can be displayed (e.g. no Jellyfin connection, no items,
 * or ads disabled and no ads uploaded), we show this screen so the signage never
 * goes blank or broken. It shows a default poster area and optional message.
 *
 * The user requested that the hero image be used instead of FinPoster text,
 * so we render hero.png centered in a glass card with a small helper line.
 */

import './FallbackDisplay.css';
import hero from '../assets/hero.png';

export function FallbackDisplay() {
  return (
    <div className="fallback-display">
      <div className="fallback-poster glass-panel">
        <div className="fallback-poster-inner">
          <img
            src={hero}
            alt=""
            className="fallback-hero-img"
          />
          <p className="fallback-message">No media available. Click to open settings.</p>
        </div>
      </div>
    </div>
  );
}
