/**
 * PlaybackDisplay – ProgressSlide at top (slides down from top), HomeCinema below (slides down and scales to fit).
 * Used when playback is active so the progress bar is at the top and the poster view shrinks to fit.
 */

import { ProgressSlide } from './ProgressSlide';
import { HomeCinema } from './HomeCinema';
import type { MediaItem } from '../types';
import './PlaybackDisplay.css';

export interface PlaybackDisplayProps {
  item: MediaItem | null;
  progress?: number;
}

export function PlaybackDisplay({ item, progress = 0 }: PlaybackDisplayProps) {
  return (
    <div className="playback-display">
      <div className="playback-display-progress-wrap">
        <ProgressSlide item={item} progress={progress} />
      </div>
      <div className="playback-display-content-wrap">
        <div className="playback-display-content-inner">
          <HomeCinema item={item} />
        </div>
      </div>
    </div>
  );
}
