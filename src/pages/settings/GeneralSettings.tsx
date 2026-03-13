/**
 * General settings – first stop after "click to open settings"
 *
 * This page can hold app-wide options (e.g. default display mode, language).
 * For now we keep it minimal with a welcome and link to Jellyfin setup.
 */

export function GeneralSettings() {
  return (
    <div className="glass-panel" style={{ padding: 24, maxWidth: 640 }}>
      <h1>General</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
        Configure your FinPoster digital signage. Start by connecting Jellyfin under
        <strong> Jellyfin</strong>, then adjust <strong>Media Showcase</strong> and
        <strong> Now Showing</strong> to your liking.
      </p>
      <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
        Click anywhere on the display screen to return to the poster view.
      </p>
    </div>
  );
}
