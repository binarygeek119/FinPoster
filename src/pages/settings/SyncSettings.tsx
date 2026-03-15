/**
 * Sync settings – media sync interval, stop sync, and related options
 *
 * Central place for sync behavior: how often to pull from Jellyfin (or other
 * sources), stop/start sync, and future sync-related controls.
 */

export function SyncSettings() {
  return (
    <div className="glass-panel" style={{ padding: 24, maxWidth: 640 }}>
      <h1>Sync</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
        Configure when and how FinPoster syncs media from your configured sources.
        Media sync interval and stop sync are available under General.
      </p>
      <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
        More sync options will appear here in a future update.
      </p>
    </div>
  );
}
