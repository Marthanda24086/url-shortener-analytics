# KAIRO — Project Discovery & Architecture Analysis

**Project Name:** KAIRO (Precision Link Infrastructure & Advanced Click Analytics)  
**Workspace:** `d:\fswd_project`  
**Date:** November 2026  
**Status:** Initial Discovery & Architectural Blueprint  

---

## 1. Executive Summary

Kairo is a production-grade, full-stack link shortening and visitor intelligence platform built for modern developers, marketing teams, and content creators. It bridges high-throughput URL redirection with deep, privacy-conscious clickstream analytics, device fingerprinting, and rich link management.

---

## 2. Existing Workspace Audit

- **Directory State:** `d:\fswd_project` was audited and found to be completely clean and unpopulated.
- **Mandated Stack:** No legacy or predetermined framework constraints exist in the workspace.
- **Available Runtimes & Tooling:**
  - Node.js LTS (v24/v26 via winget installer).
  - Modern npm / package ecosystem.
  - Windows 11 host with PowerShell shell environment.
  - Playwright / Chromium headless browser integration for end-to-end verification.

---

## 3. Technology Stack Selection

To achieve maximum performance, type safety, modularity, and a stunning SaaS user interface, the application is structured with a unified full-stack TypeScript architecture:

### Frontend Layer
- **Framework:** Next.js 14 / React 18+ (App Router) or Vite + React with Express API. A unified Next.js App Router provides seamless server-side routing, ultra-fast 302 redirects, SSR/SSG for marketing pages, API routes with robust middleware, and zero-latency client state management.
- **Styling:** Tailwind CSS with custom design tokens, micro-gradients, hairline borders, and CSS variables.
- **Component Primitives:** Lucide React icons, Radix UI primitives, Recharts for responsive SVG analytics, Canvas-Confetti for reward moments, and QRCode generation library (`qrcode`).
- **Motion & Interactions:** Framer Motion for entrance reveals, tab transitions, modal overlays, and toast microinteractions.

### Backend & API Layer
- **API Runtime:** Next.js Route Handlers / REST API endpoints with robust parameter sanitization, rate limiting, and HTTP-only cookie session handling.
- **Authentication:** Stateless, cryptographically secure JWT tokens stored in HTTP-only cookies + bcrypt password hashing. Complete user isolation enforced at the database query level.
- **URL Engine:**
  - Cryptographically secure short code generation (`nanoid` custom alphabet base62).
  - Collision detection with automated retry loop.
  - Custom alias validation rejecting reserved system routes (`/api`, `/dashboard`, `/login`, `/signup`, `/settings`, etc.).
  - Protocol sanitizer enforcing `http://` and `https://` only (blocking `javascript:`, `data:`, `file:`, internal loopback SSRF attempts).
  - High-performance HTTP 302 redirects without aggressive client-side caching.

### Database Layer
- **Database Engine:** SQLite via `better-sqlite3` or Prisma / Drizzle ORM. SQLite provides high write-throughput, zero external network latency, full ACID compliance, and effortless portable zero-config reproducibility.
- **Schema Entities:**
  1. `users` (id, name, email, password_hash, created_at, updated_at)
  2. `links` (id, user_id, original_url, short_code, title, is_active, expires_at, created_at, updated_at)
  3. `click_events` (id, link_id, timestamp, referrer_domain, browser, os, device_type, country_code, visitor_hash, is_bot)
- **Indexes:**
  - Unique index on `links.short_code`
  - Foreign key index on `links.user_id`
  - Composite indexes on `click_events(link_id, timestamp)`
  - Index on `click_events.visitor_hash` for unique visitor deduplication.

### Analytics & Intelligence Pipeline
- **User-Agent Parser:** Fast regex-based parser categorizing Browser (Chrome, Safari, Firefox, Edge, Opera, Other), OS (macOS, Windows, iOS, Android, Linux, Other), Device (Mobile, Desktop, Tablet), and Bot heuristic flags.
- **Privacy-Preserving Visitor Identification:** One-way HMAC-SHA256 hash using a rotating daily server secret combined with client subnet and user agent. Never stores raw IP addresses.
- **Bot & Crawler Filter:** Evaluates User-Agent against known crawler signatures (Googlebot, Bingbot, Twitterbot, WhatsApp, curl, python-requests) to segregate human engagement from automated scrapers.
- **Aggregation Dimensions:**
  - Time-series trends (24h, 7d, 30d, 90d, All Time).
  - Referrer domains (Direct, Google, X/Twitter, LinkedIn, YouTube, GitHub, Custom).
  - Device distribution (Desktop vs Mobile vs Tablet).
  - Browser & OS share.
  - Peak hours heatmap (0-23 UTC/local).

---

## 4. Implementation Phasing Plan

| Phase | Milestone | Deliverable |
|---|---|---|
| **Phase 0-1** | Discovery & Audit | `PROJECT_ANALYSIS.md` & workspace environment setup |
| **Phase 2-3** | Brand & Design Research | `DESIGN_RESEARCH.md` & `DESIGN_SYSTEM.md` |
| **Phase 4** | Public Landing Page | Hero with interactive shortener, live preview, features, how it works, pricing/specs, footer |
| **Phase 5** | Authentication System | Sign up, Log in, Logout, Protected Route Middleware, Password Hashing |
| **Phase 6-11** | Core Application | Dashboard Overview, Link Manager, Shortener Engine, Analytics Engine, Link Detail View, QR Code Engine |
| **Phase 12-15** | Security & Settings | Account Settings, URL sanitization, Anti-abuse, Privacy documentation |
| **Phase 16-19** | Design Polish & Responsive | Framer motion, tablet/mobile layout audits, accessibility, SEO |
| **Phase 20-21** | E2E Browser Testing & Refinement | Playwright / Browser test script, 3 rounds of visual improvements |
| **Phase 22** | Final Documentation | Comprehensive technical documentation and user guides |
