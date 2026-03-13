/**
 * Media Showcase settings – poster duration, tagline, ticker, colors, media types
 *
 * Controls how the main display mode looks and behaves: how long each poster
 * shows, whether to show tagline, ticker scroll speed, and optional color
 * overrides. Same glass style as other settings pages.
 */

import { useState } from 'react';
import { useSettings } from '../../store/settingsStore';
import type { MediaType, PosterTransitionId } from '../../types';
import { defaultMediaShowcase } from '../../defaults';
import { DISPLAY_FONTS } from '../../constants/displayFonts';

const MEDIA_TYPES: MediaType[] = ['Movie', 'Series', 'Music', 'Book', 'Photo', 'People'];

const TRANSITION_LABELS: Record<PosterTransitionId, string> = {
  fade: 'Fade',
  slideLeft: 'Slide from left',
  slideRight: 'Slide from right',
  slideUp: 'Slide from bottom',
  slideDown: 'Slide from top',
  zoomIn: 'Zoom in',
  zoomOut: 'Zoom out',
};

const ALL_TRANSITIONS: PosterTransitionId[] = [
  'fade',
  'slideLeft',
  'slideRight',
  'slideUp',
  'slideDown',
  'zoomIn',
  'zoomOut',
];

const tabStyle = (active: boolean) => ({
  padding: '8px 16px',
  border: 'none',
  borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
  background: 'transparent',
  color: active ? 'var(--text-primary)' : 'var(--text-muted)',
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 500,
});

const POSTER_DISPLAY_MIN = 5;
const POSTER_DISPLAY_MAX = 120;

/** Metapill keys and display labels for per-pill color settings */
const METAPILL_COLOR_KEYS: { key: string; label: string }[] = [
  { key: 'type', label: 'Type' },
  { key: 'community-rating', label: 'Community rating' },
  { key: 'year', label: 'Year' },
  { key: 'runtime', label: 'Runtime' },
  { key: 'parental-rating', label: 'Parental rating' },
  { key: 'studio', label: 'Studio' },
  { key: 'network', label: 'Network' },
  { key: 'publisher', label: 'Publisher' },
  { key: 'artist', label: 'Artist' },
  { key: 'author', label: 'Author' },
];

