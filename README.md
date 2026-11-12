# ZENITH AUTH
### Complete Authentication & License Management Platform

Zenith Auth is a commercial-grade, multi-tenant SaaS authentication and cryptographic license management platform engineered for software developers, publishers, and security engineers.

---

## 1. Feature Highlights

- **Original Dark UI/UX Theme**: Built strictly to the design specification:
  - Background: `#101010`
  - Sidebar: `#111111`
  - Cards: `#151515`
  - Borders: `#252525`
  - Primary text: `#FFFFFF`
  - Secondary text: `#929292`
  - Accent: High-tech Violet / Indigo (`#6366f1` / `#8b5cf6`) with smooth glow effects.
- **Role-Based Access Control (RBAC)**:
  - **Administrator**: Full platform sovereignty, application creation, and root configuration.
  - **Seller**: External API key vending, license batch issuance, and Discord bot integration.
  - **Manager**: Configurable page-level permission grants.
  - **Reseller**: Pre-allocated key quotas and user provisioning.
- **License Management Engine**:
  - Cryptographically secure unique license keys with custom prefixes, lengths, and masks.
  - Hardware ID (HWID) lock binding, activation limit thresholds, and automatic expiration.
  - Bulk key generation, CSV/JSON export, and one-click revocation.
- **Client & Software Integration**:
  - Ready-to-use SDKs for **11 programming languages**: C#, C++, Java, Python, PHP, VB.NET, JavaScript, TypeScript, Rust, Go, and Ruby.
  - Handshake protocol (`/api/v1/client/init`) with minimum client version enforcement.
  - Anti-tamper HWID verification (`/api/v1/client/login`).
  - License validation and keepalive heartbeat sockets (`/api/v1/client/session/ping`).
- **Real-Time Communication**:
  - Server-Sent Events (SSE) synchronized multi-channel chatrooms with instant push updates.
- **Developer & Seller Ecosystem**:
  - Seller REST API with custom bearer secret rotation.
  - Discord webhook dispatch for login, registration, and unauthorized access attempts.
- **High-Performance Architecture**:
  - Zero-dependency Node.js HTTP server.
  - Embedded SQLite 3 database operating with WAL mode (Write-Ahead Logging) and foreign key constraints.

---

## 2. Directory Structure

```
ZENITHAUTH/
├── package.json               # NPM package manifest
├── server.js                  # Core HTTP, REST API, SSE & static file server
├── database.js                # Embedded SQLite schema, migrations & seed engine
├── .env                       # Environment configuration
├── .env.example               # Template environment configuration
├── start.bat                  # One-click Windows runner
├── node.cmd                   # Local Node.js launcher shim
├── npm.cmd                    # Local NPM launcher shim
├── public/                    # Frontend SPA Web Client
│   ├── index.html             # Main application layout
│   ├── css/
│   │   └── zenith.css         # Custom premium dark theme stylesheet
│   ├── js/
│   │   ├── app.js             # SPA Router, controllers, modals & state management
│   │   ├── icons.js           # Lucide SVG vector icon library
│   │   └── sdk-snippets.js    # Interactive SDK code samples for all 11 languages
│   └── uploads/               # Persistent file upload store
└── sdk/                       # Standalone SDK source files for external projects
    ├── ZenithAuth.cs          # C# SDK (.NET 6 / 7 / 8 / Framework)
    ├── ZenithAuth.hpp         # C++ SDK (WinINet)
    ├── ZenithAuth.java        # Java SDK (HttpClient)
    ├── zenith_auth.py         # Python SDK (requests)
    ├── ZenithAuth.php         # PHP SDK (cURL)
    ├── ZenithAuth.vb          # VB.NET SDK
    ├── zenith-auth.js         # JavaScript SDK (Browser / Node.js)
    ├── zenith-auth.ts         # TypeScript SDK
    ├── zenith_auth.rs         # Rust SDK (reqwest)
    ├── zenith_auth.go         # Go SDK (net/http)
    └── zenith_auth.rb         # Ruby SDK (Net::HTTP)
```

---

## 3. Getting Started

### Prerequisites
Node.js 20+ is required. If running on this workstation, `node.cmd` and `npm.cmd` are pre-configured.

### Quick Launch
To start the Zenith Auth platform immediately:

```bash
# Option 1: Double-click start.bat
start.bat

# Option 2: Command line
.\node.cmd server.js
```

The console will boot on `http://localhost:3000`.

---

## 4. Default Seed Credentials

Upon initial launch, Zenith Auth initializes the database (`zenith.db`) and seeds the following accounts:

| Role | Username / Identity | Password | Description |
|---|---|---|---|
| **Administrator** | `admin` (or `admin@zenithauth.io`) | `zenith2026!` | Root master console access |
| **Seller** | `vortex_seller` | `seller2026!` | Wholesale vendor account |
| **Manager** | `quantum_dev` | `clientpass456` | Operations manager |
| **Reseller** | `cyber_nexus` | `clientpass123` | Quota-based reseller |

