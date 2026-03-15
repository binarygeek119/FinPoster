/**
 * CinemaPart – Home Cinema title. Shared by Media Showcase and Playback display.
 * Accepts className for the wrapper so parent can use media-showcase-cinema or playback-cinema.
 */

import { useEffect, useRef, useState } from 'react';

export interface CinemaPartProps {
  /** Title text (e.g. "Renniks Cinema") */
  displayTitle: string;
  /** CSS font-family for the title */
  fontFamily?: string;
  /** CSS color for the title */
  color?: string;
  /** Root wrapper class (e.g. "media-showcase-cinema" or "playback-cinema") */
  className: string;
  /** Title class for the h1 (e.g. "media-showcase-title" or "playback-title") */
  titleClassName?: string;
}

export function CinemaPart({
  displayTitle,
  fontFamily,
  color,
  className,
  titleClassName = 'media-showcase-title',
}: CinemaPartProps) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const titleWrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const wrap = titleWrapRef.current;
    const title = titleRef.current;
    if (!wrap || !title || !displayTitle) {
      setScale(1);
      return;
    }
    const updateScale = () => {
      const wrapWidth = wrap.clientWidth;
      const scrollWidth = title.scrollWidth;
      if (wrapWidth > 0 && scrollWidth > wrapWidth) {
        setScale(wrapWidth / scrollWidth);
      } else {
        setScale(1);
      }
    };
    updateScale();
    const ro = new ResizeObserver(updateScale);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [displayTitle]);

  return (
    <div ref={titleWrapRef} className={className}>
      <h1
        ref={titleRef}
        className={titleClassName}
        style={{
          transform: `scale(${scale})`,
          ...(fontFamily ? { fontFamily } : {}),
          ...(color ? { color } : {}),
        }}
      >
        {displayTitle}
      </h1>
    </div>
  );
}
