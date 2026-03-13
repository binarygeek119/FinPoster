/**
 * Upload client – talks to FinPoster's Node backend for real file uploads.
 * In development we default to http://localhost:3000, while in production
 * we assume the frontend is served from the same origin as the backend.
 */

const DEV_BACKEND_BASE = 'http://localhost:3000';

export function backendBaseUrl(): string {
  if (import.meta.env.DEV) {
    return DEV_BACKEND_BASE;
  }
  return window.location.origin;
}

export async function uploadFileToBackend(file: File): Promise<{ path: string }> {
  const form = new FormData();
  form.append('file', file);

  const res = await fetch(`${backendBaseUrl()}/api/uploads`, {
    method: 'POST',
    body: form,
  });

  if (!res.ok) {
    throw new Error('Upload failed');
  }

  const data = await res.json();
  return { path: data.path as string };
}

