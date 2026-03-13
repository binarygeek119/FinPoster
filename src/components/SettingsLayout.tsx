/**
 * Settings layout – wrapper for all settings pages with glass-style navigation
 *
 * Each settings page has its own URL. This layout provides a consistent
 * side (or top) navigation so the user can jump between General, Jellyfin,
 * Media Showcase, etc. without using the browser back button. The theme
 * uses the same glass panels and Jellyfin accent colors as the rest of the app.
 */

import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import logo from '../assets/hero.png';

const SETTINGS_NAV: { path: string; label: string }[] = [
  { path: '/settings/media-showcase', label: 'Media Showcase' },
  { path: '/settings/playback', label: 'Playback' },
  { path: '/settings/now-showing', label: 'Now Showing' },
  { path: '/settings/ads', label: 'Ads' },
  { path: '/settings/arr', label: 'Arr' },
  { path: '/settings/metadata', label: 'Metadata' },
  { path: '/settings/cache', label: 'Cache' },
  { path: '/settings/backup', label: 'Backup' },
  { path: '/settings/about', label: 'About' },
];

export function SettingsLayout() {
  const location = useLocation();
  const [serversOpen, setServersOpen] = useState(true);
  const [arrOpen, setArrOpen] = useState(true);

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
          onClick={() => setServersOpen((v) => !v)}
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
            {[
              { path: '/settings/jellyfin', label: 'Jellyfin' },
              { path: '/settings/plex', label: 'Plex' },
              { path: '/settings/emby', label: 'Emby' },
            ].map(({ path, label }) => (
              <NavLink
                key={path}
                to={path}
                end={false}
                style={({ isActive }) => ({
                  display: 'block',
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
                {label}
              </NavLink>
            ))}
          </div>
        )}

        {/* Other settings */}
        {SETTINGS_NAV.map(({ path, label }) => (
          <div key={path}>
            {path === '/settings/arr' ? (
              <>
                <button
                  type="button"
                  onClick={() => setArrOpen((v) => !v)}
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
                  <span>{label}</span>
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
                      { subPath: '/settings/arr/lidarr', label: 'Lidarr' },
                      { subPath: '/settings/arr/radarr', label: 'Radarr' },
                      { subPath: '/settings/arr/sonarr', label: 'Sonarr' },
                      { subPath: '/settings/arr/chaptarr', label: 'Chaptarr' },
                    ].map(({ subPath, label: subLabel }) => (
                      <NavLink
                        key={subPath}
                        to={subPath}
                        end={false}
                        style={({ isActive }) => ({
                          display: 'block',
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
                        {subLabel}
                      </NavLink>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <NavLink
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
            )}
          </div>
        ))}
      </nav>
      {/* Main content area */}
      <main className="settings-main">
        <Outlet />
      </main>
    </div>
  );
}
