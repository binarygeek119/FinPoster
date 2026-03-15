/**
 * General settings – first stop after "click to open settings"
 *
 * This page holds general options like basic guidance and poster texture
 * that shape the overall look of the signage.
 */

import { useRef, useState } from 'react';
import { useSettings } from '../../store/settingsStore';
import type { UploadCategory } from '../../types';
import { DEFAULT_TEXTURES } from '../../constants/defaultTextures';
import { uploadFileToBackend } from '../../services/uploadClient';
import { downloadLog } from '../../services/logger';

export function GeneralSettings() {
  const { settings, setSettings } = useSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploads = settings.uploads;
  const userTextures = uploads.filter((u) => u.category === 'textures');
  const allTextures = [...DEFAULT_TEXTURES, ...userTextures];
  const ui = settings.ui;
  const logging = settings.logging;

  const [uploading, setUploading] = useState(false);
  const [syncIntervalInput, setSyncIntervalInput] = useState(() =>
    String(ui.mediaSyncIntervalMinutes ?? 0)
  );

  const commitSyncInterval = () => {
    const num = parseInt(syncIntervalInput, 10);
    const clamped = Number.isNaN(num)
      ? 0
      : Math.max(0, Math.min(1440, num));
    setSettings({
      ui: { ...ui, mediaSyncIntervalMinutes: clamped },
    });
    setSyncIntervalInput(String(clamped));
  };

  const handleFile = async (category: UploadCategory, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    try {
      const next = [...uploads];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const { path } = await uploadFileToBackend(file);
        next.push({
          id: `upload_${Date.now()}_${i}`,
          category,
          name: file.name,
          url: path,
        });
      }
      setSettings({ uploads: next });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeTexture = (id: string) => {
    const u = uploads.find((x) => x.id === id);
    if (u?.url?.startsWith('blob:')) URL.revokeObjectURL(u.url);
    setSettings({
      uploads: uploads.filter((x) => x.id !== id),
    });
  };

  return (
    <div className="glass-panel" style={{ padding: 24, maxWidth: 720 }}>
      <h1>General</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
        Configure your FinPoster digital signage. Use <strong>Media Showcase</strong> and
        <strong> Now Showing</strong> in the settings menu to customize the display.
      </p>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
        Click anywhere on the display screen to return to the poster view.
      </p>

      <hr style={{ borderColor: 'var(--glass-border)', margin: '0 0 20px' }} />

      <h2>Media sync</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 8 }}>
        When the display has no media, it can auto-sync from your connected media server. You can
        set a schedule here; use 0 to disable automatic sync.
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <label style={{ fontSize: 14 }}>
          Sync media every
          <input
            type="number"
            min={0}
            max={1440}
            step={1}
            value={syncIntervalInput}
            onChange={(e) => setSyncIntervalInput(e.target.value)}
            onBlur={commitSyncInterval}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur();
            }}
            className="input"
            style={{ width: 72, marginLeft: 8 }}
            aria-label="Sync media interval minutes"
          />
          minutes (0 = off)
        </label>
      </div>

      <hr style={{ borderColor: 'var(--glass-border)', margin: '24px 0 20px' }} />

      <h2>Home Cinema</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 8 }}>
        Optional custom title for the Home Cinema display. Leave blank to use the current media title.
      </p>
      <input
        type="text"
        className="input"
        placeholder="e.g. Home Cinema"
        value={ui.homeCinemaTitle ?? ''}
        onChange={(e) =>
          setSettings({ ui: { ...ui, homeCinemaTitle: e.target.value.trim() || undefined } })
        }
        style={{ width: '100%', maxWidth: 400, marginBottom: 4 }}
        aria-label="Home Cinema title"
      />

      <hr style={{ borderColor: 'var(--glass-border)', margin: '24px 0 20px' }} />

      <h2>Poster texture</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 12 }}>
        Optional overlay on top of the poster display. Upload an image, pick it (or Random), then set
        <strong> overlay strength</strong>: 0 = invisible, 100 = full opacity. Use a lower value to blend the texture over the poster.
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => handleFile('textures', e)}
      />

      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {userTextures.map((u) => (
          <li
            key={u.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 8,
            }}
          >
            <img
              src={u.url}
              alt=""
              style={{
                width: 48,
                height: 48,
                objectFit: 'cover',
                borderRadius: 8,
                flexShrink: 0,
                background: 'var(--glass-border)',
              }}
            />
            <input
              type="text"
              className="input"
              style={{ flex: 1 }}
              value={u.name}
              onChange={(e) => {
                const next = uploads.map((x) =>
                  x.id === u.id ? { ...x, name: e.target.value } : x,
                );
                setSettings({ uploads: next });
              }}
            />
            <button type="button" className="btn" onClick={() => removeTexture(u.id)}>
              Remove
            </button>
          </li>
        ))}
      </ul>

      <button
        type="button"
        className="btn btn-primary"
        style={{ marginTop: 8 }}
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? 'Uploading…' : 'Upload poster texture'}
      </button>

      {allTextures.length > 0 && (
        <>
          <h3 style={{ marginTop: 20 }}>Poster texture</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 8 }}>
            Texture overlaid on the poster/card in the display.
          </p>
          <select
            className="input"
            value={ui.activeTextureId ?? ''}
            onChange={(e) =>
              setSettings({
                ui: {
                  ...ui,
                  activeTextureId: e.target.value || null,
                },
              })
            }
            aria-label="Active poster texture"
          >
            <option value="">None</option>
            <option value="random">Random</option>
            {allTextures.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          {ui.activeTextureId && (
            <div style={{ marginTop: 12 }}>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                Poster texture strength (0 = invisible, 100 = full)
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={ui.textureStrength ?? 100}
                  onChange={(e) => {
                    const v = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                    setSettings((prev) => ({
                      ui: { ...prev.ui, textureStrength: v },
                    }));
                  }}
                  style={{ flex: 1, accentColor: 'var(--accent)' }}
                />
                <input
                  type="number"
                  className="input"
                  min={0}
                  max={100}
                  step={1}
                  value={ui.textureStrength ?? 100}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    if (!Number.isNaN(v)) {
                      const clamped = Math.max(0, Math.min(100, v));
                      setSettings((prev) => ({
                        ui: { ...prev.ui, textureStrength: clamped },
                      }));
                    }
                  }}
                  style={{ width: 64, textAlign: 'center' }}
                  aria-label="Poster overlay strength"
                />
              </div>
            </div>
          )}

          <h3 style={{ marginTop: 24 }}>Background texture</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 8 }}>
            Texture overlaid on the full-screen background (independent of poster).
          </p>
          <select
            className="input"
            value={ui.activeBackgroundTextureId ?? ''}
            onChange={(e) =>
              setSettings({
                ui: {
                  ...ui,
                  activeBackgroundTextureId: e.target.value || null,
                },
              })
            }
            aria-label="Active background texture"
          >
            <option value="">None</option>
            <option value="random">Random</option>
            {allTextures.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          {ui.activeBackgroundTextureId && (
            <div style={{ marginTop: 12 }}>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                Background texture strength (0 = invisible, 100 = full)
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={ui.backgroundTextureStrength ?? 100}
                  onChange={(e) => {
                    const v = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                    setSettings((prev) => ({
                      ui: { ...prev.ui, backgroundTextureStrength: v },
                    }));
                  }}
                  style={{ flex: 1, accentColor: 'var(--accent)' }}
                />
                <input
                  type="number"
                  className="input"
                  min={0}
                  max={100}
                  step={1}
                  value={ui.backgroundTextureStrength ?? 100}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    if (!Number.isNaN(v)) {
                      const clamped = Math.max(0, Math.min(100, v));
                      setSettings((prev) => ({
                        ui: { ...prev.ui, backgroundTextureStrength: clamped },
                      }));
                    }
                  }}
                  style={{ width: 64, textAlign: 'center' }}
                  aria-label="Background texture strength"
                />
              </div>
            </div>
          )}
        </>
      )}

      <h2 style={{ marginTop: 24 }}>Display dimming</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 8 }}>
        Dim the signage displays slightly while keeping settings pages bright and easy to read.
      </p>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 8,
        }}
      >
        <span>Dim display pages</span>
        <button
          type="button"
          onClick={() =>
            setSettings({
              ui: {
                ...ui,
                dimDisplays: !ui.dimDisplays,
              },
            })
          }
          aria-pressed={ui.dimDisplays}
          style={{
            position: 'relative',
            width: 46,
            height: 24,
            borderRadius: 999,
            border: '1px solid var(--glass-border)',
            background: ui.dimDisplays ? 'var(--accent)' : 'rgba(255,255,255,0.08)',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: 2,
              left: ui.dimDisplays ? 24 : 2,
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
      <div style={{ marginTop: 8 }}>
        <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
          Dim strength
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <input
            type="range"
            min={0}
            max={100}
            value={ui.dimStrength}
            onChange={(e) =>
              setSettings({
                ui: {
                  ...ui,
                  dimStrength: Math.max(0, Math.min(100, Number(e.target.value) || 0)),
                },
              })
            }
            style={{ flex: 1, accentColor: 'var(--accent)' }}
          />
          <input
            type="number"
            className="input"
            min={0}
            max={100}
            step={1}
            value={ui.dimStrength}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (!Number.isNaN(v)) {
                setSettings({
                  ui: {
                    ...ui,
                    dimStrength: Math.max(0, Math.min(100, v)),
                  },
                });
              }
            }}
            style={{ width: 64, textAlign: 'center' }}
            aria-label="Dim strength"
          />
        </div>
      </div>

      <h2 style={{ marginTop: 24 }}>Logging</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 12 }}>
        Control where logs go and whether API keys and server URLs are redacted.
      </p>
      {[
        { key: 'logToConsole' as const, label: 'Log to console' },
        { key: 'logToFile' as const, label: 'Log to file (in-memory buffer)' },
        { key: 'redact' as const, label: 'Redact API keys and server URLs in console and log' },
        { key: 'debug' as const, label: 'Debug (extra logs; log file rolls every 6 hours)' },
      ].map(({ key, label }) => (
        <div
          key={key}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: 8,
          }}
        >
          <span>{label}</span>
          <button
            type="button"
            onClick={() =>
              setSettings({
                logging: {
                  ...logging,
                  [key]: !logging[key],
                },
              })
            }
            aria-pressed={logging[key]}
            style={{
              position: 'relative',
              width: 46,
              height: 24,
              borderRadius: 999,
              border: '1px solid var(--glass-border)',
              background: logging[key] ? 'var(--accent)' : 'rgba(255,255,255,0.08)',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <span
              style={{
                position: 'absolute',
                top: 2,
                left: logging[key] ? 24 : 2,
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
      ))}
      <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        <button type="button" className="btn" onClick={() => downloadLog(false)}>
          Download log
        </button>
        <button type="button" className="btn" onClick={() => downloadLog(true)}>
          Download log (with redactions)
        </button>
      </div>
    </div>
  );
}
