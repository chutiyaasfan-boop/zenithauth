/**
 * Zenith Auth - Database Engine
 * Dual-engine support: Embedded SQLite 3 (local) & PostgreSQL (Render.com production)
 */

const { DatabaseSync } = require('node:sqlite');
const crypto = require('node:crypto');
const path = require('node:path');
const fs = require('node:fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'zenith.db');
const db = new DatabaseSync(DB_PATH);

// Enable WAL mode and foreign keys for high throughput and consistency
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
`);

/**
 * Generate permanent 10-character alphanumeric Owner ID
 * Exactly 10 characters (alphanumeric uppercase)
 */
function generateOwnerId(seed = '') {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let id = '';
  const hash = crypto.createHash('sha256').update(seed || crypto.randomBytes(16)).digest();
  for (let i = 0; i < 10; i++) {
    id += chars[hash[i] % chars.length];
  }
  return id;
}

/**
 * Generate cryptographically secure 64-character hexadecimal App Secret Key
 */
function generateAppSecret() {
  return crypto.randomBytes(32).toString('hex'); // exactly 64 hex characters
}

/**
 * Password Hashing Helper using PBKDF2
 */
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.includes(':')) return false;
  const [salt, originalHash] = storedHash.split(':');
  const computedHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(originalHash, 'hex'), Buffer.from(computedHash, 'hex'));
}

/**
 * Generate Secure License Key: XXXX-XXXX-XXXX-XXXX
 * Exactly 16 alphanumeric characters separated by hyphens
 */
function generateKey(prefix = null, length = 16) {
  const chars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let randomPart = '';
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    randomPart += chars[bytes[i] % chars.length];
  }
  const formatted = randomPart.match(/.{1,4}/g).join('-');
  if (prefix && prefix.trim()) {
    return `${prefix.trim().toUpperCase()}-${formatted}`;
  }
  return formatted;
}

/**
 * Initialize all Database Tables & Schema Migrations
 */
function initDatabase() {
  db.exec(`
    -- 1. Users / Accounts
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'Administrator', -- Administrator, Seller, Manager, Reseller
      owner_id TEXT UNIQUE,              -- Permanent 10-char Owner ID
      account_plan TEXT DEFAULT 'TESTER',-- TESTER, DEVELOPER, SELLER
      billing_cycle TEXT DEFAULT 'monthly', -- monthly, yearly
      plan_expires_at TEXT,
      app_id INTEGER DEFAULT 1,
      plan_id INTEGER DEFAULT 1,
      expiry_date TEXT,
      status TEXT DEFAULT 'active',      -- active, banned, expired
      hwid TEXT DEFAULT '',
      ip_address TEXT DEFAULT '127.0.0.1',
      last_login TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- 2. Applications
    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      version TEXT DEFAULT '1.0.0',
      status TEXT DEFAULT 'active', -- active, paused, disabled
      secret_key TEXT NOT NULL,     -- 64-character hexadecimal
      public_key TEXT NOT NULL,
      owner_id TEXT NOT NULL,       -- Permanent 10-char Owner ID
      user_id INTEGER DEFAULT 1,    -- Account owner
      description TEXT DEFAULT '',
      hwid_lock INTEGER DEFAULT 1,
      ip_lock INTEGER DEFAULT 0,
      hash_check INTEGER DEFAULT 0,
      max_sessions INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- 3. Application Settings
    CREATE TABLE IF NOT EXISTS application_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      app_id INTEGER UNIQUE NOT NULL,
      webhook_url TEXT DEFAULT '',
      webhook_events TEXT DEFAULT 'login,register,license_activate',
      token_validation INTEGER DEFAULT 1,
      whitelist_enabled INTEGER DEFAULT 0,
      blacklist_enabled INTEGER DEFAULT 1,
      session_timeout INTEGER DEFAULT 60,
      custom_css TEXT DEFAULT '',
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (app_id) REFERENCES applications(id) ON DELETE CASCADE
    );

    -- 4. Subscription Plans
    CREATE TABLE IF NOT EXISTS subscription_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      app_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      level INTEGER DEFAULT 1,
      duration_days INTEGER DEFAULT 30,
      description TEXT DEFAULT '',
      price REAL DEFAULT 19.99,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (app_id) REFERENCES applications(id) ON DELETE CASCADE
    );

    -- 5. Subscriptions
    CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      plan_id INTEGER NOT NULL,
      start_date TEXT DEFAULT (datetime('now')),
      expiry_date TEXT,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE CASCADE
    );

    -- 6. Licenses (Format: XXXX-XXXX-XXXX-XXXX)
    CREATE TABLE IF NOT EXISTS licenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      app_id INTEGER NOT NULL,
      plan_id INTEGER NOT NULL,
      license_key TEXT UNIQUE NOT NULL,
      length INTEGER DEFAULT 16,
      duration_days INTEGER DEFAULT 30,
      hwid_bound INTEGER DEFAULT 1,
      hwid_val TEXT DEFAULT '',
      activation_limit INTEGER DEFAULT 1,
      activations_count INTEGER DEFAULT 0,
      status TEXT DEFAULT 'unused', -- unused, active, banned, expired, revoked
      created_by TEXT DEFAULT 'admin',
      used_by TEXT DEFAULT '',
      bound_user TEXT DEFAULT '',
      last_login TEXT,
      expiry_date TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (app_id) REFERENCES applications(id) ON DELETE CASCADE,
      FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE CASCADE
    );

    -- 7. Tokens
    CREATE TABLE IF NOT EXISTS tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      app_id INTEGER NOT NULL,
      user_id INTEGER DEFAULT 0,
      token_val TEXT UNIQUE NOT NULL,
      type TEXT DEFAULT 'API', -- API, Client, Loader, Temp
      assigned_to TEXT DEFAULT 'System',
      expires_at TEXT,
      status TEXT DEFAULT 'active', -- active, revoked, expired
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (app_id) REFERENCES applications(id) ON DELETE CASCADE
    );

    -- 8. Web Loader Buttons
    CREATE TABLE IF NOT EXISTS web_loader_buttons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      app_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      display_order INTEGER DEFAULT 1,
      action_type TEXT DEFAULT 'Launch', -- Launch, Download, Validate, Custom Callback
      callback_url TEXT DEFAULT '',
      enabled INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (app_id) REFERENCES applications(id) ON DELETE CASCADE
    );

    -- 9. Chatrooms (Channels)
    CREATE TABLE IF NOT EXISTS chatrooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      app_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      topic TEXT DEFAULT '',
      is_private INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (app_id) REFERENCES applications(id) ON DELETE CASCADE
    );

    -- 10. Chat Messages
    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      channel_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      username TEXT NOT NULL,
      user_role TEXT DEFAULT 'Administrator',
      message TEXT NOT NULL,
      target_username TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (channel_id) REFERENCES chatrooms(id) ON DELETE CASCADE
    );

    -- 11. Team Members
    CREATE TABLE IF NOT EXISTS team_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      email TEXT NOT NULL,
      role TEXT NOT NULL, -- Manager, Reseller
      assigned_apps TEXT DEFAULT '1',
      permissions_json TEXT DEFAULT '[]',
      key_balance INTEGER DEFAULT 0,
      expiry_date TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- 12. Seller Credentials
    CREATE TABLE IF NOT EXISTS seller_credentials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      seller_key TEXT UNIQUE NOT NULL,
      endpoint_url TEXT NOT NULL,
      discord_webhook TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- 13. Seller Logs
    CREATE TABLE IF NOT EXISTS seller_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER DEFAULT 1,
      app_id INTEGER DEFAULT 1,
      event TEXT NOT NULL,
      action TEXT NOT NULL,
      ip_address TEXT DEFAULT '127.0.0.1',
      status TEXT DEFAULT 'success',
      details TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- 14. Global Variables
    CREATE TABLE IF NOT EXISTS global_variables (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      app_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      value TEXT NOT NULL,
      data_type TEXT DEFAULT 'string', -- string, number, boolean, json
      description TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (app_id) REFERENCES applications(id) ON DELETE CASCADE
    );

    -- 15. User Variables
    CREATE TABLE IF NOT EXISTS user_variables (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      app_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      username TEXT NOT NULL,
      name TEXT NOT NULL,
      value TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (app_id) REFERENCES applications(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- 16. Sessions
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      username TEXT NOT NULL,
      session_token TEXT UNIQUE NOT NULL,
      ip_address TEXT DEFAULT '127.0.0.1',
      user_agent TEXT DEFAULT '',
      device_info TEXT DEFAULT 'Desktop Windows',
      created_at TEXT DEFAULT (datetime('now')),
      last_activity TEXT DEFAULT (datetime('now')),
      status TEXT DEFAULT 'active', -- active, revoked
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- 17. Files
    CREATE TABLE IF NOT EXISTS files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      app_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      mime_type TEXT DEFAULT 'application/octet-stream',
      file_path TEXT NOT NULL,
      upload_date TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (app_id) REFERENCES applications(id) ON DELETE CASCADE
    );

    -- 18. Security IP Rules (Whitelist / Blacklist)
    CREATE TABLE IF NOT EXISTS security_ip_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      app_id INTEGER NOT NULL,
      ip_address TEXT NOT NULL,
      rule_type TEXT NOT NULL, -- whitelist, blacklist
      note TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (app_id) REFERENCES applications(id) ON DELETE CASCADE
    );

    -- 19. Audit Logs
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER DEFAULT 0,
      username TEXT DEFAULT 'system',
      action TEXT NOT NULL,
      ip_address TEXT DEFAULT '127.0.0.1',
      user_agent TEXT DEFAULT '',
      details TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- 20. Notifications
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'info', -- info, success, warning, danger
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- 21. HWID Records & Protections
    CREATE TABLE IF NOT EXISTS hwid_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      app_id INTEGER NOT NULL,
      user_id INTEGER DEFAULT 0,
      username TEXT DEFAULT '',
      hwid TEXT NOT NULL,
      ip_address TEXT DEFAULT '127.0.0.1',
      status TEXT DEFAULT 'active', -- active, whitelisted, blacklisted, reset
      note TEXT DEFAULT '',
      last_seen TEXT DEFAULT (datetime('now')),
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (app_id) REFERENCES applications(id) ON DELETE CASCADE
    );

    -- 22. Webhooks
    CREATE TABLE IF NOT EXISTS webhooks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      app_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      webhook_url TEXT NOT NULL,
      events TEXT DEFAULT 'all',
      status TEXT DEFAULT 'active', -- active, paused
      secret_token TEXT,
      last_fired_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (app_id) REFERENCES applications(id) ON DELETE CASCADE
    );

    -- 23. Bot Integrations (Discord & Telegram)
    CREATE TABLE IF NOT EXISTS integrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      app_id INTEGER NOT NULL,
      type TEXT NOT NULL, -- discord_bot, telegram_bot
      bot_token TEXT DEFAULT '',
      client_id TEXT DEFAULT '',
      channel_id TEXT DEFAULT '',
      enabled INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (app_id) REFERENCES applications(id) ON DELETE CASCADE
    );

    -- 24. Event Logs
    CREATE TABLE IF NOT EXISTS event_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      app_id INTEGER NOT NULL,
      user_id INTEGER DEFAULT 0,
      event_type TEXT NOT NULL,
      description TEXT NOT NULL,
      ip_address TEXT DEFAULT '127.0.0.1',
      user_agent TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- 25. Account Logs
    CREATE TABLE IF NOT EXISTS account_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      ip_address TEXT DEFAULT '127.0.0.1',
      details TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- 26. Payment Transactions
    CREATE TABLE IF NOT EXISTS payment_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      plan_name TEXT NOT NULL,       -- DEVELOPER, SELLER
      billing_cycle TEXT NOT NULL,   -- monthly, yearly
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'USD',
      payment_method TEXT DEFAULT 'Credit Card',
      transaction_id TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'completed', -- completed, pending, failed
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Run schema migrations for existing databases
  try { db.exec("ALTER TABLE users ADD COLUMN owner_id TEXT;"); } catch {}
  try { db.exec("ALTER TABLE users ADD COLUMN account_plan TEXT DEFAULT 'TESTER';"); } catch {}
  try { db.exec("ALTER TABLE users ADD COLUMN billing_cycle TEXT DEFAULT 'monthly';"); } catch {}
  try { db.exec("ALTER TABLE users ADD COLUMN plan_expires_at TEXT;"); } catch {}
  try { db.exec("ALTER TABLE applications ADD COLUMN owner_id TEXT;"); } catch {}
  try { db.exec("ALTER TABLE applications ADD COLUMN user_id INTEGER DEFAULT 1;"); } catch {}
  try { db.exec("ALTER TABLE licenses ADD COLUMN bound_user TEXT;"); } catch {}
  try { db.exec("ALTER TABLE licenses ADD COLUMN last_login TEXT;"); } catch {}
  try { db.exec("ALTER TABLE users ADD COLUMN allowed_devices INTEGER DEFAULT 1;"); } catch {}

  seedInitialData();
}

