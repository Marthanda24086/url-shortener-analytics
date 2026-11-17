# KAIRO — Precision Link Infrastructure & Advanced Click Analytics

<div align="center">
  <h3>Intelligent Short Links. Real-Time Telemetry. Privacy-First Audience Intelligence.</h3>
  <p>A production-ready, commercial SaaS URL Shortener and Click Analytics platform built with Next.js 14, TypeScript, Tailwind CSS, SQLite, and Recharts.</p>
</div>

---

## 🌟 Key Features

- **⚡ Sub-2ms Redirection Engine:** High-performance `/r/[code]` route handler delivering instantaneous HTTP 302 redirects without aggressive client caching.
- **📊 Real-Time Clickstream Analytics:** Live telemetry tracking total clicks, clicks today, and time-series activity curves across 24h, 7d, 30d, 90d, and All Time.
- **🛡️ Privacy-Conscious Unique Reach:** Computes approximate unique visitor counts using rotating daily keyed HMAC-SHA256 hashes. **Zero raw IP addresses are ever stored on disk or in logs.**
- **🌐 Deep Attribution & Profiling:** Categorizes visitor traffic by Referrer Domains (Direct, Google, X/Twitter, LinkedIn, YouTube, GitHub, Reddit), Devices (Desktop, Mobile, Tablet), Browsers (Chrome, Safari, Firefox, Edge, Opera), and Operating Systems (macOS, Windows, iOS, Android, Linux).
- **🤖 Heuristic Bot & Crawler Filter:** Segregates automated scrapers, web spiders, and preview bots (Slack, Twitterbot, WhatsApp, curl) to preserve human engagement accuracy.
- **✨ Custom Aliases & Slugs:** Create memorable, branded short links (e.g., `kairo.sh/r/launch-2026`) with real-time uniqueness validation and reserved route protection.
- **📱 High-Resolution QR Code Studio:** Generate downloadable, print-ready PNG QR codes for physical marketing, slides, and packaging.
- **⏳ Link Lifecycle Controls:** Set automatic expiration dates or temporarily pause incoming redirects at any time with custom branded HTTP 403 / 410 landing pages.
- **🔒 Commercial-Grade Security:**
  - Password hashing with **bcrypt** (10 salt rounds).
  - Cryptographically signed **JWT tokens** stored in HTTP-only, SameSite=Lax cookies.
  - Strict multi-tenant user isolation (`WHERE user_id = ?`).
  - Strict URL scheme validation (HTTP/HTTPS only; blocks `javascript:`, `data:`, and private loopback/SSRF attempts).

---

