/**
 * Media Showcase settings – poster duration, tagline, ticker, colors, media types
 *
 * Controls how the main display mode looks and behaves: how long each poster
 * shows, whether to show tagline, ticker scroll speed, and optional color
 * overrides. Same glass style as other settings pages.
 */

import { useSettings } from '../../store/settingsStore';
import type { MediaType } from '../../types';
const MEDIA_TYPES: MediaType[] = ['Movie', 'Series', 'Music', 'Book'];

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
        Ticker color (hex)
      </label>
      <input
        type="text"
        className="input"
        placeholder="#ffffff"
        value={m.tickerColor}
        onChange={(e) =>
          setSettings({ mediaShowcase: { ...m, tickerColor: e.target.value } })
        }
      />

      <label style={{ display: 'block', marginTop: 16, marginBottom: 8 }}>
        Accent color (hex)
      </label>
      <input
        type="text"
        className="input"
        placeholder="#00a4dc"
        value={m.accentColor}
        onChange={(e) =>
          setSettings({ mediaShowcase: { ...m, accentColor: e.target.value } })
        }
      />

      <div style={{ marginTop: 24 }}>
        <h2>Media types</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 12 }}>
          Which types to show in Media Showcase.
        </p>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {MEDIA_TYPES.map((type) => (
            <li key={type} style={{ marginBottom: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={m.enabledMediaTypes.includes(type)}
                  onChange={() => toggleMediaType(type)}
                />
                {type}
              </label>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
