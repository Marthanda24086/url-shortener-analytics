# KAIRO — Database Schema & Data Dictionary

**Database Engine:** SQLite 3 (ACID-compliant, high concurrency with WAL mode)  
**Access Layer:** `better-sqlite3` with prepared statements and parameter binding (100% SQL-injection immune)  

---

## 1. Entity Relationship Overview

```
 ┌────────────────────────┐
 │         users          │
 ├────────────────────────┤
 │ id (TEXT PK)           │◄───────┐
 │ name (TEXT)            │        │
 │ email (TEXT UNIQUE)    │        │
 │ password_hash (TEXT)   │        │
 │ created_at (TEXT)      │        │
 │ updated_at (TEXT)      │        │
 └────────────────────────┘        │
                                   │ 1:N
 ┌────────────────────────┐        │
 │         links          │        │
 ├────────────────────────┤        │
 │ id (TEXT PK)           │        │
 │ user_id (TEXT FK)──────┼────────┘
 │ original_url (TEXT)    │◄───────┐
 │ short_code (TEXT UNIQ) │        │
 │ title (TEXT)           │        │
 │ is_active (INTEGER)    │        │
 │ expires_at (TEXT)      │        │
 │ created_at (TEXT)      │        │
 │ updated_at (TEXT)      │        │
 └────────────────────────┘        │
                                   │ 1:N
 ┌────────────────────────┐        │
 │      click_events      │        │
 ├────────────────────────┤        │
 │ id (TEXT PK)           │        │
 │ link_id (TEXT FK)──────┼────────┘
 │ timestamp (TEXT)       │
 │ referrer_domain (TEXT) │
 │ browser (TEXT)         │
 │ os (TEXT)              │
 │ device_type (TEXT)     │
 │ country_code (TEXT)    │
 │ visitor_hash (TEXT)    │
 │ is_bot (INTEGER)       │
 └────────────────────────┘
```

---

## 2. Table DDL & Column Specifications

```sql
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    updated_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. Links Table
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

CREATE UNIQUE INDEX IF NOT EXISTS idx_links_short_code ON links(short_code);
CREATE INDEX IF NOT EXISTS idx_links_user_id ON links(user_id);
CREATE INDEX IF NOT EXISTS idx_links_created_at ON links(created_at);

-- 3. Click Events Table
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

CREATE INDEX IF NOT EXISTS idx_clicks_link_id ON click_events(link_id);
CREATE INDEX IF NOT EXISTS idx_clicks_timestamp ON click_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_clicks_link_timestamp ON click_events(link_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_clicks_visitor_hash ON click_events(visitor_hash);
CREATE INDEX IF NOT EXISTS idx_clicks_is_bot ON click_events(is_bot);
```

---

## 3. Query Optimization & Aggregations

1. **Total Clicks in Date Range:**
   ```sql
   SELECT COUNT(*) as total_clicks
   FROM click_events c
   JOIN links l ON c.link_id = l.id
   WHERE l.user_id = ? AND c.is_bot = 0 AND c.timestamp >= ?;
   ```
2. **Estimated Unique Visitors:**
   ```sql
   SELECT COUNT(DISTINCT c.visitor_hash) as unique_visitors
   FROM click_events c
   JOIN links l ON c.link_id = l.id
   WHERE l.user_id = ? AND c.is_bot = 0 AND c.timestamp >= ?;
   ```
3. **Time-Series Bucketing:**
   Aggregate events by day or hour using SQLite's `strftime('%Y-%m-%d', timestamp)` or `strftime('%Y-%m-%d %H:00', timestamp)`.
4. **Dimension Groupings:**
   `device_type`, `browser`, `os`, and `referrer_domain` are indexed or queried over filtered `link_id` ranges for sub-millisecond aggregation times.
