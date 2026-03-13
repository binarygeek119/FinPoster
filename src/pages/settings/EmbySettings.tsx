/**
 * Emby settings – placeholder for future Emby support
 *
 * Same idea as Plex: we expose an enable toggle and basic connection fields
 * so wiring Emby in later won't require changing the nav or layout.
 */

import { useSettings } from '../../store/settingsStore';

export function EmbySettings() {
  const { settings, setSettings } = useSettings();
  const e = settings.emby;

  return (
    <div className="glass-panel" style={{ padding: 24, maxWidth: 640 }}>
      <h1>Emby</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
        Emby support is planned for a future update. You can preconfigure the connection
        here so it is ready when Emby is enabled as a source.
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
        <span>Enable Emby as source</span>
        <button
          type="button"
          onClick={() =>
            setSettings({
              emby: {
                ...e,
                enabled: !e.enabled,
              },
            })
          }
          aria-pressed={e.enabled}
          style={{
            position: 'relative',
            width: 46,
            height: 24,
            borderRadius: 999,
            border: '1px solid var(--glass-border)',
            background: e.enabled ? 'var(--accent)' : 'rgba(255,255,255,0.08)',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: 2,
              left: e.enabled ? 24 : 2,
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
        placeholder="https://emby.example.com"
        value={e.serverUrl}
        onChange={(ev) =>
          setSettings({ emby: { ...e, serverUrl: ev.target.value } })
        }
      />

      <label style={{ display: 'block', marginTop: 16, marginBottom: 8 }}>
        API key
      </label>
      <input
        type="password"
        className="input input-password"
        placeholder="••••••••"
        value={e.apiKey}
        onChange={(ev) =>
          setSettings({ emby: { ...e, apiKey: ev.target.value } })
        }
      />
    </div>
  );
}
