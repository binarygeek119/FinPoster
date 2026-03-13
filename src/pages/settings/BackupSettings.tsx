/**
 * Backup settings – download settings backup and restore from file
 *
 * User can download current settings as a JSON file and later restore it.
 * Restore shows a confirmation dialog before overwriting. Same glass styling.
 */

import { useRef } from 'react';
import { useSettings } from '../../store/settingsStore';
import { SETTINGS_STORAGE_KEY } from '../../defaults';

export function BackupSettings() {
  const { settings } = useSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadBackup = () => {
    const blob = new Blob([JSON.stringify(settings, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finposter-settings-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const restoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        if (!window.confirm('Restore this settings file? Current settings will be replaced.')) {
          e.target.value = '';
          return;
        }
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(parsed));
        window.location.reload();
      } catch {
        alert('Invalid settings file.');
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="glass-panel" style={{ padding: 24, maxWidth: 640 }}>
      <h1>Backup</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
        Download a backup of your settings or restore from a previously saved file.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <button type="button" className="btn btn-primary" onClick={downloadBackup}>
            Download settings backup
          </button>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            style={{ display: 'none' }}
            onChange={restoreBackup}
          />
          <button
            type="button"
            className="btn"
            onClick={() => fileInputRef.current?.click()}
          >
            Restore from file
          </button>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
            A confirmation dialog will appear before restoring.
          </p>
        </div>
      </div>
    </div>
  );
}
