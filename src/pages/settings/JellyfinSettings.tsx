/**
 * Jellyfin settings – server URL, auth, libraries, enabled media types
 *
 * This is the primary media source. User enters server URL and either API key
 * or username/password. We blur password/API key fields. We also let them
 * load libraries and pick which to use, and which media types to include.
 */

import { useSettings } from '../../store/settingsStore';
import { getJellyfinLibraries, testJellyfinConnection } from '../../services/jellyfin';
import { useState } from 'react';
import { InfoPopup } from '../../components/InfoPopup';

export function JellyfinSettings() {
  const { settings, setSettings } = useSettings();
  const [loading, setLoading] = useState(false);
  const [libraries, setLibraries] = useState<{ id: string; name: string; type: string }[]>(
    settings.jellyfin.cachedLibraries ?? []
  );
  const [testing, setTesting] = useState(false);
  const [info, setInfo] = useState('');

  const j = settings.jellyfin;

  const loadLibraries = async () => {
    if (!j.serverUrl || !j.apiKey) {
      setInfo('Enter server URL and API key first, then click "Load libraries".');
      return;
    }
    setLoading(true);
    try {
      const list = await getJellyfinLibraries(j.serverUrl, j.apiKey, j.playbackUserId);
      // Treat unknown/empty CollectionType as supported; allow more types (e.g. "movieseries", "homevideos")
      const supportedTypes = new Set([
        'movies',
        'tvshows',
        'music',
        'books',
        'boxsets',
        'movieseries',
        'homevideos',
        'musicvideos',
      ]);
      const filtered = list.filter((lib) => {
        if (!lib.type) return true;
        const t = lib.type.toLowerCase();
        return supportedTypes.has(t);
      });
      setLibraries(filtered);
      setSettings({
        jellyfin: {
          ...j,
          cachedLibraries: filtered,
        },
      });
      if (filtered.length === 0) {
        const rawTypes = Array.from(new Set(list.map((l) => l.type || '(none)'))).join(', ');
        setInfo(
          `No supported Jellyfin libraries were returned. Collection types seen: ${rawTypes || 'none'}.`
        );
      } else {
        setInfo(`Loaded ${filtered.length} libraries from Jellyfin.`);
      }
    } catch (e) {
      console.error('FinPoster: error loading Jellyfin libraries', e);
      setInfo('There was a problem loading libraries from Jellyfin.');
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    if (!j.serverUrl || !j.apiKey) {
      setInfo('Enter server URL and API key first.');
      return;
    }
    setTesting(true);
    const ok = await testJellyfinConnection(j.serverUrl, j.apiKey);
    setTesting(false);
    if (ok) {
      setInfo('Jellyfin connection looks good.');
    } else {
      setInfo('Could not reach Jellyfin with this URL/API key.');
    }
  };

  const toggleLibrary = (id: string) => {
    setSettings({
      jellyfin: {
        ...j,
        libraryIds: j.libraryIds.includes(id)
          ? j.libraryIds.filter((x) => x !== id)
          : [...j.libraryIds, id],
      },
    });
  };

  return (
    <>
      <div className="glass-panel" style={{ padding: 24, maxWidth: 640 }}>
        <h1>Jellyfin</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
          Connect to your Jellyfin server to display movies, TV shows, music, and books.
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
          <span>Use Jellyfin as active media source</span>
          <button
            type="button"
            onClick={() =>
              setSettings({
                jellyfin: {
                  ...j,
                  enabled: !j.enabled,
                },
              })
            }
            aria-pressed={j.enabled}
            style={{
              position: 'relative',
              width: 46,
              height: 24,
              borderRadius: 999,
              border: '1px solid var(--glass-border)',
              background: j.enabled ? 'var(--accent)' : 'rgba(255,255,255,0.08)',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <span
              style={{
                position: 'absolute',
                top: 2,
                left: j.enabled ? 24 : 2,
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
          placeholder="https://jellyfin.example.com"
          value={j.serverUrl}
          onChange={(e) =>
            setSettings({ jellyfin: { ...j, serverUrl: e.target.value } })
          }
        />

        <label style={{ display: 'block', marginTop: 16, marginBottom: 8 }}>
          Authentication
        </label>
        <select
          className="input"
          value={j.authMode}
          onChange={(e) =>
            setSettings({
              jellyfin: { ...j, authMode: e.target.value as 'apikey' | 'password' },
            })
          }
        >
          <option value="apikey">API Key</option>
          <option value="password">Username / Password</option>
        </select>

        {j.authMode === 'apikey' && (
        <>
          <label style={{ display: 'block', marginTop: 16, marginBottom: 8 }}>
            API Key
          </label>
          <input
            type="password"
            className="input input-password"
            placeholder="••••••••"
            value={j.apiKey}
            onChange={(e) =>
              setSettings({ jellyfin: { ...j, apiKey: e.target.value } })
            }
          />
        </>
      )}

        <label style={{ display: 'block', marginTop: 16, marginBottom: 8 }}>
          Jellyfin user ID (for libraries)
        </label>
        <input
          type="text"
          className="input"
          placeholder="Optional – user id; blank uses Public"
          value={j.playbackUserId}
          onChange={(e) =>
            setSettings({ jellyfin: { ...j, playbackUserId: e.target.value } })
          }
        />

        {j.authMode === 'password' && (
        <>
          <label style={{ display: 'block', marginTop: 16, marginBottom: 8 }}>
            Username
          </label>
          <input
            type="text"
            className="input"
            value={j.username}
            onChange={(e) =>
              setSettings({ jellyfin: { ...j, username: e.target.value } })
            }
          />
          <label style={{ display: 'block', marginTop: 16, marginBottom: 8 }}>
            Password
          </label>
          <input
            type="password"
            className="input input-password"
            placeholder="••••••••"
            value={j.password}
            onChange={(e) =>
              setSettings({ jellyfin: { ...j, password: e.target.value } })
            }
          />
        </>
        )}

        <div style={{ marginTop: 24 }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={loadLibraries}
            disabled={loading || !j.serverUrl || !j.apiKey}
          >
            {loading ? 'Loading…' : 'Load libraries'}
          </button>
          <button
            type="button"
            className="btn"
            style={{ marginLeft: 12 }}
            onClick={testConnection}
            disabled={testing || !j.serverUrl || !j.apiKey}
          >
            {testing ? 'Testing…' : 'Test Jellyfin'}
          </button>
        </div>

        <div style={{ marginTop: 24 }}>
          <h2>Libraries</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 12 }}>
            After you click <strong>Load libraries</strong>, any supported Jellyfin libraries
            will appear here. Toggle which ones FinPoster should use.
          </p>
          {libraries.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              No libraries loaded yet. Make sure the server URL and API key are correct,
              then click <strong>Load libraries</strong>.
            </p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {libraries.map((lib) => {
                const active = j.libraryIds.includes(lib.id);
                return (
                  <li
                    key={lib.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      padding: '6px 0',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span>{lib.name}</span>
                      {lib.type && (
                        <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                          ({lib.type})
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleLibrary(lib.id)}
                      aria-pressed={active}
                      style={{
                        position: 'relative',
                        width: 46,
                        height: 24,
                        borderRadius: 999,
                        border: '1px solid var(--glass-border)',
                        background: active ? 'var(--accent)' : 'rgba(255,255,255,0.08)',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      <span
                        style={{
                          position: 'absolute',
                          top: 2,
                          left: active ? 24 : 2,
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
          )}
        </div>
      </div>
        <InfoPopup message={info} onClose={() => setInfo('')} />
      </>
  );
}
