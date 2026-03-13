/**
 * Upload settings – textures and ads; display uploaded files and allow uploads
 *
 * User can upload files for textures and ads. In a browser-only app we store
 * them as object URLs (or base64) in settings; a future backend could replace
 * this with real file storage. We clearly separate uploads by type and allow
 * file input. Same glass styling.
 */

import { useRef } from 'react';
import { useSettings } from '../../store/settingsStore';
import type { UploadCategory } from '../../types';

export function UploadSettings() {
  const { settings, setSettings } = useSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploads = settings.uploads;
  const textures = uploads.filter((u) => u.category === 'textures');
  const ads = uploads.filter((u) => u.category === 'ads');

  const handleFile = (category: UploadCategory, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    const next = [...uploads];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const url = URL.createObjectURL(file);
      next.push({
        id: `upload_${Date.now()}_${i}`,
        category,
        name: file.name,
        url,
        ...(category === 'ads' ? { label: file.name.replace(/\.[^.]+$/, '') } : {}),
      });
    }
    setSettings({ uploads: next });
    e.target.value = '';
  };

  const removeUpload = (id: string) => {
    const u = uploads.find((x) => x.id === id);
    if (u?.url?.startsWith('blob:')) URL.revokeObjectURL(u.url);
    setSettings({
      uploads: uploads.filter((x) => x.id !== id),
    });
  };

  return (
    <div className="glass-panel" style={{ padding: 24, maxWidth: 640 }}>
      <h1>Uploads</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
        Upload textures and ads. Ads will appear in the Ads display mode when enabled.
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => {
          const cat = (e.target.dataset.category as UploadCategory) || 'ads';
          handleFile(cat, e);
        }}
        data-category="ads"
      />

      <h2>Textures</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 12 }}>
        Optional background or overlay textures (for future use).
      </p>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {textures.map((u) => (
          <li key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span>{u.name}</span>
            <button type="button" className="btn" onClick={() => removeUpload(u.id)}>Remove</button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="btn btn-primary"
        style={{ marginTop: 8 }}
        onClick={() => {
          const input = fileInputRef.current;
          if (input) {
            input.dataset.category = 'textures';
            input.click();
          }
        }}
      >
        Upload texture
      </button>

      <h2 style={{ marginTop: 24 }}>Ads</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 12 }}>
        Images shown in the Ads display mode. Enable and configure under Ads settings.
      </p>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {ads.map((u) => (
          <li key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span>{u.name}</span>
            {u.label && <span style={{ color: 'var(--text-muted)' }}>({u.label})</span>}
            <button type="button" className="btn" onClick={() => removeUpload(u.id)}>Remove</button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="btn btn-primary"
        style={{ marginTop: 8 }}
        onClick={() => {
          const input = fileInputRef.current;
          if (input) {
            input.dataset.category = 'ads';
            input.click();
          }
        }}
      >
        Upload ad
      </button>
    </div>
  );
}
