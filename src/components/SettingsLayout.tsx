/**
 * Settings layout – wrapper for all settings pages with glass-style navigation
 *
 * Each settings page has its own URL. This layout provides a consistent
 * side (or top) navigation so the user can jump between General, Jellyfin,
 * Media Showcase, etc. without using the browser back button. The theme
 * uses the same glass panels and Jellyfin accent colors as the rest of the app.
 */

import { NavLink, Outlet } from 'react-router-dom';

const SETTINGS_NAV: { path: string; label: string }[] = [
  { path: '/settings/general', label: 'General' },
  { path: '/settings/jellyfin', label: 'Jellyfin' },
  { path: '/settings/plex', label: 'Plex' },
  { path: '/settings/emby', label: 'Emby' },
  { path: '/settings/media-showcase', label: 'Media Showcase' },
  { path: '/settings/now-showing', label: 'Now Showing' },
  { path: '/settings/ads', label: 'Ads' },
  { path: '/settings/metadata', label: 'Metadata' },
  { path: '/settings/cache', label: 'Cache' },
  { path: '/settings/uploads', label: 'Uploads' },
  { path: '/settings/backup', label: 'Backup' },
];

export function SettingsLayout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* Glass-style side nav */}
      <nav
        className="glass-panel"
        style={{
          width: 220,
          minHeight: '100vh',
          margin: 12,
          padding: '16px 0',
          flexShrink: 0,
        }}
      >
        <div style={{ padding: '0 12px 12px', borderBottom: '1px solid var(--glass-border)', marginBottom: 12 }}>
          <NavLink to="/" style={{ color: 'var(--text-primary)', fontWeight: 600, textDecoration: 'none' }}>
            FinPoster
          </NavLink>
        </div>
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
              borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
            })}
          >
            {label}
          </NavLink>
        ))}
      </nav>
      {/* Main content area */}
      <main style={{ flex: 1, padding: 24, overflow: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
}
