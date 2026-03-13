/**
 * Media Showcase settings – poster duration, tagline, ticker, colors, media types
 *
 * Controls how the main display mode looks and behaves: how long each poster
 * shows, whether to show tagline, ticker scroll speed, and optional color
 * overrides. Same glass style as other settings pages.
 */

import { useSettings } from '../../store/settingsStore';
import type { MediaType } from '../../types';
const MEDIA_TYPES: MediaType[] = ['Movie', 'Series', 'Music', 'Book', 'Photo', 'People'];

export function MediaShowcaseSettings() {
  const { settings, setSettings } = useSettings();
  const m = settings.mediaShowcase;

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
        min={5}
        max={120}
        value={m.posterDisplaySeconds}
        onChange={(e) =>
          setSettings({
            mediaShowcase: {
              ...m,
              posterDisplaySeconds: Math.max(5, parseInt(e.target.value, 10) || 5),
            },
          })
        }
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

      <label style={{ display: 'block', marginTop: 16, marginBottom: 8 }}>
        Ticker scroll speed (pixels per second)
      </label>
      <input
        type="number"
        className="input"
        min={10}
        max={120}
        value={m.tickerScrollSpeedPxPerSec}
        onChange={(e) =>
          setSettings({
            mediaShowcase: {
              ...m,
              tickerScrollSpeedPxPerSec: Math.max(10, parseInt(e.target.value, 10) || 40),
            },
          })
        }
      />

      <label style={{ display: 'block', marginTop: 16, marginBottom: 8 }}>
        Ticker color
      </label>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="color"
          value={m.tickerColor || '#ffffff'}
          onChange={(e) =>
            setSettings({ mediaShowcase: { ...m, tickerColor: e.target.value } })
          }
          style={{ width: 44, height: 32, padding: 0, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'transparent' }}
        />
        <input
          type="text"
          className="input"
          style={{ maxWidth: 120 }}
          placeholder="#ffffff"
          value={m.tickerColor}
          onChange={(e) =>
            setSettings({ mediaShowcase: { ...m, tickerColor: e.target.value } })
          }
        />
      </div>

      <label style={{ display: 'block', marginTop: 16, marginBottom: 8 }}>
        Accent color
      </label>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="color"
          value={m.accentColor || '#00a4dc'}
          onChange={(e) =>
            setSettings({ mediaShowcase: { ...m, accentColor: e.target.value } })
          }
          style={{ width: 44, height: 32, padding: 0, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'transparent' }}
        />
        <input
          type="text"
          className="input"
          style={{ maxWidth: 120 }}
          placeholder="#00a4dc"
          value={m.accentColor}
          onChange={(e) =>
            setSettings({ mediaShowcase: { ...m, accentColor: e.target.value } })
          }
        />
      </div>

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
    </div>
  );
}
