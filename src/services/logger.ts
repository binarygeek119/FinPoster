/**
 * In-app logger: console and in-memory buffer with optional redaction.
 * Respects General → Logging toggles (console, file, redact, debug) and
 * rolls buffer by age (24h or 6h when debug).
 */

import type { AppSettings } from '../types';
import { defaultLogging } from '../defaults';

const ROLL_AGE_MS = 24 * 60 * 60 * 1000;
const ROLL_AGE_DEBUG_MS = 6 * 60 * 60 * 1000;

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  ts: number;
  level: LogLevel;
  message: string;
}

let appSettingsForLogger: AppSettings | null = null;

/** Call once when app loads and when settings change so logger can read logging opts and redaction list. */
export function setAppSettingsForLogger(settings: AppSettings | null): void {
  appSettingsForLogger = settings;
}

function getLogging() {
  return appSettingsForLogger?.logging ?? defaultLogging;
}

function getRollAgeMs(): number {
  return getLogging().debug ? ROLL_AGE_DEBUG_MS : ROLL_AGE_MS;
}

/** Collect all API keys, tokens, URLs we want to redact from settings. */
function buildRedactionList(settings: AppSettings | null): string[] {
  if (!settings) return [];
  const list: string[] = [];
  const add = (v: string | undefined) => {
    if (v && typeof v === 'string' && v.trim().length > 0) list.push(v.trim());
  };

  const j = settings.jellyfin;
  if (j) {
    add(j.serverUrl);
    add(j.apiKey);
    add(j.password);
    add(j.username);
  }
  const p = settings.plex;
  if (p) {
    add(p.serverUrl);
    add(p.token);
  }
  const e = settings.emby;
  if (e) {
    add(e.serverUrl);
    add(e.apiKey);
  }
  const m = settings.metadata;
  if (m) {
    add(m.tmdbApiKey);
    add(m.tvdbApiKey);
    add(m.googleBooksApiKey);
    add(m.comicVineApiKey);
    add(m.musicBrainzClientId);
    add(m.musicBrainzClientSecret);
  }
  return list;
}

function applyRedaction(text: string, list: string[]): string {
  let out = text;
  for (const secret of list) {
    if (secret.length < 4) continue;
    out = out.split(secret).join('[REDACTED]');
  }
  return out;
}

const buffer: LogEntry[] = [];
const MAX_BUFFER = 5000;

function rollBuffer(): void {
  const maxAge = getRollAgeMs();
  const cutoff = Date.now() - maxAge;
  while (buffer.length > 0 && buffer[0].ts < cutoff) buffer.shift();
  while (buffer.length > MAX_BUFFER) buffer.shift();
}

function formatEntry(entry: LogEntry): string {
  const d = new Date(entry.ts);
  const time = d.toISOString();
  return `[${time}] [${entry.level.toUpperCase()}] ${entry.message}`;
}

function shouldRedact(): boolean {
  return getLogging().redact;
}

function writeToBuffer(level: LogLevel, message: string): void {
  const logging = getLogging();
  if (!logging.logToFile) return;
  const list = shouldRedact() ? buildRedactionList(appSettingsForLogger) : [];
  const stored = list.length ? applyRedaction(message, list) : message;
  buffer.push({ ts: Date.now(), level, message: stored });
  rollBuffer();
}

function writeToConsole(level: LogLevel, message: string): void {
  const logging = getLogging();
  if (!logging.logToConsole) return;
  const list = shouldRedact() ? buildRedactionList(appSettingsForLogger) : [];
  const out = list.length ? applyRedaction(message, list) : message;
  switch (level) {
    case 'debug':
      console.debug(out);
      break;
    case 'info':
      console.info(out);
      break;
    case 'warn':
      console.warn(out);
      break;
    case 'error':
      console.error(out);
      break;
    default:
      console.log(out);
  }
}

function emit(level: LogLevel, ...args: unknown[]): void {
  const message = args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
  writeToConsole(level, message);
  writeToBuffer(level, message);
}

/** Log at debug level; only written when General → Logging → Debug is on. */
export function logDebug(...args: unknown[]): void {
  if (!getLogging().debug) return;
  emit('debug', ...args);
}

export function logInfo(...args: unknown[]): void {
  emit('info', ...args);
}

export function logWarn(...args: unknown[]): void {
  emit('warn', ...args);
}

export function logError(...args: unknown[]): void {
  emit('error', ...args);
}

/** Single entry point: use level 'debug' for debug-only messages. */
export function log(level: LogLevel, ...args: unknown[]): void {
  if (level === 'debug') {
    logDebug(...args);
    return;
  }
  emit(level, ...args);
}

/** Get full log text for download. When withRedactions is true, run redaction over buffer (buffer may already store redacted text if redact was on when lines were added). */
export function getLogText(withRedactions: boolean): string {
  const list = withRedactions ? buildRedactionList(appSettingsForLogger) : [];
  const lines = buffer.map((e) => {
    const line = formatEntry(e);
    return list.length ? applyRedaction(line, list) : line;
  });
  return lines.join('\n');
}

/** Trigger a log file download. */
export function downloadLog(withRedactions: boolean): void {
  const text = getLogText(withRedactions);
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `finposter-log-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}
