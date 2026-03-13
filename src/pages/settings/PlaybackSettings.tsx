/**
 * Playback settings – global playback-related options
 *
 * Central place for settings that control how FinPoster reacts to currently
 * playing media. Right now this focuses on Jellyfin playback users/devices,
 * but the section can grow to include Plex/Emby in the future.
 */

import { useState } from 'react';
import { useSettings } from '../../store/settingsStore';

/** Metapill keys and display labels for per-pill color settings (shared with Media Showcase). */
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

export function PlaybackSettings() {
  const { settings, setSettings } = useSettings();
  const j = settings.jellyfin;
  const m = settings.mediaShowcase;
  const [input, setInput] = useState('');
  const list = j.playbackWatchIds ?? [];

  const addWatcher = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    if (list.includes(trimmed)) {
      setInput('');
      return;
    }
    setSettings({
      jellyfin: {
        ...j,
        playbackWatchIds: [...list, trimmed],
      },
    });
    setInput('');
  };

  const removeWatcher = (value: string) => {
    setSettings({
      jellyfin: {
        ...j,
        playbackWatchIds: list.filter((v) => v !== value),
      },
    });
  };

  const [tab, setTab] = useState<'main' | 'customize'>('main');
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

  return (
    <div className="glass-panel" style={{ padding: 24, maxWidth: 720 }}>
      <h1>Playback</h1>
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
      <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
        Configure which Jellyfin users/devices FinPoster should watch for playback.
      </p>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 12,
        }}
      >
        <span>Enable playback features</span>
        <button
          type="button"
          onClick={() =>
            setSettings({
              jellyfin: {
                ...j,
                playbackEnabled: !j.playbackEnabled,
              },
            })
          }
          aria-pressed={j.playbackEnabled}
          style={{
            position: 'relative',
            width: 46,
            height: 24,
            borderRadius: 999,
            border: '1px solid var(--glass-border)',
            background: j.playbackEnabled ? 'var(--accent)' : 'rgba(255,255,255,0.08)',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: 2,
              left: j.playbackEnabled ? 24 : 2,
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

      <div
        style={{
          marginTop: 16,
          padding: 16,
          borderRadius: 12,
          border: '1px solid var(--glass-border)',
          background: 'rgba(0,0,0,0.25)',
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: 4, fontSize: 14 }}>
          Playback watchers
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 8 }}>
          User or device IDs to include when checking what is currently playing.
          Useful if multiple devices should trigger playback overlays.
        </p>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {list.map((id) => (
            <li
              key={id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 4,
              }}
            >
              <span style={{ fontSize: 13 }}>{id}</span>
              <button type="button" className="btn" onClick={() => removeWatcher(id)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <input
            type="text"
            className="input"
            placeholder="Extra user or device ID"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="button" className="btn btn-primary" onClick={addWatcher}>
            Add
          </button>
        </div>
      </div>
        </>
      )}

      {tab === 'customize' && (
        <>
          <h2 style={{ marginTop: 0, marginBottom: 12 }}>Colors</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 8 }}>
            Color mode for playback and Media Showcase. <strong>Off</strong> = use your colors below.{' '}
            <strong>Colorful</strong> = default palette. <strong>Mono</strong> = light gray.
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
              <label style={{ display: 'block', marginBottom: 8 }}>Start time text color</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="color"
                  value={m.playbackTimeColor ?? m.timePillColor ?? m.tickerColor ?? '#eef207'}
                  onChange={(e) =>
                    setSettings({ mediaShowcase: { ...m, playbackTimeColor: e.target.value } })
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
                  value={m.playbackTimeColor ?? m.timePillColor ?? m.tickerColor ?? ''}
                  onChange={(e) =>
                    setSettings({ mediaShowcase: { ...m, playbackTimeColor: e.target.value } })
                  }
                />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 8 }}>End time text color</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="color"
                  value={
                    m.playbackEndTimeColor ??
                    m.playbackTimeColor ??
                    m.timePillColor ??
                    m.tickerColor ??
                    '#eef207'
                  }
                  onChange={(e) =>
                    setSettings({
                      mediaShowcase: { ...m, playbackEndTimeColor: e.target.value },
                    })
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
                  value={
                    m.playbackEndTimeColor ??
                    m.playbackTimeColor ??
                    m.timePillColor ??
                    m.tickerColor ??
                    ''
                  }
                  onChange={(e) =>
                    setSettings({
                      mediaShowcase: { ...m, playbackEndTimeColor: e.target.value },
                    })
                  }
                />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 8 }}>Playback progress bar color</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="color"
                  value={m.progressBarColor ?? m.accentColor ?? '#00a4dc'}
                  onChange={(e) =>
                    setSettings({ mediaShowcase: { ...m, progressBarColor: e.target.value } })
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
                  value={m.progressBarColor ?? m.accentColor ?? ''}
                  onChange={(e) =>
                    setSettings({ mediaShowcase: { ...m, progressBarColor: e.target.value } })
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
            Metapills and playback overlay: set a color for each pill type. Leave empty to use the default
            text color.
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
        </>
      )}
    </div>
  );
}

