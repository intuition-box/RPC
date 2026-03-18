import Database from 'better-sqlite3';
import { randomBytes } from 'crypto';
import { existsSync, mkdirSync } from 'fs';

const DB_PATH = process.env.DB_PATH || '/data/gateway.db';
const dir = DB_PATH.substring(0, DB_PATH.lastIndexOf('/'));
if (dir && !existsSync(dir)) mkdirSync(dir, { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('busy_timeout = 5000');

db.exec(`
  CREATE TABLE IF NOT EXISTS api_keys (
    key TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    revoked INTEGER DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    api_key TEXT,
    method TEXT,
    path TEXT,
    status INTEGER,
    latency_ms INTEGER,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_requests_key ON requests(api_key);
  CREATE INDEX IF NOT EXISTS idx_requests_created ON requests(created_at);
`);

export function generateKey() {
  return randomBytes(16).toString('hex');
}

export function addKey(name) {
  const key = generateKey();
  db.prepare('INSERT INTO api_keys (key, name) VALUES (?, ?)').run(key, name);
  return key;
}

export function revokeKey(key) {
  const result = db.prepare('UPDATE api_keys SET revoked = 1 WHERE key = ?').run(key);
  return result.changes > 0;
}

export function rotateKey(oldKey) {
  const row = db.prepare('SELECT name FROM api_keys WHERE key = ? AND revoked = 0').get(oldKey);
  if (!row) return null;
  revokeKey(oldKey);
  return addKey(row.name);
}

export function listKeys() {
  return db.prepare(`
    SELECT k.key, k.name, k.created_at, k.revoked,
      (SELECT COUNT(*) FROM requests r WHERE r.api_key = k.key) as total_requests,
      (SELECT COUNT(*) FROM requests r WHERE r.api_key = k.key AND r.created_at > datetime('now', '-1 hour')) as last_hour,
      (SELECT COUNT(*) FROM requests r WHERE r.api_key = k.key AND r.created_at > datetime('now', '-1 day')) as last_day,
      (SELECT COUNT(*) FROM requests r WHERE r.api_key = k.key AND r.created_at > datetime('now', 'start of month')) as this_month
    FROM api_keys k
    ORDER BY k.created_at DESC
  `).all();
}

export function isValidKey(key) {
  const row = db.prepare('SELECT 1 FROM api_keys WHERE key = ? AND revoked = 0').get(key);
  return !!row;
}

export function hasAnyKeys() {
  const row = db.prepare('SELECT 1 FROM api_keys WHERE revoked = 0 LIMIT 1').get();
  return !!row;
}

export function logRequest(apiKey, method, path, status, latencyMs) {
  db.prepare('INSERT INTO requests (api_key, method, path, status, latency_ms) VALUES (?, ?, ?, ?, ?)')
    .run(apiKey || 'anonymous', method, path, status, latencyMs);
}

export function getStats(apiKey) {
  const where = apiKey ? 'WHERE api_key = ?' : '';
  const params = apiKey ? [apiKey] : [];
  return {
    total: db.prepare(`SELECT COUNT(*) as c FROM requests ${where}`).get(...params).c,
    lastHour: db.prepare(`SELECT COUNT(*) as c FROM requests ${where ? where + ' AND' : 'WHERE'} created_at > datetime('now', '-1 hour')`).get(...params).c,
    lastDay: db.prepare(`SELECT COUNT(*) as c FROM requests ${where ? where + ' AND' : 'WHERE'} created_at > datetime('now', '-1 day')`).get(...params).c,
    thisMonth: db.prepare(`SELECT COUNT(*) as c FROM requests ${where ? where + ' AND' : 'WHERE'} created_at > datetime('now', 'start of month')`).get(...params).c,
  };
}

export default db;
