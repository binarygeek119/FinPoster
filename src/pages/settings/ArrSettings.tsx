/**
 * Arr settings – placeholder for Sonarr/Radarr/Lidarr-style integration.
 *
 * This page now just explains the planned Arr integration; individual Arr apps
 * are navigated from the sidebar, but rendering stays simple here.
 */

export function ArrSettings() {
  return (
    <div className="glass-panel" style={{ padding: 24, maxWidth: 720 }}>
      <h1>Arr</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
        Integration with Arr-family automation apps (Sonarr, Radarr, Lidarr, etc.)
        is planned for a future update.
      </p>
      <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
        The Arr menu in the sidebar lets you pick which Arr tool you want to configure.
        This page will eventually show shared Arr settings such as connection defaults,
        sync intervals, and how FinPoster should react to new downloads.
      </p>
    </div>
  );
}


