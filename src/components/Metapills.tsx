/**
 * Metapills – a single row of pills showing metadata; scales to fit in one line.
 *
 * Used as a display mode. Pass a media item or explicit metadata; only provided
 * values are shown as pills.
 */

import { useEffect, useRef, useState } from 'react';
import type { MediaItem } from '../types';
import './Metapills.css';

export interface MetapillsProps {
  /** Media item to pull metadata from (rating, year). */
  item?: MediaItem | null;
  /** Override or add: release date string (e.g. "2024" or "March 15, 2024"). */
  releaseDate?: string;
  /** Override or add: score string (e.g. "8.5/10"). */
  score?: string;
  /** Runtime string (e.g. "2h 15m", "45 min"). */
  runtime?: string;
  /** Optional hex color per pill key (e.g. type, year, runtime). Applied to that pill’s value text. */
  pillColors?: Record<string, string>;
}

function formatReleaseYear(year: number | undefined): string {
  if (year == null) return '';
  return String(year);
}

function formatCommunityRating(value: number | undefined): string {
  if (value == null || Number.isNaN(value)) return '';
  const n = Math.round(value * 10) / 10;
  return n % 1 === 0 ? String(Math.round(n)) : n.toFixed(1);
}

export function Metapills({ item, releaseDate, score, runtime: runtimeProp, pillColors }: MetapillsProps) {
  const parentalRating = item?.rating;
  const communityRating = item?.communityRating;
  const year = item?.year;
  const release = releaseDate ?? (year != null ? formatReleaseYear(year) : '');
  const runtime = (runtimeProp ?? item?.runtime ?? '').trim();

  const pills: { label: string; value: string; key: string }[] = [];
  if (item?.type) {
    pills.push({ label: 'Type', value: item.type, key: 'type' });
  }
  if (communityRating != null && !Number.isNaN(communityRating)) {
    const crStr = score?.trim() || `${formatCommunityRating(communityRating)}/10`;
    pills.push({ label: 'Community rating', value: crStr, key: 'community-rating' });
  } else if (score != null && score.trim() !== '') {
    pills.push({ label: 'Community rating', value: score.trim(), key: 'community-rating' });
  }
  if (release !== '') {
    pills.push({ label: 'Year', value: release, key: 'year' });
  }
  if (runtime !== '') {
    pills.push({ label: 'Runtime', value: runtime, key: 'runtime' });
  }
  const parentalStr = parentalRating?.trim() ?? '';
  const isNumericRating = /^\d+\+?$/.test(parentalStr) || /^\d*\.?\d+$/.test(parentalStr);
  if (parentalStr !== '' && !isNumericRating) {
    pills.push({ label: 'Parental rating', value: parentalStr, key: 'parental-rating' });
  }
  const studioStr = item?.studio?.trim();
  if (studioStr) {
    pills.push({ label: 'Studio', value: studioStr, key: 'studio' });
  }
  const networkStr = item?.network?.trim();
  if (networkStr) {
    pills.push({ label: 'Network', value: networkStr, key: 'network' });
  }
  const publisherStr = item?.publisher?.trim();
  if (publisherStr) {
    pills.push({ label: 'Publisher', value: publisherStr, key: 'publisher' });
  }
  const artistStr = item?.artist?.trim();
  if (artistStr) {
    pills.push({ label: 'Artist', value: artistStr, key: 'artist' });
  }
  const authorStr = item?.author?.trim();
  if (authorStr) {
    pills.push({ label: 'Author', value: authorStr, key: 'author' });
  }

  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const pillsKey = pills.map((p) => `${p.key}:${p.value}`).join('|');
  useEffect(() => {
    const container = containerRef.current;
    const inner = innerRef.current;
    if (!container || !inner) return;
    const updateScale = () => {
      const containerWidth = container.clientWidth;
      const contentWidth = inner.scrollWidth;
      if (containerWidth > 0 && contentWidth > containerWidth) {
        setScale(containerWidth / contentWidth);
      } else {
        setScale(1);
      }
    };
    updateScale();
    const ro = new ResizeObserver(updateScale);
    ro.observe(container);
    return () => ro.disconnect();
  }, [pillsKey]);

  if (pills.length === 0) {
    return (
      <div className="metapills" ref={containerRef}>
        <div className="metapills-inner" ref={innerRef}>
          <span className="metapills-pill metapills-pill--empty">No metadata</span>
        </div>
      </div>
    );
  }

  return (
    <div className="metapills" ref={containerRef}>
      <div
        className="metapills-inner"
        ref={innerRef}
        style={{
          transform: scale < 1 ? `scale(${scale})` : undefined,
          transformOrigin: 'center center',
        }}
      >
        {pills.map(({ label, value, key }) => {
          const valueColor = pillColors?.[key];
          return (
            <span key={key} className="metapills-pill glass-panel">
              <span className="metapills-pill-label">{label}</span>
              <span
                className="metapills-pill-value"
                style={valueColor ? { color: valueColor } : undefined}
              >
                {value}
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
