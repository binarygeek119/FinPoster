/**
 * Plex settings – placeholder for future Plex support
 *
 * The spec asks for a placeholder page so that when we add Plex as a media
 * source later, the UI and URL already exist. We show the same glass style
 * and a clear message that this is not implemented yet.
 */

export function PlexSettings() {
  return (
    <div className="glass-panel" style={{ padding: 24, maxWidth: 640 }}>
      <h1>Plex</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
        Plex support is planned for a future update. You can use Jellyfin as the
        primary media source for now.
      </p>
      <div style={{ padding: 16, background: 'rgba(0,0,0,0.2)', borderRadius: 8, color: 'var(--text-muted)' }}>
        <strong>Placeholder fields (not active):</strong>
        <ul style={{ marginTop: 8, paddingLeft: 20 }}>
          <li>Server URL</li>
          <li>Token</li>
          <li>Library selection</li>
        </ul>
      </div>
    </div>
  );
}
