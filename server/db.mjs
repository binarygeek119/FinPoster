import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appRoot = path.resolve(__dirname, '..');
const dataDir = path.join(appRoot, 'data');
const dbPath = path.join(dataDir, 'finposter.db');

let db;

export function initDb() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  // Simple versioned migrations using PRAGMA user_version
  const currentVersion = db.pragma('user_version', { simple: true }) || 0;

  if (currentVersion === 0) {
    // Initial schema
    db.exec(`
      CREATE TABLE IF NOT EXISTS sources (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        kind TEXT NOT NULL,
        name TEXT,
        server_url TEXT,
        api_key TEXT,
        auth_json TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS media_items (
        id TEXT PRIMARY KEY,
        source_kind TEXT NOT NULL,
        source_library_id TEXT,
        title TEXT,
        type TEXT,
        year INTEGER,
        rating TEXT,
        poster_url TEXT,
        backdrop_url TEXT,
        logo_url TEXT,
        metadata_json TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );
    `);
    db.pragma('user_version = 1');
  }

  // Future migrations (example):
  // if (currentVersion < 2) {
  //   db.exec(`ALTER TABLE media_items ADD COLUMN some_new_field TEXT;`);
  //   db.pragma('user_version = 2');
  // }
}

export function getDb() {
  if (!db) {
    initDb();
  }
  return db;
}

export function upsertMediaItems(items) {
  if (!items?.length) return;
  const database = getDb();
  const stmt = database.prepare(`
    INSERT INTO media_items (
      id,
      source_kind,
      source_library_id,
      title,
      type,
      year,
      rating,
      poster_url,
      backdrop_url,
      logo_url,
      metadata_json,
      created_at,
      updated_at
    ) VALUES (
      @id,
      @source_kind,
      @source_library_id,
      @title,
      @type,
      @year,
      @rating,
      @poster_url,
      @backdrop_url,
      @logo_url,
      @metadata_json,
      datetime('now'),
      datetime('now')
    )
    ON CONFLICT(id) DO UPDATE SET
      source_kind = excluded.source_kind,
      source_library_id = excluded.source_library_id,
      title = excluded.title,
      type = excluded.type,
      year = excluded.year,
      rating = excluded.rating,
      poster_url = excluded.poster_url,
      backdrop_url = excluded.backdrop_url,
      logo_url = excluded.logo_url,
      metadata_json = excluded.metadata_json,
      updated_at = datetime('now');
  `);

  const insertMany = database.transaction((rows) => {
    for (const row of rows) {
      stmt.run(row);
    }
  });

  insertMany(
    items.map((it) => ({
      id: it.id,
      source_kind: it.source || 'unknown',
      source_library_id: it.libraryId || null,
      title: it.title || null,
      type: it.type || null,
      year: it.year || null,
      rating: it.rating || null,
      poster_url: it.posterUrl || null,
      backdrop_url: it.backdropUrl || null,
      logo_url: it.logoUrl || null,
      metadata_json: it.metadata ? JSON.stringify(it.metadata) : null,
    })),
  );
}

export function getMediaItems({ sourceKind, limit = 50 } = {}) {
  const database = getDb();
  if (sourceKind) {
    return database
      .prepare(
        `SELECT * FROM media_items WHERE source_kind = ? ORDER BY updated_at DESC LIMIT ?`,
      )
      .all(sourceKind, limit);
  }
  return database
    .prepare(`SELECT * FROM media_items ORDER BY updated_at DESC LIMIT ?`)
    .all(limit);
}

