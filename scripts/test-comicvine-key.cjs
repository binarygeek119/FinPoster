/**
 * Simple Node-side Comic Vine API key tester.
 *
 * Usage:
 *   npm run test:comicvine -- YOUR_API_KEY_HERE
 *
 * or set an environment variable:
 *   COMICVINE_API_KEY=YOUR_API_KEY npm run test:comicvine
 *
 * This runs from Node (not the browser), so CORS is not an issue.
 */

async function main() {
  const cliKey = process.argv[2];
  const apiKey = cliKey || process.env.COMICVINE_API_KEY;

  if (!apiKey) {
    console.error('Comic Vine test: no API key provided.');
    console.error('Pass it as an argument or COMICVINE_API_KEY env variable.');
    process.exit(1);
  }

  const url = `https://comicvine.gamespot.com/api/issues/?api_key=${encodeURIComponent(
    apiKey,
  )}&format=json&limit=1`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'FinPoster-ComicVine-Test/1.0',
      },
    });

    if (!res.ok) {
      console.error(`Comic Vine test: HTTP ${res.status}`);
      process.exit(1);
    }

    const data = await res.json();
    if (data && data.status_code === 1) {
      console.log('Comic Vine API key looks valid (status_code = 1).');
      process.exit(0);
    } else {
      console.error(
        'Comic Vine test: response did not indicate success. status_code =',
        data && data.status_code,
      );
      process.exit(1);
    }
  } catch (err) {
    console.error('Comic Vine test: request failed:', err);
    process.exit(1);
  }
}

main();

