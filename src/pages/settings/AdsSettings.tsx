/**
 * Ads settings – enable/disable ads, toggle individual ads, duration, frequency
 *
 * Controls when and how uploaded ads are shown: enable/disable, which ads are
 * active, how long each ad displays, and how many poster rotations happen
 * before we show an ad block. Same glass styling.
 */

import { useSettings } from '../../store/settingsStore';

export function AdsSettings() {
  const { settings, setSettings } = useSettings();
  const a = settings.ads;
  const adUploads = settings.uploads.filter((u) => u.category === 'ads');

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

  return (
    <div className="glass-panel" style={{ padding: 24, maxWidth: 640 }}>
      <h1>Ads</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
        Show uploaded advertisement images between poster rotations. Upload ads under
        <strong> Uploads</strong> first.
      </p>

      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="checkbox"
          checked={a.enabled}
          onChange={(e) =>
            setSettings({ ads: { ...a, enabled: e.target.checked } })
          }
        />
        Enable ads
      </label>

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
          Toggle which ads are shown. If none are selected, all uploaded ads are used.
        </p>
        {adUploads.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No ads uploaded yet. Add some under Uploads.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {adUploads.map((u) => (
              <li key={u.id} style={{ marginBottom: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={a.enabledAdIds.length === 0 || a.enabledAdIds.includes(u.id)}
                    onChange={() => toggleAd(u.id)}
                  />
                  {u.name}
                  {u.label && <span style={{ color: 'var(--text-muted)' }}> — {u.label}</span>}
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
