/**
 * ProgressPart – playback progress bar (start time, bar, end time). Used only on Playback display.
 */

import type { MediaItem } from '../../types';
import { ProgressSlide } from '../ProgressSlide';

export interface ProgressPartProps {
  item: MediaItem | null;
  progress?: number;
  /** Root wrapper class (e.g. "playback-progressslide-wrap") */
  className: string;
}

export function ProgressPart({ item, progress = 0, className }: ProgressPartProps) {
  return (
    <div className={className}>
      <ProgressSlide item={item} progress={progress} />
    </div>
  );
}
