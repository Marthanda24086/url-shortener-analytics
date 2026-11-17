const { createClient } = require('@libsql/client');
const bcrypt = require('bcryptjs');
const path = require('path');
const crypto = require('crypto');

async function seed() {
  const dbPath = path.resolve(process.cwd(), 'kairo.db');
  const db = createClient({ url: `file:${dbPath}` });

  console.log('🌱 Seeding Kairo database...');

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

  // Check if demo user exists
  const existingUser = await db.execute({
    sql: 'SELECT id FROM users WHERE email = ?',
    args: ['demo@kairo.sh']
  });

  let userId = 'usr_demo_kairo';
  if (existingUser.rows.length === 0) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('Password123!', salt);
    await db.execute({
      sql: 'INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)',
      args: [userId, 'Alex Vance (Founding Engineer)', 'demo@kairo.sh', hash]
    });
    console.log('✅ Demo user created: demo@kairo.sh / Password123!');
  } else {
    userId = existingUser.rows[0].id;
    console.log('ℹ️ Demo user already exists.');
  }

  // Create sample links if none
  const existingLinks = await db.execute({
    sql: 'SELECT COUNT(*) as count FROM links WHERE user_id = ?',
    args: [userId]
  });

  if (Number(existingLinks.rows[0].count) === 0) {
    const sampleLinks = [
      {
        id: 'lnk_kairo_01',
        shortCode: 'github-kairo',
        title: 'Kairo Core GitHub Repository',
        originalUrl: 'https://github.com/topics/url-shortener',
        daysAgo: 14,
      },
      {
        id: 'lnk_kairo_02',
        shortCode: 'launch-v2',
        title: 'Product Hunt Launch Announcement',
        originalUrl: 'https://www.producthunt.com',
        daysAgo: 10,
      },
      {
        id: 'lnk_kairo_03',
        shortCode: 'tech-docs',
        title: 'Kairo Architecture & REST API Docs',
        originalUrl: 'https://developer.mozilla.org/en-US/docs/Web/API',
        daysAgo: 7,
      },
      {
        id: 'lnk_kairo_04',
        shortCode: 'summer-demo',
        title: 'Interactive Live Demo Environment',
        originalUrl: 'https://nextjs.org/showcase',
        daysAgo: 3,
      },
    ];

    const browsers = ['Chrome', 'Safari', 'Firefox', 'Edge'];
    const oss = ['macOS', 'Windows 10/11', 'iOS', 'Android', 'Linux'];
    const devices = ['Desktop', 'Mobile', 'Tablet'];
    const referrers = ['Direct', 'Google', 'X / Twitter', 'LinkedIn', 'GitHub', 'Reddit'];

    for (const link of sampleLinks) {
      const createdDate = new Date();
      createdDate.setDate(createdDate.getDate() - link.daysAgo);
      const createdAt = createdDate.toISOString().replace('T', ' ').slice(0, 19);

      await db.execute({
        sql: `INSERT INTO links (id, user_id, original_url, short_code, title, is_active, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
        args: [link.id, userId, link.originalUrl, link.shortCode, link.title, createdAt, createdAt]
      });

      // Generate realistic click events distributed across past days
      const totalEvents = Math.floor(Math.random() * 80) + 40;
      for (let i = 0; i < totalEvents; i++) {
        const eventDate = new Date(createdDate.getTime() + Math.random() * (Date.now() - createdDate.getTime()));
        const eventTs = eventDate.toISOString().replace('T', ' ').slice(0, 19);
        const browser = browsers[Math.floor(Math.random() * browsers.length)];
        const os = oss[Math.floor(Math.random() * oss.length)];
        const device = devices[Math.floor(Math.random() * devices.length)];
        const referrer = referrers[Math.floor(Math.random() * referrers.length)];
        const visitorHash = crypto.createHash('sha256').update(`visitor_${i % 25}`).digest('hex').slice(0, 16);

        await db.execute({
          sql: `INSERT INTO click_events (id, link_id, timestamp, referrer_domain, browser, os, device_type, country_code, visitor_hash, is_bot)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'US', ?, 0)`,
          args: [`clk_${crypto.randomUUID()}`, link.id, eventTs, referrer, browser, os, device, visitorHash]
        });
      }
    }
    console.log('✅ Created 4 sample links and populated realistic click events.');
  }

  console.log('🎉 Seeding completed successfully!');
}

seed().catch(console.error);
