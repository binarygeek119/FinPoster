/**
 * MetapillsPart – metadata pills. Shared by Media Showcase and Playback display.
 */

import type { MediaItem } from '../../types';
import { Metapills } from '../Metapills';

export interface MetapillsPartProps {
  item: MediaItem | null;
  pillColors: Record<string, string>;
  /** Root wrapper class (e.g. "media-showcase-metapills-wrap" or "playback-metapills-wrap") */
  className: string;
}

export function MetapillsPart({ item, pillColors, className }: MetapillsPartProps) {
  if (!item) return null;
  return (
    <div className={className}>
      <Metapills item={item} pillColors={pillColors} />
    </div>
  );
}
