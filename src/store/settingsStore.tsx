/**
 * Settings store – single source of truth for all FinPoster settings
 *
 * We keep settings in React context and persist them to localStorage so they
 * survive reloads. Every settings page reads and updates this store. The key
 * is SETTINGS_STORAGE_KEY so we can also offer backup/restore from file later.
 */

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { AppSettings } from '../types';
import { defaultSettings } from '../defaults';
import { SETTINGS_STORAGE_KEY } from '../defaults';

/** Try to load saved settings from localStorage; if missing or invalid, use defaults. */
function loadStoredSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return defaultSettings;
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    // Deep merge with defaults so new keys get default values
    return deepMerge(defaultSettings, parsed) as AppSettings;
  } catch {
    return defaultSettings;
  }
}

/** Simple deep merge: overwrites with values from b when present. */
function deepMerge<T extends object>(a: T, b: Partial<T>): T {
  const out = { ...a };
  for (const key of Object.keys(b) as (keyof T)[]) {
    const vb = b[key];
    if (vb === undefined) continue;
    if (typeof vb === 'object' && vb !== null && !Array.isArray(vb) && typeof (a as Record<string, unknown>)[key as string] === 'object') {
      (out as Record<string, unknown>)[key as string] = deepMerge(
        (a as Record<string, unknown>)[key as string] as object,
        vb as Record<string, unknown>
      );
    } else {
      (out as Record<string, unknown>)[key as string] = vb;
    }
  }
  return out;
}

type SetSettings = (update: Partial<AppSettings> | ((prev: AppSettings) => Partial<AppSettings>)) => void;

type SettingsContextValue = {
  settings: AppSettings;
  setSettings: SetSettings;
  /** Persist current settings to localStorage (called automatically on setSettings). */
  persist: () => void;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettingsState] = useState<AppSettings>(loadStoredSettings);

  const persist = useCallback(() => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('FinPoster: could not persist settings', e);
    }
  }, [settings]);

  const setSettings = useCallback<SetSettings>((update) => {
    setSettingsState((prev) => {
      const next = typeof update === 'function' ? update(prev) : update;
      const merged = deepMerge(prev, next) as AppSettings;
      try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(merged));
      } catch {
        // ignore
      }
      return merged;
    });
  }, []);

  const value = useMemo(
    () => ({ settings, setSettings, persist }),
    [settings, setSettings, persist]
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    // In dev tools or isolated renders, components might mount outside the
    // provider. Fall back to default settings rather than crashing the app.
    console.warn('FinPoster: useSettings used outside SettingsProvider; falling back to defaults.');
    const noop: SetSettings = () => {};
    return {
      settings: defaultSettings,
      setSettings: noop,
      persist: () => {},
    };
  }
  return ctx;
}
