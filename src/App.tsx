/**
 * FinPoster – root component and router
 *
 * The app has two main areas: the display (single route at /) and settings
 * (under /settings/*). Each settings page has its own URL. Display pages
 * do not show a settings button; clicking anywhere on the display opens
 * settings. Theme is glass + Jellyfin colors throughout.
 */

import { useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { SettingsProvider } from './store/settingsStore';
import { logInfo } from './services/logger';
import { SettingsLayout } from './components/SettingsLayout';
import { DisplayPage } from './pages/DisplayPage';
import { GeneralSettings } from './pages/settings/GeneralSettings';
import { JellyfinSettings } from './pages/settings/JellyfinSettings';
import { PlexSettings } from './pages/settings/PlexSettings';
import { EmbySettings } from './pages/settings/EmbySettings';
import { MediaShowcaseSettings } from './pages/settings/MediaShowcaseSettings';
import { NowShowingSettings } from './pages/settings/NowShowingSettings';
import { AdsSettings } from './pages/settings/AdsSettings';
import { MetadataSettings } from './pages/settings/MetadataSettings';
import { CacheSettings } from './pages/settings/CacheSettings';
import { SyncSettings } from './pages/settings/SyncSettings';
import { BackupSettings } from './pages/settings/BackupSettings';
import { AboutSettings } from './pages/settings/AboutSettings';
import { PlaybackSettings } from './pages/settings/PlaybackSettings';
import { ArrSettings } from './pages/settings/ArrSettings';
import './index.css';

/** When navigating from settings back to the display, refresh the page so the display shows updated settings. */
function RefreshDisplayOnReturnFromSettings() {
  const location = useLocation();
  const prevPathRef = useRef(location.pathname);

  useEffect(() => {
    const prev = prevPathRef.current;
    prevPathRef.current = location.pathname;
    if (location.pathname === '/' && prev.startsWith('/settings')) {
      window.location.reload();
    }
  }, [location.pathname]);

  return null;
}

function App() {
  useEffect(() => {
    logInfo('FinPoster started');
  }, []);
  return (
    <SettingsProvider>
      <BrowserRouter>
        <RefreshDisplayOnReturnFromSettings />
        <Routes>
          {/* Display: single route; click anywhere opens settings */}
          <Route path="/" element={<DisplayPage />} />

          {/* Settings: each page has its own URL */}
          <Route path="/settings" element={<SettingsLayout />}>
            <Route index element={<Navigate to="/settings/general" replace />} />
            <Route path="general" element={<GeneralSettings />} />
            <Route path="jellyfin" element={<JellyfinSettings />} />
            <Route path="playback" element={<PlaybackSettings />} />
            <Route path="plex" element={<PlexSettings />} />
            <Route path="emby" element={<EmbySettings />} />
            <Route path="media-showcase" element={<MediaShowcaseSettings />} />
            <Route path="now-showing" element={<NowShowingSettings />} />
            <Route path="ads" element={<AdsSettings />} />
            <Route path="metadata" element={<MetadataSettings />} />
            <Route path="cache" element={<CacheSettings />} />
            <Route path="sync" element={<SyncSettings />} />
            <Route path="backup" element={<BackupSettings />} />
            <Route path="arr">
              <Route index element={<ArrSettings />} />
              <Route path=":tab" element={<ArrSettings />} />
            </Route>
            <Route path="about" element={<AboutSettings />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </SettingsProvider>
  );
}

export default App;
