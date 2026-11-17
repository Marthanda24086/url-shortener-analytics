# KAIRO — Full-Stack Technical Architecture

**Version:** 1.0.0  
**Repository Structure, Request Flows, Security & Data Pipelines**

---

## 1. High-Level System Architecture

```
                                  [ User Browser ]
                                         │
                   ┌─────────────────────┴─────────────────────┐
                   │                                           │
          [ Short URL Request ]                       [ App / Dashboard ]
             (e.g., /r/:code)                       (e.g., /dashboard/*)
                   │                                           │
                   ▼                                           ▼
          [ Edge Route Handler ]                      [ Next.js React UI ]
                   │                                           │
       ┌───────────┴───────────┐                     ┌─────────┴─────────┐
       ▼                       ▼                     ▼                   ▼
 [ Lookup Slug ]       [ Click Analytics ]      [ Auth API ]       [ Link & Analytics ]
 (Cache/DB lookup)    (Async Event Log)         (/api/auth/*)         (/api/links/*)
       │                       │                     │                   │
       ▼                       ▼                     ▼                   ▼
 [ 302 Redirect ]     [ IP Anonymizer ]         [ JWT Verification ] [ Aggregation Engine ]
 (To Destination)     [ User-Agent Parser ]          │                   │
                      [ Deduplication ]              └─────────┬─────────┘
                               │                               │
                               ▼                               ▼
                      ┌──────────────────────────────────────────────┐
                      │              SQLite Database                 │
                      │  (users, links, click_events, analytics_idx) │
                      └──────────────────────────────────────────────┘
```

---

## 2. Directory Structure

```
d:\fswd_project\
├── src\
│   ├── app\
│   │   ├── layout.tsx                     # Root layout with theme provider & toasts
│   │   ├── page.tsx                       # Public landing page with live interactive shortener
│   │   ├── login\
│   │   │   └── page.tsx                   # User authentication login
│   │   ├── register\
│   │   │   └── page.tsx                   # User registration
│   │   ├── dashboard\
│   │   │   ├── layout.tsx                 # Dashboard sidebar, mobile nav, user profile
│   │   │   ├── page.tsx                   # Dashboard overview & summary metrics
│   │   │   ├── links\
│   │   │   │   ├── page.tsx               # Link management table, search, filters
│   │   │   │   └── [id]\
│   │   │   │       └── page.tsx           # Individual link analytics & QR generator
│   │   │   ├── analytics\
│   │   │   │   └── page.tsx               # Deep global analytics dashboard
│   │   │   └── settings\
│   │   │       └── page.tsx               # Profile, security & privacy policy
│   │   ├── r\
│   │   │   └── [code]\
│   │   │       └── route.ts               # Short URL 302 redirect engine & event ingest
│   │   └── api\
│   │       ├── auth\
│   │       │   ├── login\route.ts         # User login & JWT cookie emission
│   │       │   ├── register\route.ts      # User registration & password hashing
│   │       │   ├── me\route.ts            # Current authenticated session
│   │       │   └── logout\route.ts        # Clear session cookie
│   │       ├── links\
│   │       │   ├── route.ts               # GET all links (paginated) & POST create link
│   │       │   └── [id]\
│   │       │       └── route.ts           # GET, PUT (edit), DELETE, PATCH (pause/resume)
│   │       └── analytics\
│   │           ├── overview\route.ts      # Aggregated metrics (clicks, trends, devices)
│   │           └── [id]\route.ts          # Granular link analytics
│   ├── components\
│   │   ├── landing\                       # Hero, Features, Analytics preview, Pricing, Footer
│   │   ├── dashboard\                     # MetricsCards, ClickChart, LinkTable, QRModal, CreateLinkModal
│   │   └── ui\                            # Button, Input, Modal, Badge, Tooltip, Toast
│   ├── lib\
│   │   ├── db.ts                          # SQLite connection & schema migrations
│   │   ├── auth.ts                        # JWT verification, password hashing, session cookies
│   │   ├── user-agent.ts                  # Browser, OS, device, bot detection
│   │   ├── anonymizer.ts                  # Privacy-safe keyed HMAC visitor fingerprinting
│   │   └── utils.ts                       # Formatters, URL validation, slug generator
│   └── types\
│       └── index.ts                       # Complete TypeScript interfaces
├── public\
│   └── favicon.ico                        # Branding assets
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.mjs
```

---

## 3. Data Flow & Security Guarantees

1. **Short URL Redirection Speed:** The `/r/[code]` route performs an indexed query on `links WHERE short_code = ?`. If active and non-expired, it dispatches the click telemetry asynchronously and returns an instantaneous HTTP `302 Found` with `Location: <destination>`.
2. **Visitor Privacy:** No plain IP address is ever stored. A keyed HMAC hash is computed using `SHA256(IP + UserAgent + DailySalt)`, allowing 24-hour unique visitor estimation while ensuring zero reversibility or cross-site tracking.
3. **Data Isolation:** Every link query and analytics aggregation contains `WHERE user_id = ?` extracted from the cryptographically verified JWT cookie.