/**
 * Seed initial administrative and demonstration records
 */
function seedInitialData() {
  const userCount = db.prepare('SELECT count(*) as count FROM users').get().count;

  // Make sure admin has owner_id and plan
  const adminOwnerId = generateOwnerId('admin@zenithauth.io');
  const zeeshanOwnerId = generateOwnerId('zeeshan1710@fam');
  const zeeshanHash = hashPassword('ZEESHAN@0517');

  // Seed / Upsert ZEESHAN1017 Master Administrator
  const zeeshan = db.prepare('SELECT id FROM users WHERE username = ?').get('ZEESHAN1017');
  if (!zeeshan) {
    db.prepare(`
      INSERT INTO users (username, email, password_hash, role, owner_id, account_plan, app_id, plan_id, expiry_date, status, hwid)
      VALUES ('ZEESHAN1017', 'zeeshan1710@fam', ?, 'Administrator', ?, 'SELLER', 1, 3, '2036-12-31', 'active', 'HWID-ZEESHAN-ROOT-SUPERADMIN')
    `).run(zeeshanHash, zeeshanOwnerId);
  } else {
    db.prepare(`
      UPDATE users 
      SET password_hash = ?, 
          role = 'Administrator', 
          account_plan = 'SELLER', 
          owner_id = ?
      WHERE username = 'ZEESHAN1017'
    `).run(zeeshanHash, zeeshanOwnerId);
  }

  if (userCount > 0) {
    db.prepare(`
      UPDATE users 
      SET owner_id = coalesce(owner_id, ?), 
          account_plan = 'SELLER' 
      WHERE username = 'admin'
    `).run(adminOwnerId);

    // Ensure all users have a 10-char Owner ID
    const allUsers = db.prepare('SELECT id, email, owner_id FROM users').all();
    for (const u of allUsers) {
      if (!u.owner_id) {
        db.prepare('UPDATE users SET owner_id = ? WHERE id = ?').run(generateOwnerId(u.email), u.id);
      }
    }

    // Update applications with 64-character secret and owner_id if missing
    const apps = db.prepare('SELECT id, secret_key, owner_id FROM applications').all();
    for (const a of apps) {
      const sec = a.secret_key && a.secret_key.length === 64 ? a.secret_key : generateAppSecret();
      const own = a.owner_id || adminOwnerId;
      db.prepare('UPDATE applications SET secret_key = ?, owner_id = ? WHERE id = ?').run(sec, own, a.id);
    }
    return;
  }

  console.log('[Zenith DB] Seeding initial production database records...');

  // 1. Initial Application with 64-char Hex Secret Key & 10-char Owner ID
  const appSecret = generateAppSecret();
  const appPub = 'za_pub_' + crypto.randomBytes(12).toString('hex');
  db.prepare(`
    INSERT INTO applications (id, name, version, status, secret_key, public_key, owner_id, user_id, description, hwid_lock, ip_lock, hash_check, max_sessions)
    VALUES (1, 'Zenith Core Engine', '2.4.0', 'active', ?, ?, ?, 1, 'Flagship authentication & security suite', 1, 0, 1, 1)
  `).run(appSecret, appPub, adminOwnerId);

  // Application Settings
  db.prepare(`
    INSERT INTO application_settings (app_id, webhook_url, webhook_events, token_validation, whitelist_enabled, blacklist_enabled, session_timeout)
    VALUES (1, 'https://discord.com/api/webhooks/zenith-sample', 'login,register,license_activate,token_verify', 1, 0, 1, 120)
  `).run();

  // 2. Subscription Plans
  db.prepare(`
    INSERT INTO subscription_plans (id, app_id, name, level, duration_days, description, price, status)
    VALUES 
    (1, 1, 'Standard Monthly', 1, 30, 'Full client access with standard rate limits and HWID lock', 14.99, 'active'),
    (2, 1, 'Pro Quarterly', 2, 90, 'Enhanced priority bandwidth, custom user variables, and VIP chat access', 39.99, 'active'),
    (3, 1, 'Enterprise Lifetime', 99, 3650, 'Unlimited lifetime access, unrestricted tokens, and dedicated seller endpoint', 199.99, 'active')
  `).run();

  // 3. Administrator User (admin / zenith2026!)
  const adminHash = hashPassword('zenith2026!');
  const futureExpiry = new Date(Date.now() + 3650 * 86400000).toISOString().split('T')[0];
  db.prepare(`
    INSERT INTO users (id, username, email, password_hash, role, owner_id, account_plan, app_id, plan_id, expiry_date, status, hwid)
    VALUES (1, 'admin', 'admin@zenithauth.io', ?, 'Administrator', ?, 'SELLER', 1, 3, ?, 'active', 'HWID-ZENITH-ROOT-MASTER-9901')
  `).run(adminHash, adminOwnerId, futureExpiry);

  // Additional Seed Users
  const sellerOwnerId = generateOwnerId('seller@zenithauth.io');
  const sellerHash = hashPassword('seller2026!');
  db.prepare(`
    INSERT INTO users (id, username, email, password_hash, role, owner_id, account_plan, app_id, plan_id, expiry_date, status, hwid)
    VALUES (2, 'vortex_seller', 'seller@zenithauth.io', ?, 'Seller', ?, 'SELLER', 1, 2, ?, 'active', 'HWID-VORTEX-SELLER-1142')
  `).run(sellerHash, sellerOwnerId, new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0]);

  const devOwnerId = generateOwnerId('quantum@proton.me');
  const user2Hash = hashPassword('clientpass456');
  db.prepare(`
    INSERT INTO users (id, username, email, password_hash, role, owner_id, account_plan, app_id, plan_id, expiry_date, status, hwid)
    VALUES (4, 'quantum_dev', 'quantum@proton.me', ?, 'Manager', ?, 'DEVELOPER', 1, 3, ?, 'active', 'HWID-F332-901A-CC44-1299')
  `).run(user2Hash, devOwnerId, new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0]);

  const testerOwnerId = generateOwnerId('nexus@gmail.com');
  const user1Hash = hashPassword('clientpass123');
  db.prepare(`
    INSERT INTO users (id, username, email, password_hash, role, owner_id, account_plan, app_id, plan_id, expiry_date, status, hwid)
    VALUES (3, 'cyber_nexus', 'nexus@gmail.com', ?, 'Reseller', ?, 'TESTER', 1, 1, ?, 'active', 'HWID-A49F-22BC-9011-887E')
  `).run(user1Hash, testerOwnerId, new Date(Date.now() + 27 * 86400000).toISOString().split('T')[0]);

  // 4. Initial Licenses (Format: XXXX-XXXX-XXXX-XXXX)
  const keys = [
    { key: 'A9B2-44F1-8890-C012', plan: 2, days: 90, status: 'unused' },
    { key: 'E7C1-9923-5512-D884', plan: 2, days: 90, status: 'unused' },
    { key: 'F001-9944-1122-8877', plan: 3, days: 3650, status: 'active', user: 'admin', hwid: 'HWID-ZENITH-ROOT-MASTER-9901' },
    { key: 'B441-2299-7711-A338', plan: 1, days: 30, status: 'unused' },
    { key: 'C992-1144-8822-F550', plan: 1, days: 30, status: 'active', user: 'cyber_nexus', hwid: 'HWID-A49F-22BC-9011-887E' }
  ];

  for (const k of keys) {
    db.prepare(`
      INSERT INTO licenses (app_id, plan_id, license_key, length, duration_days, hwid_bound, hwid_val, status, created_by, used_by, bound_user, expiry_date)
      VALUES (1, ?, ?, 16, ?, 1, ?, ?, 'admin', ?, ?, ?)
    `).run(
      k.plan,
      k.key,
      k.days,
      k.hwid || '',
      k.status,
      k.user || '',
      k.user || '',
      k.status === 'active' ? new Date(Date.now() + k.days * 86400000).toISOString().split('T')[0] : null
    );
  }

  // 5. Initial Tokens
  db.prepare(`
    INSERT INTO tokens (app_id, user_id, token_val, type, assigned_to, expires_at, status)
    VALUES 
    (1, 1, 'zat_api_' + hex(randomblob(16)), 'API', 'Administrator (Root API)', datetime('now', '+365 days'), 'active'),
    (1, 1, 'zat_ldr_' + hex(randomblob(16)), 'Loader', 'Zenith Secure Bootloader v2.4', datetime('now', '+90 days'), 'active'),
    (1, 3, 'zat_clt_' + hex(randomblob(16)), 'Client', 'Client Session (cyber_nexus)', datetime('now', '+30 days'), 'active')
  `).run();

  // 6. Web Loader Buttons
  db.prepare(`
    INSERT INTO web_loader_buttons (app_id, name, description, display_order, action_type, callback_url, enabled)
    VALUES 
    (1, 'Launch Zenith Client', 'Direct boot sequence with HWID verification', 1, 'Launch', 'https://api.zenithauth.io/v1/client/boot', 1),
    (1, 'Download Core Module', 'Retrieves the latest AES-256 encrypted payload', 2, 'Download', 'https://api.zenithauth.io/v1/payloads/latest', 1),
    (1, 'Check License Validity', 'Verifies local HWID against Zenith server license record', 3, 'Validate', 'https://api.zenithauth.io/v1/client/license/verify', 1)
  `).run();

  // 7. Webhooks
  db.prepare(`
    INSERT INTO webhooks (user_id, app_id, name, webhook_url, events, status)
    VALUES 
    (1, 1, 'Discord Production Dispatcher', 'https://discord.com/api/webhooks/zenith-sample', 'login,register,license_activate', 'active'),
    (1, 1, 'Security Alerts Channel', 'https://discord.com/api/webhooks/zenith-alerts', 'hwid_mismatch,ban', 'active')
  `).run();

  // 8. Integrations
  db.prepare(`
    INSERT INTO integrations (user_id, app_id, type, bot_token, client_id, channel_id, enabled)
    VALUES 
    (1, 1, 'discord_bot', 'OTk4Mzg4OTAwOTk4ODg5.G9X8Y7.sample_token_for_discord', '109283746501928374', '109283746501928375', 1),
    (1, 1, 'telegram_bot', '718293849:AAFX987sample_telegram_bot_token', '', '-100192837465', 1)
  `).run();

  // 9. HWID Records
  db.prepare(`
    INSERT INTO hwid_records (app_id, user_id, username, hwid, ip_address, status, note)
    VALUES 
    (1, 1, 'admin', 'HWID-ZENITH-ROOT-MASTER-9901', '127.0.0.1', 'whitelisted', 'Developer workstation primary HWID'),
    (1, 2, 'vortex_seller', 'HWID-VORTEX-SELLER-1142', '127.0.0.1', 'active', 'Seller automated server node'),
    (1, 3, 'cyber_nexus', 'HWID-A49F-22BC-9011-887E', '127.0.0.1', 'active', 'Reseller client binding')
  `).run();

  // 10. Chatrooms
  db.prepare(`
    INSERT INTO chatrooms (id, app_id, name, topic, is_private)
    VALUES 
    (1, 1, 'general-announcements', 'Official Zenith Auth updates, announcements, and maintenance alerts', 0),
    (2, 1, 'developers-sdk', 'Discussion on C#, C++, Python, Rust integration and custom hooks', 0),
    (3, 1, 'vip-sellers', 'Wholesale license distribution, seller bot integrations, and API limits', 1)
  `).run();

  db.prepare(`
    INSERT INTO chat_messages (channel_id, user_id, username, user_role, message)
    VALUES 
    (1, 1, 'admin', 'Administrator', 'Welcome to ZENITH AUTH! The next-generation license management platform is now live.'),
    (1, 2, 'vortex_seller', 'Seller', 'Connected to the seller API. Discord bot auto-vending is enabled.'),
    (2, 1, 'admin', 'Administrator', 'SDK v2.4.0 is deployed with zero-allocation socket streaming and HWID binding support.')
  `).run();

  // 11. Team Members
  const managerPerms = JSON.stringify([
    'Whitelist', 'Blacklist', 'Session', 'Variables', 'Files', 'Webhook', 
    'Auditlog', 'App Settings', 'Subscription', 'Licenses', 'Chatroom', 'User Variables', 'Logs'
  ]);
  db.prepare(`
    INSERT INTO team_members (user_id, email, role, assigned_apps, permissions_json, key_balance, expiry_date)
    VALUES 
    (4, 'quantum@proton.me', 'Manager', '1', ?, 0, datetime('now', '+365 days')),
    (3, 'nexus@gmail.com', 'Reseller', '1', '["Licenses", "Users"]', 250, datetime('now', '+180 days'))
  `).run(managerPerms);

  // 12. Seller Credentials
  const sellerKey = 'zenith_sk_' + crypto.randomBytes(24).toString('hex');
  db.prepare(`
    INSERT INTO seller_credentials (user_id, seller_key, endpoint_url, discord_webhook)
    VALUES (1, ?, 'http://127.0.0.1:3000/api/v1/seller', 'https://discord.com/api/webhooks/zenith_seller_alert')
  `).run(sellerKey);

  // 13. Global & User Variables
  db.prepare(`
    INSERT INTO global_variables (app_id, name, value, data_type, description)
    VALUES 
    (1, 'API_MAINTENANCE_MODE', 'false', 'boolean', 'Emergency kill-switch for client connections'),
    (1, 'MIN_CLIENT_VERSION', '2.4.0', 'string', 'Enforced minimum client version for handshake'),
    (1, 'MAX_CONCURRENT_USERS', '10000', 'number', 'Maximum active socket sessions allowed per instance'),
    (1, 'FEATURE_FLAGS', '{"hwid_bypass": false, "stealth_heartbeat": true, "anti_debug": true}', 'json', 'Global security engine runtime flags')
  `).run();

  db.prepare(`
    INSERT INTO user_variables (app_id, user_id, username, name, value)
    VALUES 
    (1, 1, 'admin', 'CUSTOM_SLOT_LIMIT', '999'),
    (1, 3, 'cyber_nexus', 'RESELLER_DISCOUNT_PERCENT', '25'),
    (1, 4, 'quantum_dev', 'DEV_BYPASS_HASH_CHECK', 'true')
  `).run();

  // 14. Event Logs & Account Logs
  db.prepare(`
    INSERT INTO event_logs (app_id, user_id, event_type, description, ip_address)
    VALUES 
    (1, 1, 'APPLICATION_INITIALIZATION', 'Zenith Core Engine initialized with 64-character secret', '127.0.0.1'),
    (1, 1, 'SECURITY_POLICY_ENFORCED', 'Hardware ID protection set to mandatory verification', '127.0.0.1'),
    (1, 2, 'LICENSE_GENERATED', 'Seller generated license key batch for customer', '127.0.0.1')
  `).run();

  db.prepare(`
    INSERT INTO account_logs (user_id, action, ip_address, details)
    VALUES 
    (1, 'ACCOUNT_CREATED', '127.0.0.1', 'Master Administrator account provisioned'),
    (1, 'OWNER_ID_ASSIGNED', '127.0.0.1', 'Assigned permanent 10-char Owner ID'),
    (2, 'PLAN_UPGRADE', '127.0.0.1', 'Seller plan active with Telegram and Discord bot access')
  `).run();

  db.prepare(`
    INSERT INTO audit_logs (user_id, username, action, ip_address, details)
    VALUES 
    (1, 'admin', 'SYSTEM_INITIALIZATION', '127.0.0.1', 'Zenith Auth database provisioned with initial security policies'),
    (1, 'admin', 'APPLICATION_CREATED', '127.0.0.1', 'Application Zenith Core Engine initialized with HWID binding')
  `).run();

  db.prepare(`
    INSERT INTO seller_logs (user_id, app_id, event, action, ip_address, status, details)
    VALUES 
    (1, 1, 'LICENSE_GEN', 'Bulk Key Batch', '127.0.0.1', 'success', 'Generated 5 initial multi-tier keys'),
    (2, 1, 'API_AUTH', 'Discord Bot Handshake', '127.0.0.1', 'success', 'Validated seller signature and queried balance')
  `).run();

  // 15. Notifications
  db.prepare(`
    INSERT INTO notifications (user_id, title, message, type)
    VALUES 
    (1, 'Welcome to Zenith Auth', 'Your platform has been initialized successfully. Inspect SDK docs to connect your client.', 'success'),
    (1, 'Security Advisory', 'Default Administrator password set. Remember to update your credentials in Account Settings.', 'warning')
  `).run();

  // 16. Payment Transaction Record
  db.prepare(`
    INSERT INTO payment_transactions (user_id, plan_name, billing_cycle, amount, currency, payment_method, transaction_id, status)
    VALUES 
    (1, 'SELLER', 'yearly', 23.99, 'USD', 'Credit Card', 'TXN_ZENITH_INIT_001', 'completed')
  `).run();

  console.log('[Zenith DB] Database initialized and seeded successfully.');
}

module.exports = {
  db,
  initDatabase,
  hashPassword,
  verifyPassword,
  generateKey,
  generateOwnerId,
  generateAppSecret
};
