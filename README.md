A display app for Jellyfin that shows poster walls, showtimes, ads, and now-playing media. Use it on a TV or second screen to rotate random library posters, display a “Now Showing” schedule, show ad slides, and reflect playback when something starts.

If you're not a coder: Open the app in your browser (e.g. http://localhost:3001 or the address you use). Tap or click anywhere on the display to open Settings. In Jellyfin you enter your server address and API key (or username/password), then Load Libraries and turn on the libraries you want. The rest of the menus control how long each screen stays, which fonts and colors you see, and optional extras (metadata keys, backups, debug logs). You don't need to edit any code to use FinPoster.

Artwork: Artwork used in this project (e.g. logo, placeholders) is AI-generated and temporary. It is intended to be replaced with final assets.

Inspiration: This app was inspired by angle of the AI-coded Twisted Metal V fan game.

Features
Random Poster – Rotates through movies, TV shows, music, and books from your Jellyfin libraries with cinema-style poster layout, ticker, and optional texture overlay.
Movie Showing – Portrait-style schedule view with manual or auto-generated show times; can fill with random Jellyfin items.
Ads – Upload images and show them in the rotation for a set duration. Free ad posters: open-custom-posters.
Now playing – Progress bar and start/end time when Jellyfin is playing.
Metadata – Optional TMDb, TheTVDB, Google Books, and Comic Vine API keys for artwork and metadata when Jellyfin is missing them; local cache is used when available.
Settings – Jellyfin connection (URL, API key or username/password), libraries, media types, textures, dim strength, fonts, and rotation toggles.
Development
The dev branch is protected. To contribute changes, create a feature branch, push it, and open a Pull Request into dev (do not push directly to dev).

Configuration guide
Jellyfin: finding your User ID
FinPoster can use your Jellyfin User ID when using API key auth (some flows need it). To find it:

