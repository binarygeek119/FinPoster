/**
 * Arr settings – placeholder for Sonarr/Radarr/Lidarr-style integration.
 *
 * This page now just explains the planned Arr integration; individual Arr apps
 * are navigated from the sidebar, but rendering stays simple here.
 */

import { useParams } from 'react-router-dom';

const ARR_TABS: Record<
  string,
  { label: string; logoSrc: string; description: string; details: string }
> = {
  lidarr: {
    label: 'Lidarr',
    logoSrc: '/logos/lidarr.png',
    description: 'Lidarr manages your music collection and automation.',
    details:
      'Integration with Lidarr is planned for a future update. You will be able to connect FinPoster to Lidarr to display recently added albums, sync music metadata, and optionally trigger or reflect Lidarr activity on your display.',
  },
  radarr: {
    label: 'Radarr',
    logoSrc: '/logos/radarr.png',
    description: 'Radarr manages your movie collection and automation.',
    details:
      'Integration with Radarr is planned for a future update. You will be able to connect FinPoster to Radarr to display recently added movies, sync metadata, and optionally trigger or reflect Radarr activity on your display.',
  },
  sonarr: {
    label: 'Sonarr',
    logoSrc: '/logos/sonarr.png',
    description: 'Sonarr manages your TV show collection and automation.',
    details:
      'Integration with Sonarr is planned for a future update. You will be able to connect FinPoster to Sonarr to display recently added series or episodes, sync metadata, and optionally trigger or reflect Sonarr activity on your display.',
  },
  chaptarr: {
    label: 'Chaptarr',
    logoSrc: '/logos/chaptarr.png',
    description: 'Chaptarr manages your audiobook and chapter metadata.',
    details:
      'Integration with Chaptarr is planned for a future update. You will be able to connect FinPoster to Chaptarr for audiobook or chapter-aware display and metadata sync.',
  },
};

export function ArrSettings() {
  const { tab } = useParams<{ tab?: string }>();
  const arrTab = tab ? ARR_TABS[tab.toLowerCase()] : null;

  return (
    <div className="glass-panel" style={{ padding: 24, maxWidth: 720 }}>
      {arrTab ? (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
            <img
              src={arrTab.logoSrc}
              alt=""
              style={{ height: 40, width: 'auto', objectFit: 'contain' }}
            />
            <h1 style={{ margin: 0 }}>{arrTab.label}</h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
            {arrTab.description}
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            {arrTab.details}
          </p>
        </>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}


