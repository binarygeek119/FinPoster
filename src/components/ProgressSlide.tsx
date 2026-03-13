/**
 * ProgressSlide – start time, progress bar, end time for video/music playback.
 *
 * Only shows playback UI when the item has playback times and is video or music.
 * Progress bar updates smoothly from the progress prop, or from elapsed time when start/end are set.
 */

import { useEffect, useState } from 'react';
import type { MediaItem } from '../types';
import { useSettings } from '../store/settingsStore';
import { getEffectiveDisplayColors } from '../utils/displayColors';
import './ProgressSlide.css';

export interface ProgressSlideProps {
  /** Currently playing item (with playbackStartTime, playbackEndTime). */
  item: MediaItem | null;
  /** Playback progress 0..1 (from Jellyfin or parent). When not provided or 0, derived from elapsed time. */
  progress?: number;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const PLAYBACK_TYPES = ['Movie', 'Series', 'Music'];

export function hasPlayback(item: MediaItem | null): boolean {
  if (!item) return false;
  if (!PLAYBACK_TYPES.includes(item.type)) return false;
  return (
    item.playbackStartTime != null &&
    item.playbackEndTime != null
  );
}

const TICK_MS = 250;

export function ProgressSlide({ item, progress: progressProp = 0 }: ProgressSlideProps) {
  const [timeBasedProgress, setTimeBasedProgress] = useState(0);
  const { settings } = useSettings();
  const colors = getEffectiveDisplayColors(settings.mediaShowcase);

  if (!hasPlayback(item)) {
    return null;
  }

  const start = item!.playbackStartTime!;
  const end = item!.playbackEndTime!;
  const duration = Math.max(1, end - start);

  // When no external progress is provided, derive from elapsed time so the bar moves smoothly.
  useEffect(() => {
    const tick = () => {
      const elapsed = Date.now() / 1000 - start;
      const p = Math.max(0, Math.min(1, elapsed / duration));
      setTimeBasedProgress(p);
    };
    tick();
    const id = setInterval(tick, TICK_MS);
    return () => clearInterval(id);
  }, [start, duration]);

  const progress = progressProp > 0 ? progressProp : timeBasedProgress;

  return (
    <div className="progress-slide">
      <div className="progress-slide-bar glass-panel">
        <span className="progress-slide-time" style={{ color: colors.playbackTimeColor }}>
          {formatTime(start)}
        </span>
        <div className="progress-slide-track">
          <div
            className="progress-slide-fill"
            style={{
              width: `${Math.max(0, Math.min(1, progress)) * 100}%`,
              backgroundColor: colors.progressBarColor,
            }}
          />
        </div>
        <span className="progress-slide-time" style={{ color: colors.playbackEndTimeColor }}>
          {formatTime(end)}
        </span>
      </div>
    </div>
  );
}