Log in to your Jellyfin server in a browser (e.g. http://your-server:8096).
Open the user menu (top-right, your avatar/name) → Dashboard (or go to /web/index.html#!/dashboard.html).
In the left sidebar, go to Users (under “Administration” if you’re an admin).
Click your username. The URL will look like:
http://your-server:8096/web/index.html#!/useredit.html?userId=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
The long hex string after userId= is your User ID. Copy that into FinPoster’s User ID field in Jellyfin settings.
If you don’t see Users, you’re not an admin: ask your server admin for your User ID, or use Login (username/password) auth mode instead (see below).

Jellyfin: creating an API key
Using an API key avoids sending your password and is recommended when possible.

Log in to Jellyfin in a browser as an administrator.
Go to Dashboard → API Keys (under “Advanced” in the sidebar), or open:
http://your-server:8096/web/index.html#!/apikeys.html
Click New API Key.
Give it a name (e.g. “FinPoster”) and optionally set an expiration.
Copy the generated key and paste it into FinPoster’s API Key field in Jellyfin settings.
In FinPoster, set Auth Mode to API Key and enter Server URL and, if needed, User ID (see above). Then use Test Connection and Load Libraries.
Jellyfin: Login auth mode (username & password)
If you prefer not to use an API key, or you don’t have admin access to create one:

In FinPoster Jellyfin settings, set Auth Mode to Login (username & password).
Enter your Server URL (e.g. http://your-server:8096).
Enter your Jellyfin Username and Password.
Use Test Connection and Load Libraries. FinPoster will authenticate with your credentials each time it talks to Jellyfin. Your password is stored in settings; keep your device and config secure.
Note: API key auth is usually preferred (no password stored, revocable key). Use login auth when you can’t create an API key or prefer username/password.

TheTVDB: getting an API key
TheTVDB is used for TV metadata and artwork when Jellyfin or the local cache doesn’t have them.

Create an account at TheTVDB.com (or log in).
Go to the API information / signup page or your Dashboard → API Key.
Choose a plan (e.g. Free for personal/non-commercial use, with attribution).
Complete the form and create your API key (v4 keys contain dashes).
Copy the key and paste it into FinPoster Settings → Metadata → TheTVDB API Key.
TMDb: getting an API key
TMDb is used for movie and TV metadata and artwork when Jellyfin or the local cache doesn’t have them.

Go to The Movie Database (TMDb) and create an account or log in.
In your profile menu, open Settings → API (or go to themoviedb.org/settings/api).
Under API Key, request an key (e.g. “Developer” type). Accept the terms and create the key.
Copy the API Key (v3 auth) and paste it into FinPoster Settings → Metadata → TMDb API Key.
Keep the key private. TMDb has rate limits; normal FinPoster use is usually within them.

Google Books: getting an API key
Google Books is used for book metadata and artwork when Jellyfin or the local cache doesn’t have them.

Go to Google Cloud Console and create or select a project.
Enable the Books API (APIs & Services → Library → search “Books API” → Enable).
Create credentials: APIs & Services → Credentials → Create credentials → API key.
Copy the API key and paste it into FinPoster Settings → Metadata → Google Books API Key.
Restrict the key to the Books API and (if applicable) to your app in production.

Comic Vine: getting an API key
Comic Vine is used for comic and game metadata when Jellyfin or the local cache doesn’t have them.

Create an account or log in at Comic Vine.
Go to Comic Vine API and copy your API key (shown when logged in).
Paste it into FinPoster Settings → Metadata → Comic Vine API Key.
Use a single key and respect rate limits to avoid blocks.

Docker
The app is available on Docker Hub as binarygeek119/finposter. Data (settings, uploads, cache, logs) is stored in a volume so it persists across restarts.

Run with Docker Compose (recommended):

docker compose up -d
Then open http://localhost:3001 (or your host’s IP and port 3001).

To use a different host port (e.g. 8080):

FINPOSTER_PORT=8080 docker compose up -d
Or run the image directly:

docker pull binarygeek119/finposter:latest
docker run -d -p 3001:3001 -v finposter_data:/data --name finposter binarygeek119/finposter:latest
To remap the port: -p HOST_PORT:3001 (e.g. -p 8080:3001).

Image: Docker Hub – binarygeek119/finposter
Port: Container listens on 3001. Remap with FINPOSTER_PORT (Compose) or -p HOST_PORT:3001 (docker run).
Jellyfin on the same host: The container cannot use localhost for Jellyfin (that’s the container itself). Set Jellyfin server URL to your host’s IP (e.g. http://192.168.1.5:8096), or use http://localhost:8096 and set FINPOSTER_JELLYFIN_HOST_OVERRIDE=host.docker.internal (included in the repo’s docker-compose.yml; on Linux, extra_hosts is set so host.docker.internal resolves).
Data: FINPOSTER_DATA_DIR defaults to /data. Mount a volume there to persist settings, uploads, cache, and logs.
Free ad posters: open-custom-posters – open-source poster images you can use for ads in FinPoster (or Posterr, Digital Movie Poster, etc.).
Disclaimer: AI-generated code
This project’s code is 100% AI-generated. It has not been professionally audited or endorsed by Jellyfin or any official body.

The maintainer is seeking a verified Jellyfin developer to review this codebase and sign off on it. If you are (or know) a Jellyfin developer who can perform such a review, please get in touch.

Use caution. Run only in environments you control and understand. Do not expose credentials or sensitive data unnecessarily.
No warranty. The author/maintainer takes no responsibility for any damage, data loss, security issues, or other problems that may occur from running, modifying, or distributing this software. You use it at your own risk.
Jellyfin integration. This app talks to your Jellyfin server and may send credentials (API key or username/password) to the backend. A Jellyfin-aware developer should review the code and sign off before you rely on it in production or with valuable accounts. Until then, treat it as experimental.
By using FinPoster you acknowledge that it is AI-generated, that you assume all risk, and that the author/maintainer is not liable for any consequences of its use.

Looking for a developer
The maintainer is looking for a developer to help move this project forward:

Clean up the code – Review and refactor the codebase for clarity, consistency, and maintainability.
Take over development or overview updates – Ideally, take on ongoing development; at minimum, review and sign off on changes and updates before they ship.
Stretch goal – Replace AI-generated code with human-written, production-quality code over time.
If you are interested in cleaning up FinPoster, taking over development, or at least overseeing updates, please get in touch. A verified or experienced Jellyfin developer would be especially valuable given the app’s integration with Jellyfin.