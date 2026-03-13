/**
 * Ads settings – enable/disable ads, upload ads, metadata, duration, frequency
 *
 * Controls when and how uploaded ads are shown: upload images, enable/disable,
 * which ads are active, how long each ad displays, and how many poster
 * rotations happen before we show an ad block. Same glass styling.
 */

import type React from 'react';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../../store/settingsStore';
import { uploadFileToBackend } from '../../services/uploadClient';

export function AdsSettings() {
  const { settings, setSettings } = useSettings();
  const navigate = useNavigate();
  const a = settings.ads;
  const adUploads = settings.uploads.filter((u) => u.category === 'ads');

  const fileInputRef = useRef<HTMLInputElement>(null);
   const [uploading, setUploading] = useState(false);

  const removeAd = (id: string) => {
    const remainingUploads = settings.uploads.filter((u) => u.id !== id);
    const remainingEnabled = a.enabledAdIds.filter((x) => x !== id);
    setSettings({
      uploads: remainingUploads,
      ads: {
        ...a,
        enabledAdIds: remainingEnabled,
      },
    });
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    try {
      const next = [...settings.uploads];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const { path } = await uploadFileToBackend(file);
        next.push({
          id: `upload_${Date.now()}_${i}`,
          category: 'ads' as const,
          name: file.name,
          url: path,
          label: file.name.replace(/\.[^.]+$/, ''),
        });
      }
      setSettings({ uploads: next });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const toggleAd = (id: string) => {
    setSettings({
      ads: {
        ...a,
        enabledAdIds: a.enabledAdIds.includes(id)
          ? a.enabledAdIds.filter((x) => x !== id)
          : [...a.enabledAdIds, id],
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
    <div className="glass-panel" style={{ padding: 24, maxWidth: 640 }}>
      <h1>Ads</h1>
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
        Show uploaded advertisement images between poster rotations. You can upload and configure ads here.
      </p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          Quickly preview how ads look on the main display.
        </span>
        <button
          type="button"
          className="btn"
          onClick={() => navigate('/?mode=ads')}
        >
          Test ads on display
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 4,
        }}
      >
        <span>Enable ads</span>
        <button
          type="button"
          onClick={() =>
            setSettings({ ads: { ...a, enabled: !a.enabled } })
          }
          aria-pressed={a.enabled}
          style={{
            position: 'relative',
            width: 46,
            height: 24,
            borderRadius: 999,
            border: '1px solid var(--glass-border)',
            background: a.enabled ? 'var(--accent)' : 'rgba(255,255,255,0.08)',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: 2,
              left: a.enabled ? 24 : 2,
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

      <label style={{ display: 'block', marginTop: 16, marginBottom: 8 }}>
        Ad display duration (seconds per ad)
      </label>
      <input
        type="number"
        className="input"
        min={3}
        max={60}
        value={a.adDisplaySeconds}
        onChange={(e) =>
          setSettings({
            ads: {
              ...a,
              adDisplaySeconds: Math.max(3, parseInt(e.target.value, 10) || 10),
            },
          })
        }
      />

      <label style={{ display: 'block', marginTop: 16, marginBottom: 8 }}>
        Show ads after this many poster rotations
      </label>
      <input
        type="number"
        className="input"
        min={1}
        max={50}
        value={a.insertionIntervalPosters}
        onChange={(e) =>
          setSettings({
            ads: {
              ...a,
              insertionIntervalPosters: Math.max(1, parseInt(e.target.value, 10) || 5),
            },
          })
        }
      />

      <div style={{ marginTop: 24 }}>
        <h2>Uploaded ads</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 12 }}>
          Toggle which ads are shown and edit their display metadata.
          If none are selected, all uploaded ads are used.
        </p>
        {adUploads.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No ads uploaded yet. Add some under Uploads.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {adUploads.map((u) => (
              <li
                key={u.id}
                style={{
                  marginBottom: 10,
                  padding: 10,
                  borderRadius: 10,
                  border: '1px solid var(--glass-border)',
                  background: 'rgba(0,0,0,0.25)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    type="checkbox"
                    checked={a.enabledAdIds.length === 0 || a.enabledAdIds.includes(u.id)}
                    onChange={() => toggleAd(u.id)}
                  />
                  <img
                    src={u.url}
                    alt={u.label || u.name}
                    style={{
                      width: 64,
                      height: 40,
                      objectFit: 'cover',
                      borderRadius: 4,
                      border: '1px solid var(--glass-border)',
                      boxShadow: '0 0 10px rgba(0,0,0,0.5)',
                    }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: 13 }}>{u.name}</span>
                    {u.label && (
                      <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                        {u.label}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="btn"
                    style={{ marginLeft: 'auto' }}
                    onClick={() => removeAd(u.id)}
                  >
                    Remove
                  </button>
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginLeft: 26 }}>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Display label</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Short label to show over the ad"
                    value={u.label ?? ''}
                    onChange={(e) => {
                      const next = settings.uploads.map((x) =>
                        x.id === u.id ? { ...x, label: e.target.value } : x,
                      );
                      setSettings({ uploads: next });
                    }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginLeft: 26 }}>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Description / notes
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Optional description or notes for this ad"
                    value={u.description ?? ''}
                    onChange={(e) => {
                      const next = settings.uploads.map((x) =>
                        x.id === u.id ? { ...x, description: e.target.value } : x,
                      );
                      setSettings({ uploads: next });
                    }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginLeft: 26 }}>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Price lines
                  </label>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                    Add multiple label + price rows (for example: Small / $5, Combo / $9.99).
                  </p>
                  {(u.prices ?? []).map((line, idx) => (
                    <div
                      key={idx}
                      style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4 }}
                    >
                      <input
                        type="text"
                        className="input"
                        placeholder="Label"
                        style={{ flex: 1 }}
                        value={line.label}
                        onChange={(e) => {
                          const prices = [...(u.prices ?? [])];
                          prices[idx] = { ...prices[idx], label: e.target.value };
                          const next = settings.uploads.map((x) =>
                            x.id === u.id ? { ...x, prices } : x,
                          );
                          setSettings({ uploads: next });
                        }}
                      />
                      <input
                        type="text"
                        className="input"
                        placeholder="Price"
                        style={{ width: 100 }}
                        value={line.price}
                        onChange={(e) => {
                          const prices = [...(u.prices ?? [])];
                          prices[idx] = { ...prices[idx], price: e.target.value };
                          const next = settings.uploads.map((x) =>
                            x.id === u.id ? { ...x, prices } : x,
                          );
                          setSettings({ uploads: next });
                        }}
                      />
                      <button
                        type="button"
                        className="btn"
                        onClick={() => {
                          const prices = (u.prices ?? []).filter((_, i) => i !== idx);
                          const next = settings.uploads.map((x) =>
                            x.id === u.id ? { ...x, prices } : x,
                          );
                          setSettings({ uploads: next });
                        }}
                      >
                        X
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="btn"
                    style={{ marginTop: 6, alignSelf: 'flex-start' }}
                    onClick={() => {
                      const prices = [...(u.prices ?? []), { label: '', price: '' }];
                      const next = settings.uploads.map((x) =>
                        x.id === u.id ? { ...x, prices } : x,
                      );
                      setSettings({ uploads: next });
                    }}
                  >
                    Add price line
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={handleFile}
      />
      <button
        type="button"
        className="btn btn-primary"
        style={{ marginTop: 16 }}
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? 'Uploading…' : 'Upload ad'}
      </button>
        </>
      )}

      {tab === 'customize' && (
        <>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 16 }}>
            Customize how ads are rendered on the display.
          </p>
          <div style={{ marginTop: 8 }}>
            <label
              style={{
                display: 'block',
                fontSize: 12,
                color: 'var(--text-muted)',
                marginBottom: 4,
              }}
            >
              Background blur strength (px)
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input
                type="range"
                min={0}
                max={64}
                value={a.adBackgroundBlurPx ?? 24}
                onChange={(e) => {
                  const v = Math.max(0, Math.min(64, Number(e.target.value) || 0));
                  setSettings({
                    ads: {
                      ...a,
                      adBackgroundBlurPx: v,
                    },
                  });
                }}
                style={{ flex: 1, accentColor: 'var(--accent)' }}
              />
              <input
                type="number"
                className="input"
                min={0}
                max={64}
                step={1}
                value={a.adBackgroundBlurPx ?? 24}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (!Number.isNaN(v)) {
                    const clamped = Math.max(0, Math.min(64, v));
                    setSettings({
                      ads: {
                        ...a,
                        adBackgroundBlurPx: clamped,
                      },
                    });
                  }
                }}
                style={{ width: 72, textAlign: 'center' }}
                aria-label="Ads background blur strength"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
