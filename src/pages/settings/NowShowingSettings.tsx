/**
 * Now Showing settings – showtime generation, manual IDs, theater count, source mode
 *
 * Controls how the "theater showtime board" is built: manual TMDb/TheTVDB IDs,
 * or random from server libraries; theater count; showtime generation (manual list
 * or random). Same glass styling as other settings.
 */

import { useState } from 'react';
import { useSettings } from '../../store/settingsStore';
import type { MediaType } from '../../types';

const MEDIA_TYPES: MediaType[] = ['Movie', 'Series', 'Music', 'Book'];

export function NowShowingSettings() {
  const { settings, setSettings } = useSettings();
  const n = settings.nowShowing;

  const [newTmdbId, setNewTmdbId] = useState('');
  const [newTvdbId, setNewTvdbId] = useState('');

  const addTmdbId = () => {
    const trimmed = newTmdbId.trim();
    if (!trimmed) return;
    setSettings({
      nowShowing: {
        ...n,
        manualTmdbIds: [...n.manualTmdbIds, trimmed],
      },
    });
    setNewTmdbId('');
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
    const trimmed = newTvdbId.trim();
    if (!trimmed) return;
    setSettings({
      nowShowing: {
        ...n,
        manualTvdbIds: [...n.manualTvdbIds, trimmed],
      },
    });
    setNewTvdbId('');
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

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 12,
        }}
      >
        <span>Enable Now Showing board</span>
        <button
          type="button"
          onClick={() =>
            setSettings({
              nowShowing: { ...n, enabled: !n.enabled },
            })
          }
          aria-pressed={n.enabled}
          style={{
            position: 'relative',
            width: 46,
            height: 24,
            borderRadius: 999,
            border: '1px solid var(--glass-border)',
            background: n.enabled ? 'var(--accent)' : 'rgba(255,255,255,0.08)',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: 2,
              left: n.enabled ? 24 : 2,
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
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <input
          type="text"
          className="input"
          placeholder="TMDb ID (e.g. 603)"
          value={newTmdbId}
          onChange={(e) => setNewTmdbId(e.target.value)}
        />
        <button type="button" className="btn btn-primary" onClick={addTmdbId}>
          Add
        </button>
      </div>

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
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <input
          type="text"
          className="input"
          placeholder="TheTVDB ID"
          value={newTvdbId}
          onChange={(e) => setNewTvdbId(e.target.value)}
        />
        <button type="button" className="btn btn-primary" onClick={addTvdbId}>
          Add
        </button>
      </div>

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
