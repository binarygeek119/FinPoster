/**
 * Upload settings – currently reserved for future features.
 *
 * Textures are configured on the General settings page. Ads are uploaded and
 * configured on the Ads settings page. This page is kept as a placeholder
 * for any future advanced upload features.
 */

export function UploadSettings() {
  return (
    <div className="glass-panel" style={{ padding: 24, maxWidth: 640 }}>
      <h1>Uploads</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
        Texture uploads have moved to the <strong>General</strong> settings page, and ads are
        uploaded on the <strong>Ads</strong> settings page.
      </p>
      <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
        This area is reserved for future advanced upload options.
      </p>
    </div>
  );
}
