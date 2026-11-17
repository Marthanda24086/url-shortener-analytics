# KAIRO — Design Research & Visual Language Specification

**Brand Identity:** KAIRO  
**Aesthetic Direction:** Modern Minimalist Architectural SaaS (Warm Charcoal & Luminous Indigo)  
**Primary References Studied:** Dub.co, Linear.app, Stripe Radar, Raycast, Vercel Analytics, Short.io  

---

## 1. Competitor & Industry Benchmark Analysis

### Dub.co
- **Strengths:** Clean card layout, instantaneous link creation modal, domain-level management, rich geo/device breakdowns, crisp QR code downloads.
- **Learnings for Kairo:** Avoid cluttered multi-column overloads on the overview page. Keep the URL creation bar prominent and persistent with instantaneous clipboard feedback.

### Linear.app & Raycast
- **Strengths:** World-class keyboard ergonomics, subtle borders (`border-white/10` or `border-zinc-200`), dark & warm light modes with high readability, muted secondary labels (`text-zinc-500`), tactile hover states.
- **Learnings for Kairo:** Use subtle hairline border dividers, high contrast primary actions, and elegant badges for link status (Active, Paused, Expired).

### Stripe & Vercel Analytics
- **Strengths:** Smooth SVG sparklines, custom interactive tooltips showing timestamp and exact click count, intuitive date-range pills (24h, 7d, 30d, 90d, All), clear metric deltas.
- **Learnings for Kairo:** Present both high-level aggregates (Total Clicks, Unique Visitors, Active Links) and granular drill-downs (Referrers, OS, Browsers, Devices) without overwhelming the user.

---

## 2. Brand Identity & Personality

- **Name:** **KAIRO** (derived from *Kairos* — the opportune, precise moment in Greek philosophy).
- **Core Values:** Precision, Speed, Data Integrity, Privacy-First Intelligence.
- **Tone of Voice:** Engineered, confident, concise, transparent.
- **Logo Design:** A geometric monogram fusing two intersecting link nodes with a directional forward arrow, symbolizing instantaneous redirection and telemetry.

---

## 3. Visual System & Color Direction

Kairo adopts a dual-mode high-clarity color palette designed to avoid generic saturated neon gradients:

### Light Mode (Primary Default)
- **Background Root:** `#FAFAFA` (Crisp stone white)
- **Surface Elevation 1 (Cards, Sidebar):** `#FFFFFF` (Pure white)
- **Surface Elevation 2 (Input fields, hover):** `#F4F4F5` (Subtle neutral zinc)
- **Borders & Dividers:** `#E4E4E7` (Hairline zinc-200)
- **Primary Text:** `#09090B` (Deep obsidian ink)
- **Secondary Text:** `#71717A` (Muted zinc-500)
- **Accent Primary:** `#2563EB` (Precision Royal Cobalt)
- **Accent Hover:** `#1D4ED8`
- **Accent Secondary / Success:** `#059669` (Emerald 600)
- **Warning / Paused:** `#D97706` (Amber 600)
- **Destructive / Expired:** `#DC2626` (Rose/Red 600)

### Dark Mode (Night Mode Option)
- **Background Root:** `#09090B` (Obsidian zinc)
- **Surface Elevation 1:** `#18181B` (Zinc-900)
- **Surface Elevation 2:** `#27272A` (Zinc-800)
- **Borders & Dividers:** `#27272A`
- **Primary Text:** `#FAFAFA`
- **Secondary Text:** `#A1A1AA`
- **Accent Primary:** `#3B82F6`

---

## 4. Typography System

- **Display & Headings:** `Inter`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, sans-serif with tight tracking (`tracking-tight`), `font-semibold` / `font-bold`.
- **Body & Data:** `Inter` with relaxed line-height for effortless reading.
- **Mono (Short codes, URLs, hashes, timestamps):** `JetBrains Mono`, `ui-monospace`, `SFMono-Regular`, `Menlo`, monospace with medium weights.

---

## 5. UI Components & Layout Principles

1. **Persistent Top Bar / Header:** Fast search, quick "New Link" button, notification bell, user profile dropdown with theme switcher.
2. **Modular Dashboard Grid:** Responsive 4-metric KPI row with trend badges, followed by the primary interactive Click Activity time-series graph, followed by side-by-side Top Referrers and Device Split cards.
3. **Link Management Table:** Clean list view with original URL truncation, one-click copy badge, quick action menu (Edit, QR, Pause/Resume, Delete), and live click counter badge.
4. **Interactive URL Shortener Modal / Bar:** Floating card with validation feedback, custom alias input with live preview (`kairo.sh/your-slug`), and optional expiration date picker.
5. **Toast Notification System:** Instant feedback for link copying ("Copied to clipboard!"), creation, updates, and deletion with smooth slide-in animations.
