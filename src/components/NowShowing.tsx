/**
 * Now Showing – theater showtime board display mode
 *
 * Replaces the old "Movie Showing" page. Shows a vertical scrolling list of
 * upcoming media with poster/banner, logo or title, and showtime. Layout is
 * portrait-style; list auto-scrolls and loops back to top. Background can
 * be derived from the first item in the list.
 */

import { useEffect, useRef, useState } from 'react';
import type { NowShowingEntry } from '../types';
import { resolveAssetUrl } from '../services/jellyfin';
import './NowShowing.css';

interface NowShowingProps {
  entries: NowShowingEntry[];
  /** If no entries, parent may show fallback. */
}

export function NowShowing({ entries }: NowShowingProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const [scrollIndex, setScrollIndex] = useState(0);

  // Auto-scroll: advance every few seconds and loop back to top.
  useEffect(() => {
    if (entries.length <= 1) return;
    const interval = setInterval(() => {
      setScrollIndex((i) => (i + 1) % entries.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [entries.length]);

  // Scroll the list so current index is in view
  useEffect(() => {
    const el = listRef.current;
    if (!el || entries.length === 0) return;
    const child = el.children[scrollIndex] as HTMLElement;
    if (child) {
      child.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [scrollIndex, entries.length]);

  if (entries.length === 0) {
    return null;
  }

  const firstBackdrop = entries[0]?.media?.backdropUrl;

  return (
    <div className="now-showing">
      <div
        className="now-showing-backdrop"
        style={{
          backgroundImage: firstBackdrop ? `url(${firstBackdrop})` : undefined,
        }}
      />
      <div className="now-showing-overlay" />
      <div className="now-showing-list" ref={listRef}>
        {entries.map((entry, i) => (
          <div
            key={entry.id}
            className="now-showing-entry glass-panel"
            data-index={i}
          >
            <div
              className="now-showing-poster"
              style={{
                backgroundImage: entry.media.posterUrl
                  ? `url(${resolveAssetUrl(entry.media.posterUrl)})`
                  : undefined,
              }}
            >
              {!entry.media.posterUrl && (
                <span className="now-showing-poster-placeholder">
                  {entry.media.title}
                </span>
              )}
            </div>
            <div className="now-showing-info">
              {entry.media.logoUrl ? (
                <img
                  src={resolveAssetUrl(entry.media.logoUrl)}
                  alt=""
                  className="now-showing-logo"
                />
              ) : (
                <h3 className="now-showing-title">{entry.media.title}</h3>
              )}
              <span className="now-showing-time">{entry.showtime}</span>
              {entry.tickerText && (
                <p className="now-showing-ticker">{entry.tickerText}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
