/**
 * Media Showcase – main display mode: full-screen posters with metadata ticker
 *
 * Replaces the old "Random Poster" page. Shows one media item at a time with
 * backdrop, center poster, Jellyfin logo bottom-left, and scrolling ticker.
 * When playback is active we show start/end time and a live-updating progress bar.
 * Poster display duration and ticker speed come from Media Showcase settings.
 */

import { useEffect, useRef, useState } from 'react';
import type { MediaItem } from '../types';
import { useSettings } from '../store/settingsStore';
import './MediaShowcase.css';

interface MediaShowcaseProps {
  /** Current item to show; if null, parent should switch to fallback or next mode. */
  item: MediaItem | null;
  /** Whether this item is currently "playing" (show overlay). */
  isPlaying?: boolean;
  /** Progress 0..1 for the bar. */
  progress?: number;
}

export function MediaShowcase({ item, isPlaying, progress = 0 }: MediaShowcaseProps) {
  const { settings } = useSettings();
  const opts = settings.mediaShowcase;
  const [tickerKey, setTickerKey] = useState(0);
  const tickerRef = useRef<HTMLDivElement>(null);
  const [tickerDurationSec, setTickerDurationSec] = useState(30);

  // Build ticker text from available metadata (scrolls right-to-left).
  const tickerParts: string[] = [];
  if (item?.title) tickerParts.push(item.title);
  if (item?.type) tickerParts.push(item.type);
  if (item?.rating) tickerParts.push(`Rating: ${item.rating}`);
  if (opts.showTagline && item?.tagline) tickerParts.push(item.tagline);
  if (item?.plot) tickerParts.push(item.plot);
  if (item?.year) tickerParts.push(String(item.year));
  if (item?.studio) tickerParts.push(item.studio);
  if (item?.network) tickerParts.push(item.network);
  if (item?.publisher) tickerParts.push(item.publisher);
  if (item?.artist) tickerParts.push(item.artist);
  if (item?.author) tickerParts.push(item.author);
  const tickerText = tickerParts.filter(Boolean).join('  •  ');

  // When item changes, reset ticker animation.
  useEffect(() => {
    setTickerKey((k) => k + 1);
  }, [item?.id]);

  // Compute ticker animation duration from content width and speed (px/s) so scroll speed is correct.
  useEffect(() => {
    const el = tickerRef.current;
    if (!el || !opts.tickerScrollSpeedPxPerSec) return;
    const width = el.scrollWidth;
    if (width) setTickerDurationSec(Math.max(10, width / opts.tickerScrollSpeedPxPerSec));
  }, [tickerText, opts.tickerScrollSpeedPxPerSec, tickerKey]);

  if (!item) {
    return null;
  }

  const backdropUrl = item.backdropUrl || '';
  const posterUrl = item.posterUrl || '';

  return (
    <div className="media-showcase">
      {/* Full-screen backdrop */}
      <div
        className="media-showcase-backdrop"
        style={{
          backgroundImage: backdropUrl ? `url(${backdropUrl})` : undefined,
        }}
      />
      <div className="media-showcase-overlay" />

      {/* Center poster */}
      <div className="media-showcase-poster-wrap">
        <div
          className="media-showcase-poster glass-panel"
          style={{ ['--show-duration' as string]: `${opts.posterDisplaySeconds}s` }}
        >
          {posterUrl ? (
            <img src={posterUrl} alt="" className="media-showcase-poster-img" />
          ) : (
            <div className="media-showcase-poster-placeholder">
              <span>{item.title}</span>
            </div>
          )}
        </div>
      </div>

      {/* Jellyfin logo bottom-left */}
      <div className="media-showcase-jellyfin-logo" aria-hidden>
        Jellyfin
      </div>

      {/* Playback overlay: start time, progress bar, end time */}
      {isPlaying && (
        <div className="media-showcase-playback glass-panel">
          <span className="media-showcase-time">
            {item.playbackStartTime != null
              ? formatTime(item.playbackStartTime)
              : '--:--'}
          </span>
          <div className="media-showcase-progress-wrap">
            <div
              className="media-showcase-progress-fill"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <span className="media-showcase-time">
            {item.playbackEndTime != null
              ? formatTime(item.playbackEndTime)
              : '--:--'}
          </span>
        </div>
      )}

      {/* Scrolling ticker at bottom; duration in seconds so scroll speed (px/s) is correct */}
      <div
        className="media-showcase-ticker glass-panel"
        style={{
          ['--ticker-duration' as string]: `${tickerDurationSec}s`,
          color: opts.tickerColor || undefined,
        }}
      >
        <div ref={tickerRef} key={tickerKey} className="media-showcase-ticker-inner">
          {tickerText || item.title}
        </div>
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
