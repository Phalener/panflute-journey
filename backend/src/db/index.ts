import Database from "better-sqlite3";
import { Pool } from "pg";
import fs from "fs";
import path from "path";
import { env } from "../env";

let sqliteDb: Database.Database | null = null;
let pgPool: Pool | null = null;

if (env.isPgConfigured) {
  pgPool = new Pool({
    connectionString: env.databaseUrl,
    ssl: { rejectUnauthorized: false },
    max: 10,
    connectionTimeoutMillis: 10000,
  });
} else {
  const dbDir = path.dirname(env.databasePath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  sqliteDb = new Database(env.databasePath);
  sqliteDb.pragma("journal_mode = WAL");
  sqliteDb.pragma("foreign_keys = ON");
}

function translateSql(sql: string): string {
  let paramIndex = 1;
  return sql
    .replace(/datetime\('now'\)/gi, "CURRENT_TIMESTAMP")
    .replace(/\?/g, () => `$${paramIndex++}`);
}

export const db = {
  async queryAll<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    if (pgPool) {
      const pgSql = translateSql(sql);
      const res = await pgPool.query(pgSql, params);
      return res.rows as T[];
    }
    return sqliteDb!.prepare(sql).all(...params) as T[];
  },

  async queryOne<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
    if (pgPool) {
      const pgSql = translateSql(sql);
      const res = await pgPool.query(pgSql, params);
      return (res.rows[0] as T) || undefined;
    }
    return (sqliteDb!.prepare(sql).get(...params) as T) || undefined;
  },

  async execute(
    sql: string,
    params: any[] = []
  ): Promise<{ lastInsertRowid: number; changes: number }> {
    if (pgPool) {
      let pgSql = translateSql(sql);
      const isInsert = /^\s*insert\s+into/i.test(pgSql);
      if (isInsert && !/returning/i.test(pgSql)) {
        pgSql += " RETURNING id";
      }
      const res = await pgPool.query(pgSql, params);
      const lastInsertRowid = res.rows[0]?.id ? Number(res.rows[0].id) : 0;
      return { lastInsertRowid, changes: res.rowCount ?? 0 };
    }
    const info = sqliteDb!.prepare(sql).run(...params);
    return {
      lastInsertRowid: Number(info.lastInsertRowid),
      changes: info.changes,
    };
  },
};

export async function migrate(): Promise<void> {
  if (pgPool) {
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS albums (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        year INTEGER,
        cover_filename TEXT,
        is_published INTEGER NOT NULL DEFAULT 0,
        is_featured INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS tracks (
        id SERIAL PRIMARY KEY,
        album_id INTEGER NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        filename TEXT NOT NULL,
        duration_seconds REAL,
        lyrics TEXT,
        position INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE tracks ADD COLUMN IF NOT EXISTS lyrics TEXT;

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_tracks_album_id ON tracks(album_id);
    `);
    console.log("PostgreSQL (Supabase) database ready.");
  } else if (sqliteDb) {
    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS albums (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        year INTEGER,
        cover_filename TEXT,
        is_published INTEGER NOT NULL DEFAULT 0,
        is_featured INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS tracks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        album_id INTEGER NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        filename TEXT NOT NULL,
        duration_seconds REAL,
        lyrics TEXT,
        position INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_tracks_album_id ON tracks(album_id);
    `);
    try {
      sqliteDb.exec("ALTER TABLE tracks ADD COLUMN lyrics TEXT;");
    } catch {
      // Column already exists
    }
    console.log("SQLite database ready.");
  }
}
