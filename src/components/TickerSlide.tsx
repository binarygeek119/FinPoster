/**
 * TickerSlide – single bar: media server logo | scrolling ticker | current time (pill)
 *
 * Layout: logo (Jellyfin / Plex / Emby), then ticker bar, then time in a pill.
 * All the same height. Used as a display mode in the rotation.
 */

import { useEffect, useRef, useState } from 'react';
import { useSettings } from '../store/settingsStore';
import { getDisplayFontFamily } from '../constants/displayFonts';
import { getEffectiveDisplayColors } from '../utils/displayColors';
import './TickerSlide.css';

export interface TickerSlideProps {
  /** Optional ticker text (default: welcome message). */
  tickerText?: string;
  /** Ticker scroll speed in px per second (default from Media Showcase or 40). */
  tickerSpeedPxPerSec?: number;
  /** Optional text color for scrolling ticker (e.g. from Media Showcase customize). */
  tickerColor?: string;
  /** Optional text/border color for time pill (e.g. from Media Showcase customize). */
  timePillColor?: string;
  /** Optional font-family for ticker and time pill (e.g. from Media Showcase display font). */
  tickerFontFamily?: string;
}

function getConnectedServer(settings: { jellyfin: { enabled?: boolean; serverUrl?: string }; plex: { enabled?: boolean; serverUrl?: string }; emby: { enabled?: boolean; serverUrl?: string } }): 'jellyfin' | 'plex' | 'emby' | null {
  if (settings.jellyfin?.enabled && settings.jellyfin?.serverUrl) return 'jellyfin';
  if (settings.plex?.enabled && settings.plex?.serverUrl) return 'plex';
  if (settings.emby?.enabled && settings.emby?.serverUrl) return 'emby';
  return null;
}

function formatTime(date: Date): string {
  const h = date.getHours();
  const m = date.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

export function TickerSlide({ tickerText = 'FinPoster • Digital Signage', tickerSpeedPxPerSec, tickerColor, timePillColor, tickerFontFamily }: TickerSlideProps) {
  const { settings } = useSettings();
  const [time, setTime] = useState(() => formatTime(new Date()));
  const tickerRef = useRef<HTMLDivElement>(null);
  const [tickerDurationSec, setTickerDurationSec] = useState(30);
  const [plexLogoFailed, setPlexLogoFailed] = useState(false);
  const [embyLogoFailed, setEmbyLogoFailed] = useState(false);

  const server = getConnectedServer(settings);
  const speed = tickerSpeedPxPerSec ?? settings.mediaShowcase?.tickerScrollSpeedPxPerSec ?? 40;
  const font = tickerFontFamily ?? (settings.mediaShowcase?.displayFont ? getDisplayFontFamily(settings.mediaShowcase.displayFont) : undefined) ?? '';
  const effectiveColors = getEffectiveDisplayColors(settings.mediaShowcase);
  const tickerCol = tickerColor ?? effectiveColors.tickerColor;
  const pillCol = timePillColor ?? effectiveColors.timePillColor;
  const barStyle: React.CSSProperties = {
    ...(tickerCol ? { ['--ticker-bar-color' as string]: tickerCol } : {}),
    ...(pillCol ? { ['--ticker-time-pill-color' as string]: pillCol } : {}),
    ...(font ? { ['--ticker-bar-font' as string]: font } : {}),
  };
  const textStyle: React.CSSProperties = font ? { fontFamily: font } : {};

  useEffect(() => {
    const t = setInterval(() => setTime(formatTime(new Date())), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const el = tickerRef.current;
    if (!el || !speed) return;
    const width = el.scrollWidth;
    if (width) setTickerDurationSec(Math.max(10, width / speed));
  }, [tickerText, speed]);

  return (
    <div className="tickerslide">
      <div className="tickerslide-bar glass-panel" style={barStyle}>
        <div className="tickerslide-logo-wrap">
          {server === 'jellyfin' && (
            <img src="/logos/jellyfin.png" alt="Jellyfin" className="tickerslide-logo-img" />
          )}
          {server === 'plex' && !plexLogoFailed && (
            <img src="/logos/plex.png" alt="Plex" className="tickerslide-logo-img" onError={() => setPlexLogoFailed(true)} />
          )}
          {server === 'plex' && plexLogoFailed && <span className="tickerslide-logo-fallback tickerslide-logo-fallback-visible">Plex</span>}
          {server === 'emby' && !embyLogoFailed && (
            <img src="/logos/emby.png" alt="Emby" className="tickerslide-logo-img" onError={() => setEmbyLogoFailed(true)} />
          )}
          {server === 'emby' && embyLogoFailed && <span className="tickerslide-logo-fallback tickerslide-logo-fallback-visible">Emby</span>}
          {!server && <span className="tickerslide-logo-fallback tickerslide-logo-fallback-visible">Media</span>}
        </div>
        <div
          className="tickerslide-ticker"
          style={{ ['--ticker-duration' as string]: `${tickerDurationSec}s` } as React.CSSProperties}
        >
          <div ref={tickerRef} className="tickerslide-ticker-inner" style={textStyle}>
            {tickerText}
          </div>
        </div>
        <div className="tickerslide-time-pill" style={textStyle}>
          {time}
        </div>
      </div>
    </div>
  );
}
