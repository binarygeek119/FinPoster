/**
 * Ads display – show uploaded advertisement images in rotation
 *
 * This mode shows one ad at a time for a configurable duration, then returns
 * to Media Showcase. If ads are disabled or the list is empty, the rotator
 * skips this mode. Ads are chosen randomly from the enabled set.
 */

import { useState, useEffect, type CSSProperties } from 'react';
import type { AdItem } from '../types';
import { useSettings } from '../store/settingsStore';
import './AdsDisplay.css';

interface AdsDisplayProps {
  ads: AdItem[];
  /** How long each ad is shown (seconds). */
  durationSeconds: number;
}

export function AdsDisplay({ ads, durationSeconds }: AdsDisplayProps) {
  const [index, setIndex] = useState(0);
  const { settings } = useSettings();
  const adsSettings = settings.ads;
  const blurPx = Math.max(0, Math.min(64, adsSettings.adBackgroundBlurPx ?? 24));

  useEffect(() => {
    if (ads.length === 0) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % ads.length);
    }, durationSeconds * 1000);
    return () => clearInterval(id);
  }, [ads.length, durationSeconds]);

  if (ads.length === 0) {
    return null;
  }

  const ad = ads[index];
  return (
    <div
      className="ads-display"
      style={{ '--ads-blur-radius': `${blurPx}px` } as CSSProperties}
    >
      <div
        className="ads-display-backdrop"
        style={{ backgroundImage: `url(${ad.imageUrl})` }}
      />
      <div className="ads-display-backdrop-overlay" />
      <div className="ads-display-inner">
        <div className="ads-display-poster-block glass-panel">
          <div className="ads-display-poster">
            <img
              src={ad.imageUrl}
              alt={ad.label || 'Advertisement'}
              className="ads-display-poster-img"
            />
          </div>
          {ad.label && (
            <div className="ads-display-label-bar">
              <span className="ads-display-label-text">{ad.label}</span>
            </div>
          )}
          {ad.prices && ad.prices.length > 0 && (
            <div className="ads-display-prices glass-panel">
              {ad.prices.map((line, i) => (
                <div key={i} className="ads-display-price-line">
                  <span className="ads-display-price-label">{line.label}</span>
                  <span className="ads-display-price-value">{line.price}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
