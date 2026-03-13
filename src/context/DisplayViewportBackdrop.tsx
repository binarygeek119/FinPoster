/**
 * Context for viewport-level backdrop (e.g. Media Showcase blurred backdrop).
 * Rendered by DisplayLayout so it fills the viewport and is NOT scaled with the content.
 */

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

export interface ViewportBackdropState {
  backdropUrl: string | null;
  blurPx: number;
}

const defaultState: ViewportBackdropState = { backdropUrl: null, blurPx: 0 };

type SetViewportBackdrop = (url: string | null, blurPx?: number) => void;

const DisplayViewportBackdropContext = createContext<{
  state: ViewportBackdropState;
  setViewportBackdrop: SetViewportBackdrop;
} | null>(null);

export function DisplayViewportBackdropProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ViewportBackdropState>(defaultState);
  const setViewportBackdrop = useCallback<SetViewportBackdrop>((url, blurPx = 0) => {
    setState((prev) =>
      prev.backdropUrl === url && prev.blurPx === blurPx ? prev : { backdropUrl: url, blurPx }
    );
  }, []);
  return (
    <DisplayViewportBackdropContext.Provider value={{ state, setViewportBackdrop }}>
      {children}
    </DisplayViewportBackdropContext.Provider>
  );
}

export function useViewportBackdrop() {
  const ctx = useContext(DisplayViewportBackdropContext);
  return ctx ?? { state: defaultState, setViewportBackdrop: () => {} };
}
