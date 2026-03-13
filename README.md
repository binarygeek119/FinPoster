https://github.com/binarygeek119/FinPoster/blob/main/public/hero.png?raw=true

# FinPoster – Digital Signage Display System

A poster and digital signage display app that behaves like a theater lobby or promotional screen. Built with a **glass-style UI** and **Jellyfin-inspired colors** throughout.

## Features

- **Media Showcase** – Full-screen rotating posters with metadata ticker (movies, TV, music, books)
- **Now Showing** – Theater showtime-style board with vertical scrolling list
- **Ads** – Upload and display advertisement images between poster rotations
- **Auto-rotation** – Switches between Media Showcase, Ads, and Now Showing on a schedule
- **Jellyfin** – Primary media source; optional TMDb/TheTVDB metadata fallback
- **Settings** – Each settings section has its own URL (e.g. `/settings/jellyfin`, `/settings/ads`)
- **Click to configure** – On the display, clicking anywhere opens settings (no visible settings button)

## Quick start

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. You’ll see the fallback display until Jellyfin is configured. Click anywhere to open settings, then set **Jellyfin** (server URL and API key) and **Load libraries**.

## Scripts

- `npm run dev` – Start dev server
- `npm run build` – Production build
- `npm run preview` – Preview production build

## Project structure

- `src/types.ts` – Shared types (MediaItem, settings, display modes)
- `src/defaults.ts` – Default settings and constants
- `src/store/settingsStore.tsx` – Settings context and localStorage persistence
- `src/components/` – Display components (MediaShowcase, NowShowing, AdsDisplay, FallbackDisplay) and layouts
- `src/pages/` – Display page and all settings pages
- `src/hooks/useDisplayRotation.ts` – Rotation logic (when to show which mode)
- `src/services/` – Jellyfin client, cache, metadata fallback (TMDb/TheTVDB)

## Theme

The app uses a single glass theme with Jellyfin purple/blue accents. See `src/index.css` for variables. Glass panels use `backdrop-filter: blur()` and translucent backgrounds; reuse the `.glass-panel` class for consistency.

## Settings routes

| Path | Purpose |
|------|--------|
| `/settings/general` | Overview and first-time guidance |
| `/settings/jellyfin` | Server URL, auth, libraries, media types |
| `/settings/plex` | Placeholder (future) |
| `/settings/emby` | Placeholder (future) |
| `/settings/media-showcase` | Poster duration, ticker, colors |
| `/settings/now-showing` | Showtime source, manual IDs, theater count |
| `/settings/ads` | Enable ads, duration, frequency |
| `/settings/metadata` | TMDb and TheTVDB API keys |
| `/settings/cache` | Clear cache buckets |
| `/settings/uploads` | Upload textures and ads |
| `/settings/backup` | Download/restore settings JSON |


## Docker images (GitHub Container Registry)

Images are built automatically by GitHub Actions for the `main` and `dev` branches and pushed to:

- `ghcr.io/binarygeek119/finposter:latest` (from `main`)
- `ghcr.io/binarygeek119/finposter:dev` (from `dev`)

To run the image locally:

```bash
# Log in to GitHub Container Registry (use a PAT with read:packages)
echo YOUR_GITHUB_PAT ^| docker login ghcr.io -u binarygeek119 --password-stdin

# Run the main image
docker run --rm -p 8080:80 ghcr.io/binarygeek119/finposter:latest

# Or the dev image
docker run --rm -p 8080:80 ghcr.io/binarygeek119/finposter:dev
```

## License

Private / use as you like.
