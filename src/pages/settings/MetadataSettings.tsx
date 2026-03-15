/**
 * Metadata settings – TMDb, TheTVDB, Google Books, Comic Vine API keys for fallback lookups
 *
 * When Jellyfin (or primary source) is missing poster, backdrop, tagline, etc.,
 * we try TMDb then TheTVDB. User must enter their own API keys here. We blur
 * the fields. Service logos can be shown beside fields (we use text labels for now).
 */

import { useEffect, useState } from 'react';
import { useSettings } from '../../store/settingsStore';
import {
  testTmdbApiKey,
  testGoogleBooksApiKey,
  testComicVineApiKey,
  testTvdbApiKey,
  testMusicBrainzApiKey,
} from '../../services/metadataFallback';
export function MetadataSettings() {
  const { settings, setSettings } = useSettings();
  const m = settings.metadata;
  const [toasts, setToasts] = useState<string[]>([]);

  const pushToast = (msg: string) => {
    setToasts((prev) => [...prev, msg]);
  };

  // Automatically clear the toast stack a few seconds after the last message.
  useEffect(() => {
    if (toasts.length === 0) return;
    const id = setTimeout(() => {
      setToasts([]);
    }, 5000);
    return () => clearTimeout(id);
  }, [toasts]);

  const handleTestKeys = async () => {
    setToasts([]);

    if (m.tmdbApiKey) {
      const ok = await testTmdbApiKey(m.tmdbApiKey);
      pushToast(`TMDb: ${ok ? 'OK' : 'failed'}`);
    } else {
      pushToast('TMDb: no key set');
    }

    if (m.tvdbApiKey) {
      const ok = await testTvdbApiKey(m.tvdbApiKey);
      pushToast(`TheTVDB: ${ok ? 'OK' : 'failed'}`);
    } else {
      pushToast('TheTVDB: no key set');
    }

    if (m.googleBooksApiKey) {
      const ok = await testGoogleBooksApiKey(m.googleBooksApiKey);
      pushToast(`Google Books: ${ok ? 'OK' : 'failed'}`);
    } else {
      pushToast('Google Books: no key set (optional)');
    }

    if (m.comicVineApiKey) {
      const ok = await testComicVineApiKey(m.comicVineApiKey);
      pushToast(`Comic Vine: ${ok ? 'OK' : 'failed'}`);
    } else {
      pushToast('Comic Vine: no key set');
    }

    const mbOk = await testMusicBrainzApiKey({
      clientId: m.musicBrainzClientId,
      clientSecret: m.musicBrainzClientSecret,
    });
    pushToast(`MusicBrainz: ${mbOk ? 'OK' : 'failed'}`);
  };

  return (
    <>
      <div className="glass-panel" style={{ padding: 24, maxWidth: 640 }}>
        <h1>Metadata</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
        API keys for metadata fallback. When artwork or metadata is missing from
        the primary source, FinPoster will try TMDb, TheTVDB, Google Books, Comic Vine,
        and MusicBrainz (where applicable) to recover it.
      </p>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 24,
        }}
      >
        <span>Use metadata as source</span>
        <button
          type="button"
          onClick={() =>
            setSettings({
              metadata: { ...m, metadataAsSource: !m.metadataAsSource },
            })
          }
          aria-pressed={m.metadataAsSource}
          style={{
            position: 'relative',
            width: 46,
            height: 24,
            borderRadius: 999,
            border: '1px solid var(--glass-border)',
            background: m.metadataAsSource
              ? 'var(--accent)'
              : 'rgba(255,255,255,0.08)',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: 2,
              left: m.metadataAsSource ? 24 : 2,
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
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: -16, marginBottom: 24 }}>
        When on, missing posters and metadata are filled from TMDb, TheTVDB, Google Books, Comic Vine, and MusicBrainz when keys are set.
      </p>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
        <img
          src="/logos/tmdb.png"
          alt="TMDb"
          style={{ height: 90, width: 'auto', objectFit: 'contain', flexShrink: 0 }}
        />
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <input
            type="password"
            className="input input-password"
            placeholder="••••••••"
            value={m.tmdbApiKey}
            onChange={(e) =>
              setSettings({ metadata: { ...m, tmdbApiKey: e.target.value } })
            }
            style={{ width: '100%' }}
          />
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
            Get a key at themoviedb.org (free).
          </p>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
          marginTop: 16,
          marginBottom: 8,
        }}
      >
        <img
          src="/logos/thetvdb.png"
          alt="TheTVDB"
          style={{ height: 90, width: 'auto', objectFit: 'contain', flexShrink: 0 }}
        />
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <input
            type="password"
            className="input input-password"
            placeholder="••••••••"
            value={m.tvdbApiKey}
            onChange={(e) =>
              setSettings({ metadata: { ...m, tvdbApiKey: e.target.value } })
            }
            style={{ width: '100%' }}
          />
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
            Get a key at thetvdb.com (free).
          </p>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
          marginTop: 16,
          marginBottom: 8,
        }}
      >
        <img
          src="/logos/googlebooks.png"
          alt="Google Books"
          style={{ height: 48, width: 'auto', objectFit: 'contain', flexShrink: 0 }}
        />
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <input
            type="password"
            className="input input-password"
            placeholder="••••••••"
            value={m.googleBooksApiKey}
            onChange={(e) =>
              setSettings({ metadata: { ...m, googleBooksApiKey: e.target.value } })
            }
            style={{ width: '100%' }}
          />
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
            Optional – get a key at console.cloud.google.com (Google Books API).
          </p>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
          marginTop: 16,
          marginBottom: 8,
        }}
      >
        <img
          src="/logos/comicvine.png"
          alt="Comic Vine"
          style={{ height: 90, width: 'auto', objectFit: 'contain', flexShrink: 0 }}
        />
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <input
            type="password"
            className="input input-password"
            placeholder="••••••••"
            value={m.comicVineApiKey}
            onChange={(e) =>
              setSettings({ metadata: { ...m, comicVineApiKey: e.target.value } })
            }
            style={{ width: '100%' }}
          />
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
            Get a key at comicvine.gamespot.com/api.
          </p>
        </div>
      </div>

      <div style={{ marginTop: 16, marginBottom: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 2 }}>
          <img
            src="/logos/musicbrainz.png"
            alt="MusicBrainz"
            style={{ height: 180, width: 180, objectFit: 'contain', flexShrink: 0 }}
          />
        </div>
        <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 8,
        }}
      >
        <span style={{ width: 90, fontSize: 13, color: 'var(--text-muted)' }}>OAuth Client ID</span>
        <input
          type="password"
          className="input input-password"
          placeholder="••••••••"
          value={m.musicBrainzClientId}
          onChange={(e) =>
            setSettings({ metadata: { ...m, musicBrainzClientId: e.target.value } })
          }
          style={{ flex: 1, minWidth: 0 }}
        />
      </label>
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 8,
        }}
      >
        <span style={{ width: 90, fontSize: 13, color: 'var(--text-muted)' }}>OAuth Client Secret</span>
        <input
          type="password"
          className="input input-password"
          placeholder="••••••••"
          value={m.musicBrainzClientSecret}
          onChange={(e) =>
            setSettings({ metadata: { ...m, musicBrainzClientSecret: e.target.value } })
          }
          style={{ flex: 1, minWidth: 0 }}
        />
      </label>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
        From musicbrainz.org/account/applications. Client ID is used in User-Agent; secret kept for future OAuth flows.
      </p>

        <div style={{ marginTop: 20 }}>
          <button type="button" className="btn" onClick={handleTestKeys}>
            Test API keys
          </button>
        </div>
      </div>
      </div>
      {/* Toast stack in bottom-right; each API emits its own line and they stack upward */}
      {toasts.length > 0 && (
        <div
          style={{
            position: 'fixed',
            right: 24,
            bottom: 24,
            display: 'flex',
            flexDirection: 'column-reverse',
            gap: 8,
            zIndex: 60,
          }}
        >
          {toasts.map((msg, index) => (
            <div
              key={`${msg}-${index}`}
              className="glass-panel"
              style={{
                padding: '8px 12px',
                maxWidth: 360,
                fontSize: 13,
                color: 'var(--text-secondary)',
              }}
            >
              {msg}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