export function MediaShowcaseSettings() {
  const { settings, setSettings } = useSettings();
  const m = settings.mediaShowcase;
  const [tab, setTab] = useState<'main' | 'customize'>('main');
  const [posterTimeInput, setPosterTimeInput] = useState(() =>
    String(m.posterDisplaySeconds ?? defaultMediaShowcase.posterDisplaySeconds ?? 15)
  );

  const commitPosterTime = () => {
    const num = parseInt(posterTimeInput, 10);
    const clamped = Number.isNaN(num)
      ? (defaultMediaShowcase.posterDisplaySeconds ?? 15)
      : Math.max(POSTER_DISPLAY_MIN, Math.min(POSTER_DISPLAY_MAX, num));
    setSettings({
      mediaShowcase: { ...m, posterDisplaySeconds: clamped },
    });
    setPosterTimeInput(String(clamped));
  };

  const toggleMediaType = (type: MediaType) => {
    setSettings({
      mediaShowcase: {
        ...m,
        enabledMediaTypes: m.enabledMediaTypes.includes(type)
          ? m.enabledMediaTypes.filter((t) => t !== type)
          : [...m.enabledMediaTypes, type],
      },
    });
  };

  return (
    <div className="glass-panel" style={{ padding: 24, maxWidth: 640 }}>
      <h1>Media Showcase</h1>
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--glass-border)' }}>
        <button type="button" style={tabStyle(tab === 'main')} onClick={() => setTab('main')}>
          Settings
        </button>
        <button type="button" style={tabStyle(tab === 'customize')} onClick={() => setTab('customize')}>
          Customize
        </button>
      </div>

      {tab === 'main' && (
        <>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
        Control the main poster display: timing, ticker, and colors.
      </p>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 16,
        }}
      >
        <span>Enable Media Showcase</span>
        <button
          type="button"
          onClick={() =>
            setSettings({
              mediaShowcase: {
                ...m,
                enabled: !m.enabled,
              },
            })
          }
          aria-pressed={m.enabled}
          style={{
            position: 'relative',
            width: 46,
            height: 24,
            borderRadius: 999,
            border: '1px solid var(--glass-border)',
            background: m.enabled ? 'var(--accent)' : 'rgba(255,255,255,0.08)',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: 2,
              left: m.enabled ? 24 : 2,
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: '#ffffff',
              boxShadow: '0 0 6px rgba(0,0,0,0.4)',
              transition: 'left 0.18s ease',
            }}
          />
        </button>
      </div>

      <label style={{ display: 'block', marginBottom: 8 }}>
        Poster display time (seconds)
      </label>
      <input
        type="number"
        className="input"
        min={POSTER_DISPLAY_MIN}
        max={POSTER_DISPLAY_MAX}
        value={posterTimeInput}
        onChange={(e) => setPosterTimeInput(e.target.value)}
        onBlur={commitPosterTime}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.currentTarget.blur();
          }
        }}
        aria-label="Poster display time in seconds"
      />

      <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16 }}>
        <input
          type="checkbox"
          checked={m.showTagline}
          onChange={(e) =>
            setSettings({
              mediaShowcase: { ...m, showTagline: e.target.checked },
            })
          }
        />
        Show tagline in ticker
      </label>

      <div style={{ marginTop: 24 }}>
        <h2>Media types</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 12 }}>
          Which types to show in Media Showcase.
        </p>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {MEDIA_TYPES.map((type) => {
            const active = m.enabledMediaTypes.includes(type);
            return (
              <li key={type} style={{ marginBottom: 6 }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 8px',
                    borderRadius: 8,
                    border: '1px solid var(--glass-border)',
                    background: 'rgba(0,0,0,0.25)',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() => toggleMediaType(type)}
                  />
                  <span>{type}</span>
                </label>
              </li>
            );
          })}
        </ul>
      </div>
        </>
      )}

      {tab === 'customize' && (
        <>
        <h2 style={{ marginTop: 0, marginBottom: 12 }}>Transitions</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 12 }}>
          When the poster changes, a random enabled transition is used. Toggle which ones to include.
        </p>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, marginBottom: 24 }}>
          {ALL_TRANSITIONS.map((tid) => {
            const enabled = (m.enabledTransitions ?? defaultMediaShowcase.enabledTransitions ?? []).includes(tid);
            return (
              <li
                key={tid}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  marginBottom: 8,
                }}
              >
                <span>{TRANSITION_LABELS[tid]}</span>
                <button
                  type="button"
                  onClick={() => {
                    const list = m.enabledTransitions ?? defaultMediaShowcase.enabledTransitions ?? [];
                    setSettings({
                      mediaShowcase: {
                        ...m,
                        enabledTransitions: enabled
                          ? list.filter((t) => t !== tid)
                          : [...list, tid],
                      },
                    });
                  }}
                  aria-pressed={enabled}
                  style={{
                    position: 'relative',
                    width: 46,
                    height: 24,
                    borderRadius: 999,
                    border: '1px solid var(--glass-border)',
                    background: enabled ? 'var(--accent)' : 'rgba(255,255,255,0.08)',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      top: 2,
                      left: enabled ? 24 : 2,
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      background: '#ffffff',
                      boxShadow: '0 0 6px rgba(0,0,0,0.4)',
                      transition: 'left 0.18s ease',
                    }}
                  />
                </button>
              </li>
            );
          })}
        </ul>

        <h2 style={{ marginBottom: 12 }}>Appearance</h2>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: 16,
          }}
        >
          <span>Show Home Cinema in rotation</span>
          <button
            type="button"
            onClick={() =>
              setSettings({
                mediaShowcase: {
                  ...m,
                  showHomeCinema: m.showHomeCinema === false,
                },
              })
            }
            aria-pressed={m.showHomeCinema !== false}
            style={{
              position: 'relative',
              width: 46,
              height: 24,
              borderRadius: 999,
              border: '1px solid var(--glass-border)',
              background: m.showHomeCinema !== false ? 'var(--accent)' : 'rgba(255,255,255,0.08)',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <span
              style={{
                position: 'absolute',
                top: 2,
                left: m.showHomeCinema !== false ? 24 : 2,
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: '#ffffff',
                boxShadow: '0 0 6px rgba(0,0,0,0.4)',
                transition: 'left 0.18s ease',
              }}
            />
          </button>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: -8, marginBottom: 16 }}>
          When on, each poster is followed by a Home Cinema screen (title + poster). When off, posters advance without Home Cinema.
        </p>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: 16,
          }}
        >
          <span>Show media logo below poster</span>
          <button
            type="button"
            onClick={() =>
              setSettings({
                mediaShowcase: {
                  ...m,
                  showMediaLogo: m.showMediaLogo === false,
                },
              })
            }
            aria-pressed={m.showMediaLogo !== false}
            style={{
              position: 'relative',
              width: 46,
              height: 24,
              borderRadius: 999,
              border: '1px solid var(--glass-border)',
              background: m.showMediaLogo !== false ? 'var(--accent)' : 'rgba(255,255,255,0.08)',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <span
              style={{
                position: 'absolute',
                top: 2,
                left: m.showMediaLogo !== false ? 24 : 2,
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: '#ffffff',
                boxShadow: '0 0 6px rgba(0,0,0,0.4)',
                transition: 'left 0.18s ease',
              }}
            />
          </button>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: -8, marginBottom: 16 }}>
          When off, the logo/title below the poster in Home Cinema is hidden and the border around it is removed.
        </p>

        <h2 style={{ marginTop: 24, marginBottom: 12 }}>Colors</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 8 }}>
          Color mode: <strong>Off</strong> = use your colors below. <strong>Colorful</strong> = default palette. <strong>Mono</strong> = light gray.
        </p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setSettings({ mediaShowcase: { ...m, colorMode: 'off' } })}
            aria-pressed={(m.colorMode ?? 'off') === 'off'}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid var(--glass-border)',
              background: (m.colorMode ?? 'off') === 'off' ? 'var(--accent)' : 'rgba(255,255,255,0.08)',
              color: '#ffffff',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Off
          </button>
          <button
            type="button"
            onClick={() => setSettings({ mediaShowcase: { ...m, colorMode: 'colorful' } })}
            aria-pressed={m.colorMode === 'colorful'}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid var(--glass-border)',
              background: m.colorMode === 'colorful' ? 'var(--accent)' : 'rgba(255,255,255,0.08)',
              color: '#ffffff',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Colorful
          </button>
          <button
            type="button"
            onClick={() => setSettings({ mediaShowcase: { ...m, colorMode: 'mono' } })}
            aria-pressed={m.colorMode === 'mono'}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid var(--glass-border)',
              background: m.colorMode === 'mono' ? 'var(--accent)' : 'rgba(255,255,255,0.08)',
              color: '#ffffff',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Mono
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px', marginBottom: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 8 }}>Border color</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="color"
                value={m.borderColor ?? '#ffffff'}
                onChange={(e) =>
                  setSettings({ mediaShowcase: { ...m, borderColor: e.target.value } })
                }
                style={{
                  width: 44,
                  height: 32,
                  padding: 0,
                  borderRadius: 8,
                  border: '1px solid var(--glass-border)',
                  background: 'transparent',
                }}
              />
              <input
                type="text"
                className="input"
                style={{ flex: 1, minWidth: 0 }}
                placeholder="#ffffff"
                value={m.borderColor ?? ''}
                onChange={(e) =>
                  setSettings({ mediaShowcase: { ...m, borderColor: e.target.value } })
                }
              />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 8 }}>Home Cinema title color</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="color"
                value={m.homeCinemaTitleColor ?? '#ff0000'}
                onChange={(e) =>
                  setSettings({ mediaShowcase: { ...m, homeCinemaTitleColor: e.target.value } })
                }
                style={{
                  width: 44,
                  height: 32,
                  padding: 0,
                  borderRadius: 8,
                  border: '1px solid var(--glass-border)',
                  background: 'transparent',
                }}
              />
              <input
                type="text"
                className="input"
                style={{ flex: 1, minWidth: 0 }}
                placeholder="#ff0000"
                value={m.homeCinemaTitleColor ?? ''}
                onChange={(e) =>
                  setSettings({ mediaShowcase: { ...m, homeCinemaTitleColor: e.target.value } })
                }
              />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 8 }}>Ticker bar text color</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="color"
                value={m.tickerColor || '#ffffff'}
                onChange={(e) =>
                  setSettings({ mediaShowcase: { ...m, tickerColor: e.target.value } })
                }
                style={{
                  width: 44,
                  height: 32,
                  padding: 0,
                  borderRadius: 8,
                  border: '1px solid var(--glass-border)',
                  background: 'transparent',
                }}
              />
              <input
                type="text"
                className="input"
                style={{ flex: 1, minWidth: 0 }}
                placeholder="#ffffff"
                value={m.tickerColor}
                onChange={(e) =>
                  setSettings({ mediaShowcase: { ...m, tickerColor: e.target.value } })
                }
              />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 8 }}>Current time text color</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="color"
                value={m.timePillColor ?? m.tickerColor ?? '#eef207'}
                onChange={(e) =>
                  setSettings({ mediaShowcase: { ...m, timePillColor: e.target.value } })
                }
                style={{
                  width: 44,
                  height: 32,
                  padding: 0,
                  borderRadius: 8,
                  border: '1px solid var(--glass-border)',
                  background: 'transparent',
                }}
              />
              <input
                type="text"
                className="input"
                style={{ flex: 1, minWidth: 0 }}
                placeholder="#eef207"
                value={m.timePillColor ?? m.tickerColor ?? ''}
                onChange={(e) =>
                  setSettings({ mediaShowcase: { ...m, timePillColor: e.target.value } })
                }
              />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 8 }}>Accent color</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="color"
                value={m.accentColor || '#00a4dc'}
                onChange={(e) =>
                  setSettings({ mediaShowcase: { ...m, accentColor: e.target.value } })
                }
                style={{
                  width: 44,
                  height: 32,
                  padding: 0,
                  borderRadius: 8,
                  border: '1px solid var(--glass-border)',
                  background: 'transparent',
                }}
              />
              <input
                type="text"
                className="input"
                style={{ flex: 1, minWidth: 0 }}
                placeholder="#00a4dc"
                value={m.accentColor}
                onChange={(e) =>
                  setSettings({ mediaShowcase: { ...m, accentColor: e.target.value } })
                }
              />
            </div>
          </div>
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 12 }}>
          Metapills: set a color for each pill type. Leave empty to use the default text color.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
          {METAPILL_COLOR_KEYS.map(({ key, label }) => (
            <div
              key={key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 10px',
                borderRadius: 8,
                border: '1px solid var(--glass-border)',
                background: 'rgba(0,0,0,0.2)',
              }}
            >
              <span style={{ fontSize: 13, minWidth: 100 }}>{label}</span>
              <input
                type="color"
                title={`${label} color`}
                value={m.metapillsColors?.[key] ?? '#ffffff'}
                onChange={(e) =>
                  setSettings({
                    mediaShowcase: {
                      ...m,
                      metapillsColors: {
                        ...(m.metapillsColors ?? {}),
                        [key]: e.target.value,
                      },
                    },
                  })
                }
                style={{
                  width: 32,
                  height: 28,
                  padding: 0,
                  border: '1px solid var(--glass-border)',
                  borderRadius: 6,
                  background: 'transparent',
                  cursor: 'pointer',
                }}
              />
              <input
                type="text"
                className="input"
                placeholder="Default"
                value={m.metapillsColors?.[key] ?? ''}
                onChange={(e) => {
                  const next = { ...(m.metapillsColors ?? {}) };
                  const v = e.target.value.trim();
                  if (v) next[key] = v;
                  else delete next[key];
                  setSettings({ mediaShowcase: { ...m, metapillsColors: next } });
                }}
                style={{ width: 72, fontSize: 12 }}
                aria-label={`${label} color`}
              />
            </div>
          ))}
        </div>

        <label style={{ display: 'block', marginTop: 8, marginBottom: 8 }}>
          Backdrop blur (pixels)
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <input
            type="range"
            min={0}
            max={60}
            value={m.backdropBlurPx ?? 18}
            onChange={(e) =>
              setSettings({
                mediaShowcase: {
                  ...m,
                  backdropBlurPx: parseInt(e.target.value, 10) || 0,
                },
              })
            }
            style={{
              flex: 1,
              accentColor: 'var(--accent)',
              height: 8,
            }}
          />
          <input
            type="number"
            className="input"
            min={0}
            max={60}
            step={1}
            value={m.backdropBlurPx ?? 18}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              if (!Number.isNaN(v)) {
                setSettings({
                  mediaShowcase: {
                    ...m,
                    backdropBlurPx: Math.max(0, Math.min(60, v)),
                  },
                });
              }
            }}
            style={{ width: 56, textAlign: 'center' }}
            aria-label="Backdrop blur"
          />
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
          0 = no blur; higher values soften the background behind the poster.
        </p>

        <label style={{ display: 'block', marginTop: 16, marginBottom: 8 }}>
          Ticker scroll speed (pixels per second)
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <input
            type="range"
            min={10}
            max={500}
            step={25}
            value={Math.min(500, m.tickerScrollSpeedPxPerSec)}
            onChange={(e) =>
              setSettings({
                mediaShowcase: {
                  ...m,
                  tickerScrollSpeedPxPerSec: Math.max(10, Math.min(500, parseInt(e.target.value, 10) || 10)),
                },
              })
            }
            style={{
              flex: 1,
              accentColor: 'var(--accent)',
              height: 8,
            }}
          />
          <input
            type="number"
            className="input"
            min={10}
            max={500}
            step={1}
            value={m.tickerScrollSpeedPxPerSec}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              if (!Number.isNaN(v)) {
                setSettings({
                  mediaShowcase: {
                    ...m,
                    tickerScrollSpeedPxPerSec: Math.max(10, Math.min(500, v)),
                  },
                });
              }
            }}
            style={{ width: 64, textAlign: 'center' }}
            aria-label="Ticker scroll speed"
          />
        </div>

        <label htmlFor="display-font-select" style={{ display: 'block', marginTop: 16, marginBottom: 8 }}>
          Ticker bar font
        </label>
        <select
          id="display-font-select"
          className="input"
          value={m.displayFont ?? 'default'}
          onChange={(e) =>
            setSettings({ mediaShowcase: { ...m, displayFont: e.target.value } })
          }
          style={{ marginBottom: 8, maxWidth: 280 }}
          aria-label="Ticker bar font"
        >
          {DISPLAY_FONTS.map((f) => (
            <option key={f.id} value={f.id}>
              {f.label}
            </option>
          ))}
        </select>

        <label htmlFor="homecinema-font-select" style={{ display: 'block', marginTop: 16, marginBottom: 8 }}>
          Home Cinema title font
        </label>
        <select
          id="homecinema-font-select"
          className="input"
          value={m.homeCinemaFont ?? 'default'}
          onChange={(e) =>
            setSettings({ mediaShowcase: { ...m, homeCinemaFont: e.target.value } })
          }
          style={{ marginBottom: 8, maxWidth: 280 }}
          aria-label="Home Cinema title font"
        >
          {DISPLAY_FONTS.map((f) => (
            <option key={f.id} value={f.id}>
              {f.label}
            </option>
          ))}
        </select>
        </>
      )}
    </div>
  );
}
