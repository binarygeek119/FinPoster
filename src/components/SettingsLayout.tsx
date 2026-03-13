/**
 * Settings layout – wrapper for all settings pages with glass-style navigation
 *
 * Each settings page has its own URL. This layout provides a consistent
 * side (or top) navigation so the user can jump between General, Jellyfin,
 * Media Showcase, etc. without using the browser back button. The theme
 * uses the same glass panels and Jellyfin accent colors as the rest of the app.
 */

import { NavLink, Outlet } from 'react-router-dom';
import { useSettings } from '../store/settingsStore';
import logo from '../assets/hero.png';
import jellyfinLogo from '../assets/jellyfin.png';

const MEDIA_SERVERS: { path: string; label: string; logoSrc: string }[] = [
  { path: '/settings/jellyfin', label: 'Jellyfin', logoSrc: jellyfinLogo },
  { path: '/settings/plex', label: 'Plex', logoSrc: '/plex.png' },
  { path: '/settings/emby', label: 'Emby', logoSrc: '/emby.png' },
];

const SETTINGS_NAV: { path: string; label: string }[] = [
  { path: '/settings/media-showcase', label: 'Media Showcase' },
  { path: '/settings/playback', label: 'Playback' },
  { path: '/settings/now-showing', label: 'Now Showing' },
  { path: '/settings/ads', label: 'Ads' },
  { path: '/settings/metadata', label: 'Metadata' },
  { path: '/settings/cache', label: 'Cache' },
  { path: '/settings/backup', label: 'Backup' },
  { path: '/settings/about', label: 'About' },
];

export function SettingsLayout() {
  const { settings, setSettings } = useSettings();
  const ui = settings.ui;
  const serversOpen = ui.navMediaServersOpen ?? false;
  const arrOpen = ui.navArrOpen ?? false;
  const setServersOpen = (value: boolean) =>
    setSettings({ ui: { ...ui, navMediaServersOpen: value } });
  const setArrOpen = (value: boolean) =>
    setSettings({ ui: { ...ui, navArrOpen: value } });

  return (
    <div className="settings-shell">
      {/* Glass-style side nav */}
      <nav className="glass-panel settings-nav">
        <div className="settings-logo">
          <NavLink
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img
              src={logo}
              alt="FinPoster"
              style={{ width: 120, height: 'auto', objectFit: 'contain' }}
            />
          </NavLink>
        </div>

        {/* General – top-level entry */}
        <NavLink
          to="/settings/general"
          end={false}
          style={({ isActive }) => ({
            display: 'block',
            padding: '10px 16px',
            margin: '2px 8px',
            borderRadius: 8,
            color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
            background: isActive ? 'var(--accent-glow)' : 'transparent',
            textDecoration: 'none',
            borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
          })}
        >
          General
        </NavLink>

        {/* Media servers dropdown group – sits under General */}
        <button
          type="button"
          onClick={() => setServersOpen(!serversOpen)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            padding: '10px 16px',
            margin: '2px 8px',
            borderRadius: 8,
            border: 'none',
            background: 'transparent',
            color: 'var(--text-secondary)',
            fontSize: 15,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          <span>Media servers</span>
          <span
            style={{
              fontSize: 12,
              opacity: 0.7,
              transform: serversOpen ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.15s ease',
            }}
          >
            ▶
          </span>
        </button>
        {serversOpen && (
          <div style={{ marginBottom: 4 }}>
            {MEDIA_SERVERS.map(({ path, label, logoSrc }) => (
              <NavLink
                key={path}
                to={path}
                end={false}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 24px',
                  margin: '2px 8px',
                  borderRadius: 8,
                  color: isActive
                    ? 'var(--text-primary)'
                    : 'var(--text-secondary)',
                  background: isActive ? 'var(--accent-glow)' : 'transparent',
                  textDecoration: 'none',
                  borderLeft: isActive
                    ? '3px solid var(--accent)'
                    : '3px solid transparent',
                  fontSize: 14,
                })}
              >
                <img
                  src={logoSrc}
                  alt=""
                  style={{
                    height: '1.25em',
                    width: 'auto',
                    maxWidth: 72,
                    objectFit: 'contain',
                    flexShrink: 0,
                  }}
                />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
        )}

        {/* Arr group – directly under Media servers */}
        <button
          type="button"
          onClick={() => setArrOpen(!arrOpen)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            padding: '10px 16px',
            margin: '2px 8px',
            borderRadius: 8,
            border: 'none',
            background: 'transparent',
            color: 'var(--text-secondary)',
            fontSize: 15,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          <span>Arr</span>
          <span
            style={{
              fontSize: 12,
              opacity: 0.7,
              transform: arrOpen ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.15s ease',
            }}
          >
            ▶
          </span>
        </button>
        {arrOpen && (
          <div style={{ marginBottom: 4 }}>
            {[
              { subPath: '/settings/arr/lidarr', label: 'Lidarr', logoSrc: '/lidarr.png' },
              { subPath: '/settings/arr/radarr', label: 'Radarr', logoSrc: '/radarr.png' },
              { subPath: '/settings/arr/sonarr', label: 'Sonarr', logoSrc: '/sonarr.png' },
              { subPath: '/settings/arr/chaptarr', label: 'Chaptarr', logoSrc: '/chaptarr.png' },
            ].map(({ subPath, label: subLabel, logoSrc }) => (
              <NavLink
                key={subPath}
                to={subPath}
                end={false}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 24px',
                  margin: '2px 8px',
                  borderRadius: 8,
                  color: isActive
                    ? 'var(--text-primary)'
                    : 'var(--text-secondary)',
                  background: isActive
                    ? 'var(--accent-glow)'
                    : 'transparent',
                  textDecoration: 'none',
                  borderLeft: isActive
                    ? '3px solid var(--accent)'
                    : '3px solid transparent',
                  fontSize: 14,
                })}
              >
                <img
                  src={logoSrc}
                  alt=""
                  style={{
                    height: '1.25em',
                    width: 'auto',
                    maxWidth: 72,
                    objectFit: 'contain',
                    flexShrink: 0,
                  }}
                />
                <span>{subLabel}</span>
              </NavLink>
            ))}
          </div>
        )}

        {/* Other settings */}
        {SETTINGS_NAV.map(({ path, label }) => (
          <NavLink
            key={path}
            to={path}
            end={false}
            style={({ isActive }) => ({
              display: 'block',
              padding: '10px 16px',
              margin: '2px 8px',
              borderRadius: 8,
              color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              background: isActive ? 'var(--accent-glow)' : 'transparent',
              textDecoration: 'none',
              borderLeft: isActive
                ? '3px solid var(--accent)'
                : '3px solid transparent',
            })}
          >
            {label}
          </NavLink>
        ))}
      </nav>
      {/* Main content area */}
      <main className="settings-main">
        <Outlet />
      </main>
    </div>
  );
}
