/**
 * Plex settings – placeholder for future Plex support
 *
 * Similar to Emby: we expose an enable toggle and basic connection fields
 * so wiring Plex in later won't require changing the nav or layout.
 */

import { useSettings } from '../../store/settingsStore';

export function PlexSettings() {
  const { settings, setSettings } = useSettings();
  const p = settings.plex;

  return (
    <div className="glass-panel" style={{ padding: 24, maxWidth: 640 }}>
      <h1>Plex</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
        Plex support is planned for a future update. You can use Jellyfin as the
        primary media source for now, but you can preconfigure Plex here.
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
        <span>Enable Plex as source</span>
        <button
          type="button"
          onClick={() =>
            setSettings({
              plex: {
                ...p,
                enabled: !p.enabled,
              },
            })
          }
          aria-pressed={p.enabled}
          style={{
            position: 'relative',
            width: 46,
            height: 24,
            borderRadius: 999,
            border: '1px solid var(--glass-border)',
            background: p.enabled ? 'var(--accent)' : 'rgba(255,255,255,0.08)',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: 2,
              left: p.enabled ? 24 : 2,
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
        Server URL
      </label>
      <input
        type="url"
        className="input"
        placeholder="http://plex.example.com:32400"
        value={p.serverUrl}
        onChange={(ev) =>
          setSettings({ plex: { ...p, serverUrl: ev.target.value } })
        }
      />

      <label style={{ display: 'block', marginTop: 16, marginBottom: 8 }}>
        Token
      </label>
      <input
        type="password"
        className="input input-password"
        placeholder="••••••••"
        value={p.token}
        onChange={(ev) =>
          setSettings({ plex: { ...p, token: ev.target.value } })
        }
      />
    </div>
  );
}
