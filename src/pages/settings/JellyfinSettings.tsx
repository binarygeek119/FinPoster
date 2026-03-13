/**
 * Jellyfin settings – server URL, auth, libraries, enabled media types
 *
 * This is the primary media source. User enters server URL and either API key
 * or username/password. We blur password/API key fields. We also let them
 * load libraries and pick which to use, and which media types to include.
 */

import { useSettings } from '../../store/settingsStore';
import { getJellyfinLibraries } from '../../services/jellyfin';
import { useState } from 'react';
import type { MediaType } from '../../types';
const MEDIA_TYPES: MediaType[] = ['Movie', 'Series', 'Music', 'Book'];

export function JellyfinSettings() {
  const { settings, setSettings } = useSettings();
  const [loading, setLoading] = useState(false);
  const [libraries, setLibraries] = useState<{ id: string; name: string; type: string }[]>([]);

  const j = settings.jellyfin;

  const loadLibraries = async () => {
    if (!j.serverUrl || !j.apiKey) return;
    setLoading(true);
    const list = await getJellyfinLibraries(j.serverUrl, j.apiKey);
    setLibraries(list);
    setLoading(false);
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

  const toggleMediaType = (type: MediaType) => {
    setSettings({
      jellyfin: {
        ...j,
        enabledMediaTypes: j.enabledMediaTypes.includes(type)
          ? j.enabledMediaTypes.filter((t) => t !== type)
          : [...j.enabledMediaTypes, type],
      },
    });
  };

  return (
    <div className="glass-panel" style={{ padding: 24, maxWidth: 640 }}>
      <h1>Jellyfin</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
        Connect to your Jellyfin server to display movies, TV shows, music, and books.
      </p>

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

      <label style={{ display: 'block', marginTop: 16, marginBottom: 8 }}>
        Playback user/device (for “now playing” detection)
      </label>
      <input
        type="text"
        className="input"
        placeholder="User or device ID"
        value={j.playbackUserId}
        onChange={(e) =>
          setSettings({ jellyfin: { ...j, playbackUserId: e.target.value } })
        }
      />

      <div style={{ marginTop: 24 }}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={loadLibraries}
          disabled={loading || !j.serverUrl || !j.apiKey}
        >
          {loading ? 'Loading…' : 'Load libraries'}
        </button>
      </div>

      {libraries.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h2>Libraries</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 12 }}>
            Select which libraries to use for Media Showcase and Now Showing.
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {libraries.map((lib) => (
              <li key={lib.id} style={{ marginBottom: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={j.libraryIds.includes(lib.id)}
                    onChange={() => toggleLibrary(lib.id)}
                  />
                  {lib.name} <span style={{ color: 'var(--text-muted)' }}>({lib.type})</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ marginTop: 24 }}>
        <h2>Media types</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 12 }}>
          Which types to include from selected libraries.
        </p>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {MEDIA_TYPES.map((type) => (
            <li key={type} style={{ marginBottom: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={j.enabledMediaTypes.includes(type)}
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
