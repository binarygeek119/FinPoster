/**
 * General settings – first stop after "click to open settings"
 *
 * This page holds global options like basic guidance and global textures
 * that shape the overall look of the signage.
 */

import { useRef, useState } from 'react';
import { useSettings } from '../../store/settingsStore';
import type { UploadCategory } from '../../types';
import { uploadFileToBackend } from '../../services/uploadClient';

export function GeneralSettings() {
  const { settings, setSettings } = useSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploads = settings.uploads;
  const textures = uploads.filter((u) => u.category === 'textures');
  const ui = settings.ui;

  const [uploading, setUploading] = useState(false);

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
        Configure your FinPoster digital signage. Start by connecting Jellyfin under
        <strong> Jellyfin</strong>, then adjust <strong>Media Showcase</strong> and
        <strong> Now Showing</strong> to your liking.
      </p>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
        Click anywhere on the display screen to return to the poster view.
      </p>

      <hr style={{ borderColor: 'var(--glass-border)', margin: '0 0 20px' }} />

      <h2>Global textures</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 12 }}>
        Optional background or overlay textures that can be used across display modes
        to give FinPoster a more customized look.
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
        {textures.map((u) => (
          <li
            key={u.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 8,
            }}
          >
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
        {uploading ? 'Uploading…' : 'Upload texture'}
      </button>

      {textures.length > 0 && (
        <>
          <h3 style={{ marginTop: 20 }}>Active texture</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 8 }}>
            Choose one texture to apply behind all display pages. Settings pages stay clean.
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
          >
            <option value="">None</option>
            {textures.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
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
          Dim strength ({ui.dimStrength})
        </label>
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
          style={{ width: '100%' }}
        />
      </div>
    </div>
  );
}
