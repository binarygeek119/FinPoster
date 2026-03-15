/**
 * Ticker bar text: plot for movie/TV (show + episode plot for series), cast when present, album info for music.
 */

import type { MediaItem } from '../types';

function formatCast(item: MediaItem): string {
  const cast = item.cast?.filter((c) => c?.name?.trim()).map((c) => c.name!.trim()) ?? [];
  if (cast.length === 0) return '';
  return `Cast: ${cast.slice(0, 8).join(', ')}${cast.length > 8 ? '…' : ''}`;
}

export function getTickerText(item: MediaItem | null | undefined): string {
  if (!item) return '';
  const t = item.type;
  if (t === 'Music') {
    const parts = [item.artist, item.album ?? item.title].filter(Boolean);
    return parts.join('  •  ') || item.title || '';
  }
  if (t === 'Movie' || t === 'Series') {
    const parts: string[] = [];
    const showPlot = item.plot?.trim();
    const epPlot = item.episodePlot?.trim();
    if (showPlot && epPlot) parts.push(`${showPlot}  •  ${epPlot}`);
    else if (showPlot) parts.push(showPlot);
    const castStr = formatCast(item);
    if (castStr) parts.push(castStr);
    return parts.join('  •  ') || item.title || '';
  }
  if (t === 'Book') return item.plot?.trim() || [item.author, item.title].filter(Boolean).join('  •  ') || item.title || '';
  return item.plot?.trim() || item.title || '';
}
