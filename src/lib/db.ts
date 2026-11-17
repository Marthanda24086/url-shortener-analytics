import { createClient, Client } from '@libsql/client';
import path from 'path';

let client: Client | null = null;
let initialized = false;

export function getDb(): Client {
  if (!client) {
    const dbPath = path.resolve(process.cwd(), 'kairo.db');
    client = createClient({
      url: `file:${dbPath}`,
    });
  }
  return client;
}

export async function initDb(): Promise<void> {
  if (initialized) return;
  const db = getDb();

  // Initialize Schema
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
      updated_at TEXT NOT NULL DEFAULT (DATETIME('now'))
    );
  `);

  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS links (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      original_url TEXT NOT NULL,
      short_code TEXT UNIQUE NOT NULL COLLATE NOCASE,
      title TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      expires_at TEXT,
      created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
      updated_at TEXT NOT NULL DEFAULT (DATETIME('now')),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  await db.execute(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_links_short_code ON links(short_code);
  `);
  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_links_user_id ON links(user_id);
  `);
  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_links_created_at ON links(created_at);
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS click_events (
      id TEXT PRIMARY KEY,
      link_id TEXT NOT NULL,
      timestamp TEXT NOT NULL DEFAULT (DATETIME('now')),
      referrer_domain TEXT DEFAULT 'Direct',
      browser TEXT DEFAULT 'Other',
      os TEXT DEFAULT 'Other',
      device_type TEXT DEFAULT 'Desktop',
      country_code TEXT DEFAULT 'Global',
      visitor_hash TEXT NOT NULL,
      is_bot INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY(link_id) REFERENCES links(id) ON DELETE CASCADE
    );
  `);

  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_clicks_link_id ON click_events(link_id);
  `);
  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_clicks_timestamp ON click_events(timestamp);
  `);
  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_clicks_link_timestamp ON click_events(link_id, timestamp);
  `);
  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_clicks_visitor_hash ON click_events(visitor_hash);
  `);

  initialized = true;
}

export async function queryRows<T = any>(sql: string, args: any[] = []): Promise<T[]> {
  await initDb();
  const db = getDb();
  const result = await db.execute({ sql, args });
  return result.rows as unknown as T[];
}

export async function queryRow<T = any>(sql: string, args: any[] = []): Promise<T | null> {
  await initDb();
  const db = getDb();
  const result = await db.execute({ sql, args });
  if (result.rows.length === 0) return null;
  return result.rows[0] as unknown as T;
}

export async function executeSql(sql: string, args: any[] = []): Promise<void> {
  await initDb();
  const db = getDb();
  await db.execute({ sql, args });
}
