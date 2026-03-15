/**
 * Shared API helper for metadata providers – base URL and POST JSON.
 */

const DEV_BACKEND_BASE = 'http://localhost:3000';

export function backendBaseUrl(): string {
  if (import.meta.env.DEV) {
    return DEV_BACKEND_BASE;
  }
  return window.location.origin;
}

export async function postJson<T>(path: string, body: unknown): Promise<T | null> {
  try {
    const res = await fetch(`${backendBaseUrl()}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}
