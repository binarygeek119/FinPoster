/**
 * FinPoster – root component and router
 *
 * The app has two main areas: the display (single route at /) and settings
 * (under /settings/*). Each settings page has its own URL. Display pages
 * do not show a settings button; clicking anywhere on the display opens
 * settings. Theme is glass + Jellyfin colors throughout.
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SettingsProvider } from './store/settingsStore';
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
import { UploadSettings } from './pages/settings/UploadSettings';
import { BackupSettings } from './pages/settings/BackupSettings';
import './index.css';

function App() {
  return (
    <SettingsProvider>
      <BrowserRouter>
        <Routes>
          {/* Display: single route; click anywhere opens settings */}
          <Route path="/" element={<DisplayPage />} />

          {/* Settings: each page has its own URL */}
          <Route path="/settings" element={<SettingsLayout />}>
            <Route index element={<Navigate to="/settings/general" replace />} />
            <Route path="general" element={<GeneralSettings />} />
            <Route path="jellyfin" element={<JellyfinSettings />} />
            <Route path="plex" element={<PlexSettings />} />
            <Route path="emby" element={<EmbySettings />} />
            <Route path="media-showcase" element={<MediaShowcaseSettings />} />
            <Route path="now-showing" element={<NowShowingSettings />} />
            <Route path="ads" element={<AdsSettings />} />
            <Route path="metadata" element={<MetadataSettings />} />
            <Route path="cache" element={<CacheSettings />} />
            <Route path="uploads" element={<UploadSettings />} />
            <Route path="backup" element={<BackupSettings />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </SettingsProvider>
  );
}

export default App;
