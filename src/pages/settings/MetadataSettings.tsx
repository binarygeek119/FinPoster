/**
 * Metadata settings – TMDb and TheTVDB API keys for fallback lookups
 *
 * When Jellyfin (or primary source) is missing poster, backdrop, tagline, etc.,
 * we try TMDb then TheTVDB. User must enter their own API keys here. We blur
 * the fields. Service logos can be shown beside fields (we use text labels for now).
 */

import { useSettings } from '../../store/settingsStore';

export function MetadataSettings() {
  const { settings, setSettings } = useSettings();
  const m = settings.metadata;

  return (
    <div className="glass-panel" style={{ padding: 24, maxWidth: 640 }}>
      <h1>Metadata</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
        API keys for metadata fallback. When artwork or metadata is missing from
        the primary source, FinPoster will try TMDb and TheTVDB to recover it.
      </p>

      <label style={{ display: 'block', marginBottom: 8 }}>
        TMDb API key
      </label>
      <input
        type="password"
        className="input input-password"
        placeholder="••••••••"
        value={m.tmdbApiKey}
        onChange={(e) =>
          setSettings({ metadata: { ...m, tmdbApiKey: e.target.value } })
        }
      />
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
        Get a key at themoviedb.org (free).
      </p>

      <label style={{ display: 'block', marginTop: 16, marginBottom: 8 }}>
        TheTVDB API key
      </label>
      <input
        type="password"
        className="input input-password"
        placeholder="••••••••"
        value={m.tvdbApiKey}
        onChange={(e) =>
          setSettings({ metadata: { ...m, tvdbApiKey: e.target.value } })
        }
      />
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
        Get a key at thetvdb.com (free).
      </p>
    </div>
  );
}