---

## 5. Client Integration Endpoints

All endpoints accept and return `application/json`:

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/client/init` | Client handshake, integrity, and version verification |
| `POST` | `/api/v1/client/login` | Software user login and HWID binding |
| `POST` | `/api/v1/client/register` | User registration using an unredeemed license key |
| `POST` | `/api/v1/client/license/activate` | Direct license key activation |
| `POST` | `/api/v1/client/license/verify` | License validation, duration, and tier check |
| `POST` | `/api/v1/client/token/verify` | Bearer token authorization |
| `POST` | `/api/v1/client/vars` | Fetch global and user-specific variables |
| `POST` | `/api/v1/client/session/ping` | Keepalive heartbeat |
| `POST` | `/api/v1/seller/keys/generate` | External Seller API key batch generation |
| `GET` | `/api/v1/seller/licenses` | Query seller inventory and issued keys |

---

## 6. Three Account Modes / Plans

Zenith Auth enforces 3 distinct subscription modes at the backend database & API layer:

| Feature / Limit | TESTER (FREE) | DEVELOPER ($2.49/mo, $12.99/yr) | SELLER ($3.49/mo, $23.99/yr) |
|---|---|---|---|
| **Monthly Price** | $0.00 | $2.49 / month | $3.49 / month |
| **Yearly Price** | $0.00 | $12.99 / year (50% OFF) | $23.99 / year (50% OFF) |
| **Max Applications** | 2 applications | **Unlimited** | **Unlimited** |
| **Max Users per App** | 15 users | 20,000 users | **Unlimited** |
| **Outbound Webhooks** | 2 webhooks | **Unlimited** | **Unlimited** |
| **Discord Bot Vending** | ✕ | ✕ | **Included** |
| **Telegram Bot Vending** | ✕ | ✕ | **Included** |
| **Reseller Network** | ✕ | ✕ | **Included** |
| **Team Management** | ✕ | ✕ | **Included** |
| **Security Event Logs** | ✕ | **Included** | **Included** |
| **Seller Vending Logs** | ✕ | ✕ | **Included** |

---

## 7. Render.com Production Deployment

Zenith Auth is configured for zero-friction cloud deployment on **Render.com** with support for SQLite (WAL mode) or managed PostgreSQL.

### One-Click Blueprint Deployment via `render.yaml`

1. Push your repository to GitHub or GitLab.
2. In the Render Dashboard, click **New +** → **Blueprint**.
3. Connect your repository. Render automatically reads `render.yaml` and provisions:
   - Web Service (`zenith-auth`)
   - Managed PostgreSQL Database (`zenith-db`)
   - Automated environment secrets (`JWT_SECRET`, `SESSION_SECRET`, `ENCRYPTION_KEY`)
   - Health check path monitoring at `/api/health`
4. Click **Apply**. Render will run `npm install` and launch `node server.js`.

### Manual Web Service Setup on Render.com

- **Environment**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `node server.js`
- **Health Check Path**: `/api/health`
- **Environment Variables**:
  - `NODE_ENV`: `production`
  - `PORT`: `3000` (Render binds this port automatically)
  - `HOST`: `0.0.0.0`
  - `DATABASE_URL`: (Optional PostgreSQL connection string; defaults to embedded SQLite if unset)

---

## 8. 16 Distinct Dashboard Pages

The platform provides 16 production modules accessible in the navigation sidebar:

1. **Dashboard (Overview)**: Welcome banner, 4 wireframe stat cards, and interactive SDK code constructor with live client credentials.
2. **Applications**: Multi-tenant application manager with 64-character hexadecimal secret rotation and on-demand reveal.
3. **Users**: User lifecycle manager, credential storage, status toggling, import/export.
4. **Licenses**: License vending engine generating `XXXX-XXXX-XXXX-XXXX` format keys, batch generation, renewal, and HWID binding resets.
5. **HWID Management**: Hardware ID verification rules, device whitelist, and blacklist management.
6. **Sessions**: Live client connection tracker with instant single and bulk session kill switches.
7. **Variables**: Dynamic server-side global and user-scoped configuration variables.
8. **File Management**: AES-256 cloud encrypted asset repository for payload distribution.
9. **Webhooks**: Real-time event dispatchers with backend plan quota enforcement.
10. **Integrations**: Automated Discord and Telegram license vending bot daemons.
11. **Team Management**: Granular RBAC delegation for managers and resellers.
12. **Resellers**: External storefront API keys, balance management, and webhook alerts.
13. **Logs**: Forensic audit trail with Event Logs, Account Logs, Seller Logs, and System Audit Logs.
14. **Analytics**: Real-time telemetry, 7-day activity timeline, and operating system distribution.
15. **Subscription**: Multi-tier billing console with monthly/yearly toggle and verified payment upgrade flow.
16. **Account Settings**: Permanent Master Owner ID display, password rotation, and profile management.
