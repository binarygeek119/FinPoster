/**
 * ProgressSlide – start time, progress bar, end time for video/music playback.
 *
 * Only shows playback UI when the item has playback times and is video or music.
 * Otherwise renders nothing (caller can show fallback or skip this mode).
 */

import type { MediaItem } from '../types';
import './ProgressSlide.css';

export interface ProgressSlideProps {
  /** Currently playing item (with playbackStartTime, playbackEndTime). */
  item: MediaItem | null;
  /** Playback progress 0..1. */
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

export function ProgressSlide({ item, progress = 0 }: ProgressSlideProps) {
  if (!hasPlayback(item)) {
    return null;
  }

  const start = item!.playbackStartTime!;
  const end = item!.playbackEndTime!;

  return (
    <div className="progress-slide">
      <div className="progress-slide-bar glass-panel">
        <span className="progress-slide-time">{formatTime(start)}</span>
        <div className="progress-slide-track">
          <div
            className="progress-slide-fill"
            style={{ width: `${Math.max(0, Math.min(1, progress)) * 100}%` }}
          />
        </div>
        <span className="progress-slide-time">{formatTime(end)}</span>
      </div>
    </div>
  );
}