## 🏗️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend Framework** | [Next.js 14](https://nextjs.org/) (App Router), [React 18](https://react.dev/), [TypeScript](https://www.typescriptlang.org/) |
| **Styling & Design System** | [Tailwind CSS](https://tailwindcss.com/), Custom Design Tokens, CSS Variables |
| **Data Visualization** | [Recharts](https://recharts.org/) (Responsive SVG Time-Series & Bar Charts) |
| **Icons & UI Primitives** | [Lucide React](https://lucide.dev/), Radix Primitives, Canvas Confetti |
| **Database & Engine** | [SQLite 3](https://www.sqlite.org/) via [`@libsql/client`](https://github.com/tursodatabase/libsql-client-ts) (WAL mode, prepared statements) |
| **Authentication & Crypto** | [bcryptjs](https://github.com/dcodeIO/bcrypt.js), [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken), Native Node.js `crypto` |
| **QR Code Engine** | [`qrcode`](https://github.com/soldair/node-qrcode) |
| **Testing Suite** | Custom E2E Automated Integration Harness (`scripts/e2e-test.js`) |

---

## 📁 Repository Structure

```
d:\fswd_project\
├── src\
│   ├── app\
│   │   ├── layout.tsx                     # Root layout with theme script & toast provider
│   │   ├── page.tsx                       # Public landing page with live interactive shortener
│   │   ├── globals.css                    # Tailwind CSS directives & custom scrollbars
│   │   ├── login\page.tsx                 # Authentication login with 1-click demo pill
│   │   ├── register\page.tsx              # Account registration with password validation
│   │   ├── dashboard\
│   │   │   ├── layout.tsx                 # Sidebar shell, mobile nav drawer & header
│   │   │   ├── page.tsx                   # Overview dashboard with KPI cards & recent links
│   │   │   ├── links\
│   │   │   │   ├── page.tsx               # Link management table, search, filters & actions
│   │   │   │   └── [id]\page.tsx          # Individual link analytics & hourly heatmap
│   │   │   ├── analytics\page.tsx         # Dedicated deep analytics suite
│   │   │   └── settings\page.tsx          # Profile, theme toggle & privacy disclosure
│   │   ├── r\[code]\route.ts              # High-speed 302 redirect engine & event ingest
│   │   └── api\
│   │       ├── auth\                      # Register, login, me, logout endpoints
│   │       ├── links\                     # Link CRUD, status toggling, and pagination
│   │       └── analytics\                 # Overview and individual link aggregations
│   ├── components\
│   │   ├── dashboard\                     # MetricCard, ClickChart, DistributionChart, QRModal, CreateLinkModal
│   │   └── ui\                            # Modal, Toast system
│   ├── lib\
│   │   ├── db.ts                          # SQLite schema initialization & prepared query helpers
│   │   ├── auth.ts                        # JWT verification & bcrypt helpers
│   │   ├── user-agent.ts                  # Browser, OS, device & bot detection
│   │   ├── anonymizer.ts                  # Privacy-safe keyed HMAC visitor fingerprinting
│   │   └── utils.ts                       # URL validation, slug generator & formatters
│   └── types\                             # TypeScript data models and response contracts
├── scripts\
│   ├── seed.js                            # Database seeder with demo account & realistic data
│   └── e2e-test.js                        # Automated end-to-end test suite
├── PROJECT_ANALYSIS.md                    # Initial audit & architecture blueprint
├── DESIGN_RESEARCH.md                     # Visual research & competitor benchmarking
├── DESIGN_SYSTEM.md                       # Design tokens, color scales & typography
├── ARCHITECTURE.md                        # Technical architecture & data flow
├── DATABASE_SCHEMA.md                     # SQLite table DDL & indexing strategies
├── API_DOCUMENTATION.md                   # REST API endpoints reference
├── IMPLEMENTATION_LOG.md                  # Comprehensive engineering chronology
├── TESTING_REPORT.md                      # E2E test results & verification matrix
├── package.json
└── tailwind.config.ts
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js:** v18.0.0 or later (v20+ recommended)
- **npm:** v9.0.0 or later

### 2. Installation
Clone the repository and install dependencies:
```bash
git clone <repo-url>
cd fswd_project
npm install
```

### 3. Environment Variables
Create a `.env.local` file in the project root:
```env
PORT=3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
JWT_SECRET=kairo_super_secret_production_ready_cryptographic_jwt_key_2026_x89a1
DATABASE_URL=file:kairo.db
ANONYMIZER_SALT=kairo_daily_rotating_salt_for_privacy_hash_sec_9918
```

### 4. Database Setup & Seeding
Initialize the SQLite database and populate realistic sample data (demo user, sample links, and distributed clickstream events):
```bash
npm run seed
```

**Pre-configured Demo Account:**
- **Email:** `demo@kairo.sh`
- **Password:** `Password123!`

### 5. Running the Application

**Development Mode:**
```bash
npm run dev
```

**Production Build & Execution:**
```bash
npm run build
npm run start
```
Visit `http://localhost:3000` in your browser.

---

## 🧪 Automated Testing

Execute the comprehensive end-to-end integration test suite:
```bash
npm run test:e2e
```
This runs 19 automated assertions verifying:
1. Public landing page availability.
2. User registration and password hashing.
3. Session cookies and authentication middleware.
4. XSS executable URL rejection (`javascript:`).
5. SSRF loopback protection (`127.0.0.1`).
6. Reserved alias collision prevention.
7. Short link creation and custom slug generation.
8. Uniqueness constraints on custom slugs.
9. HTTP 302 redirection with accurate `Location` header.
10. Clickstream telemetry ingestion.
11. User-Agent parsing (Browser, OS, Device).
12. Referrer domain canonicalization.
13. Link pausing and custom HTTP 403 page rendering.
14. Link reactivation.
15. Multi-tenant isolation (User B blocked from User A resources).
16. Cascade link deletion and post-deletion HTTP 404 responses.

---

## 🔒 Security Architecture

1. **Protocol Sanitation:** Every destination URL is normalized and strictly checked. Schemes outside `http:` and `https:` are rejected immediately.
2. **SSRF Guard:** Internal IP ranges (`127.0.0.1`, `localhost`, `0.0.0.0`) cannot be shortened.
3. **Password Security:** Salted hashes generated via bcrypt with 10 work factor rounds.
4. **Session Isolation:** Authentication tokens are stored in `HttpOnly`, `SameSite=Lax` cookies, preventing cross-site scripting credential exfiltration.
5. **Database Protection:** 100% of queries use prepared statements with parameter binding, eliminating SQL injection vulnerabilities.

---

## 📄 License

MIT License. Engineered for production full-stack web development excellence.
