/**
 * Viewport size hook – reads window inner width/height and updates on resize.
 * Use this whenever you need the browser viewport dimensions (e.g. for scaling or layout).
 */

import { useState, useEffect } from 'react';

export interface ViewportSize {
  width: number;
  height: number;
}

function getViewportSize(): ViewportSize {
  if (typeof window === 'undefined') return { width: 0, height: 0 };
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

export function useViewport(): ViewportSize {
  const [size, setSize] = useState(getViewportSize);

  useEffect(() => {
    const onResize = () => setSize(getViewportSize());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return size;
}
