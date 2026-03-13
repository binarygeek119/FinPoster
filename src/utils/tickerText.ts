/**
 * Ticker bar text: plot only for movie/TV (show + episode plot for series), album info for music.
 */

import type { MediaItem } from '../types';

export function getTickerText(item: MediaItem | null | undefined): string {
  if (!item) return '';
  const t = item.type;
  if (t === 'Music') {
    const parts = [item.artist, item.album ?? item.title].filter(Boolean);
    return parts.join('  •  ') || item.title || '';
  }
  if (t === 'Movie' || t === 'Series') {
    const showPlot = item.plot?.trim();
    const epPlot = item.episodePlot?.trim();
    if (showPlot && epPlot) return `${showPlot}  •  ${epPlot}`;
    return showPlot || item.title || '';
  }
  if (t === 'Book') return item.plot?.trim() || [item.author, item.title].filter(Boolean).join('  •  ') || item.title || '';
  return item.plot?.trim() || item.title || '';
}
