/**
 * Emby settings – placeholder for future Emby support
 *
 * Same idea as Plex: placeholder page with URL so we can add Emby as a
 * media source later without changing the nav structure.
 */

export function EmbySettings() {
  return (
    <div className="glass-panel" style={{ padding: 24, maxWidth: 640 }}>
      <h1>Emby</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
        Emby support is planned for a future update. Use Jellyfin as the
        primary media source for now.
      </p>
      <div style={{ padding: 16, background: 'rgba(0,0,0,0.2)', borderRadius: 8, color: 'var(--text-muted)' }}>
        <strong>Placeholder fields (not active):</strong>
        <ul style={{ marginTop: 8, paddingLeft: 20 }}>
          <li>Server URL</li>
          <li>API key</li>
          <li>Authentication settings</li>
          <li>Library selection</li>
        </ul>
      </div>
    </div>
  );
}
