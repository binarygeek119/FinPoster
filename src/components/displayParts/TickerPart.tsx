/**
 * TickerPart – logo | ticker | time pill. Shared by Media Showcase and Playback display.
 */

import { TickerSlide } from '../TickerSlide';

export interface TickerPartProps {
  tickerText: string;
  tickerSpeedPxPerSec?: number;
  tickerColor?: string;
  timePillColor?: string;
  tickerFontFamily?: string;
  /** Root wrapper class (e.g. "media-showcase-tickerslide-wrap" or "playback-tickerslide-wrap") */
  className: string;
}

export function TickerPart({
  tickerText,
  tickerSpeedPxPerSec,
  tickerColor,
  timePillColor,
  tickerFontFamily,
  className,
}: TickerPartProps) {
  return (
    <div className={className}>
      <TickerSlide
        tickerText={tickerText}
        tickerSpeedPxPerSec={tickerSpeedPxPerSec}
        tickerColor={tickerColor}
        timePillColor={timePillColor}
        tickerFontFamily={tickerFontFamily}
      />
    </div>
  );
}
