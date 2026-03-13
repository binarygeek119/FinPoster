/**
 * Now Showing settings – showtime generation, manual IDs, theater count, source mode
 *
 * Controls how the "theater showtime board" is built: manual TMDb/TheTVDB IDs,
 * or random from server libraries; theater count; showtime generation (manual list
 * or random). Same glass styling as other settings.
 */

import { useSettings } from '../../store/settingsStore';
import type { MediaType } from '../../types';

const MEDIA_TYPES: MediaType[] = ['Movie', 'Series', 'Music', 'Book'];

export function NowShowingSettings() {
  const { settings, setSettings } = useSettings();
  const n = settings.nowShowing;

  const addTmdbId = () => {
    const next = prompt('Enter TMDb movie or TV ID:');
    if (next) setSettings({ nowShowing: { ...n, manualTmdbIds: [...n.manualTmdbIds, next.trim()] } });
  };
  const removeTmdbId = (idx: number) => {
    setSettings({
      nowShowing: {
        ...n,
        manualTmdbIds: n.manualTmdbIds.filter((_, i) => i !== idx),
      },
    });
  };

  const addTvdbId = () => {
    const next = prompt('Enter TheTVDB series ID:');
    if (next) setSettings({ nowShowing: { ...n, manualTvdbIds: [...n.manualTvdbIds, next.trim()] } });
  };
  const removeTvdbId = (idx: number) => {
    setSettings({
      nowShowing: {
        ...n,
        manualTvdbIds: n.manualTvdbIds.filter((_, i) => i !== idx),
      },
    });
  };

  return (
    <div className="glass-panel" style={{ padding: 24, maxWidth: 640 }}>
      <h1>Now Showing</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
        Configure the theater showtime board: where entries come from and how showtimes are generated.
      </p>

      <h2>Source mode</h2>
      <select
        className="input"
        value={n.sourceMode}
        onChange={(e) =>
          setSettings({
            nowShowing: { ...n, sourceMode: e.target.value as 'manual' | 'random' },
          })
        }
      >
        <option value="manual">Manual IDs only</option>
        <option value="random">Random from server libraries</option>
      </select>

      <h2 style={{ marginTop: 24 }}>Manual TMDb IDs</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 8 }}>
        Add movie or TV show IDs from themoviedb.org for showtime entries.
      </p>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {n.manualTmdbIds.map((id, idx) => (
          <li key={id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span>{id}</span>
            <button type="button" className="btn" onClick={() => removeTmdbId(idx)}>
              Remove
            </button>
          </li>
        ))}
      </ul>
      <button type="button" className="btn btn-primary" onClick={addTmdbId} style={{ marginTop: 8 }}>
        Add TMDb ID
      </button>

      <h2 style={{ marginTop: 24 }}>Manual TheTVDB IDs</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 8 }}>
        Add series IDs from thetvdb.com for showtime entries.
      </p>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {n.manualTvdbIds.map((id, idx) => (
          <li key={id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span>{id}</span>
            <button type="button" className="btn" onClick={() => removeTvdbId(idx)}>
              Remove
            </button>
          </li>
        ))}
      </ul>
      <button type="button" className="btn btn-primary" onClick={addTvdbId} style={{ marginTop: 8 }}>
        Add TheTVDB ID
      </button>

      <label style={{ display: 'block', marginTop: 24, marginBottom: 8 }}>
        Media type for entries
      </label>
      <select
        className="input"
        value={n.mediaTypeForEntries}
        onChange={(e) =>
          setSettings({
            nowShowing: { ...n, mediaTypeForEntries: e.target.value as MediaType },
          })
        }
      >
        {MEDIA_TYPES.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>

      <label style={{ display: 'block', marginTop: 16, marginBottom: 8 }}>
        Theater count (number of showtime rows)
      </label>
      <input
        type="number"
        className="input"
        min={1}
        max={20}
        value={n.theaterCount}
        onChange={(e) =>
          setSettings({
            nowShowing: {
              ...n,
              theaterCount: Math.max(1, parseInt(e.target.value, 10) || 4),
            },
          })
        }
      />

      <label style={{ display: 'block', marginTop: 16, marginBottom: 8 }}>
        Showtime generation
      </label>
      <select
        className="input"
        value={n.showtimeMode}
        onChange={(e) =>
          setSettings({
            nowShowing: { ...n, showtimeMode: e.target.value as 'manual' | 'random' },
          })
        }
      >
        <option value="manual">Use manual showtimes</option>
        <option value="random">Generate random showtimes</option>
      </select>
    </div>
  );
}
