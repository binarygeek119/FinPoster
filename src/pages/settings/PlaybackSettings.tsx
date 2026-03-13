/**
 * Playback settings – global playback-related options
 *
 * Central place for settings that control how FinPoster reacts to currently
 * playing media. Right now this focuses on Jellyfin playback users/devices,
 * but the section can grow to include Plex/Emby in the future.
 */

import { useState } from 'react';
import { useSettings } from '../../store/settingsStore';

export function PlaybackSettings() {
  const { settings, setSettings } = useSettings();
  const j = settings.jellyfin;
  const [input, setInput] = useState('');
  const list = j.playbackWatchIds ?? [];

  const addWatcher = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    if (list.includes(trimmed)) {
      setInput('');
      return;
    }
    setSettings({
      jellyfin: {
        ...j,
        playbackWatchIds: [...list, trimmed],
      },
    });
    setInput('');
  };

  const removeWatcher = (value: string) => {
    setSettings({
      jellyfin: {
        ...j,
        playbackWatchIds: list.filter((v) => v !== value),
      },
    });
  };

  const [tab, setTab] = useState<'main' | 'customize'>('main');
  const tabStyle = (active: boolean) => ({
    padding: '8px 16px',
    border: 'none',
    borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
    background: 'transparent',
    color: active ? 'var(--text-primary)' : 'var(--text-muted)',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 500,
  });

  return (
    <div className="glass-panel" style={{ padding: 24, maxWidth: 720 }}>
      <h1>Playback</h1>
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--glass-border)' }}>
        <button type="button" style={tabStyle(tab === 'main')} onClick={() => setTab('main')}>
          Settings
        </button>
        <button type="button" style={tabStyle(tab === 'customize')} onClick={() => setTab('customize')}>
          Customize
        </button>
      </div>

      {tab === 'main' && (
        <>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
        Configure which Jellyfin users/devices FinPoster should watch for playback.
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
        <span>Enable playback features</span>
        <button
          type="button"
          onClick={() =>
            setSettings({
              jellyfin: {
                ...j,
                playbackEnabled: !j.playbackEnabled,
              },
            })
          }
          aria-pressed={j.playbackEnabled}
          style={{
            position: 'relative',
            width: 46,
            height: 24,
            borderRadius: 999,
            border: '1px solid var(--glass-border)',
            background: j.playbackEnabled ? 'var(--accent)' : 'rgba(255,255,255,0.08)',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: 2,
              left: j.playbackEnabled ? 24 : 2,
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

      <div
        style={{
          marginTop: 16,
          padding: 16,
          borderRadius: 12,
          border: '1px solid var(--glass-border)',
          background: 'rgba(0,0,0,0.25)',
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: 4, fontSize: 14 }}>
          Playback watchers
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 8 }}>
          User or device IDs to include when checking what is currently playing.
          Useful if multiple devices should trigger playback overlays.
        </p>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {list.map((id) => (
            <li
              key={id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 4,
              }}
            >
              <span style={{ fontSize: 13 }}>{id}</span>
              <button type="button" className="btn" onClick={() => removeWatcher(id)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <input
            type="text"
            className="input"
            placeholder="Extra user or device ID"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="button" className="btn btn-primary" onClick={addWatcher}>
            Add
          </button>
        </div>
      </div>
        </>
      )}

      {tab === 'customize' && (
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          Future playback overlay and behavior customization options will appear here.
        </p>
      )}
    </div>
  );
}

