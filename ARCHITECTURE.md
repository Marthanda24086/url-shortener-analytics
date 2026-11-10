# LinkSnap — Frontend & System Architecture Specification

**Architecture Directorate:** Senior Frontend Architect & Performance Engineer  
**Date:** November 2026

---

## 1. Architectural Strategy & Technology Decision Matrix

### Decision: Semantic HTML5 + Modern CSS Design Tokens + Native ES6 + Canvas Telemetry
**Rationale:**
1. **Zero Runtime Bundle Bloat:** Traditional React/Next.js scaffolds for simple utility pages introduce 150KB–300KB of vendor JavaScript before rendering a single byte. By utilizing native modern ES6, CSS Custom Properties, and preconnected fonts, the entire page renders in **< 120ms** with zero client hydration delay.
2. **Deterministic Browser Compatibility:** All existing backend routes (`server.js`, `src/routes/api.js`, `src/routes/redirect.js`) serve static files directly through `express.static` with custom cache-control headers.
3. **Resilient Data Binding:** Built-in defensive content-type inspection prevents JSON parsing crashes if MongoDB is disconnected or in cold-boot states.

---

## 2. Directory & Component Organization

```
d:\fswd_project\
├── public/
│   ├── index.html                 # Precision Landing Page & Routing Engine Console
│   ├── dashboard.html             # High-Density Telemetry Workstation
│   ├── css/
│   │   └── style.css              # Master Design System (Tokens, Grid, Bento, Workstation)
│   └── js/
│       ├── main.js                # Landing page workbench controller & API terminal
│       └── dashboard.js           # Workstation telemetry charts, table filters, inspector
├── src/
│   ├── app.js                     # Express setup, Helmet security, CORS, Rate Limiters
│   ├── server.js                  # Entry point, DB-first lifecycle, graceful shutdown
│   ├── config/db.js               # Mongoose connection pool manager
│   ├── models/                    # Url & Click schemas with compound indexes
│   ├── middleware/                # Auth, RateLimiter, Fire-and-Forget Analytics
│   ├── controllers/               # Joi-validated CRUD & Aggregation pipelines
│   └── utils/                     # nanoid CSPRNG, SHA-256 deduplication, QR synthesis
```

---

## 3. Telemetry Ingestion Architecture (Fire-and-Forget)

```
[ Client Request ] -> GET /:code
         │
         ├──► 1. Query Url model (Indexed B-Tree by shortCode / customAlias)
         ├──► 2. Send HTTP 302 Found Response (<3.8ms)
         │
         └──► 3. Background Task (Un-awaited Asynchronous Micro-task)
                  ├── Extract IP from X-Forwarded-For
                  ├── Hash IP with salt: SHA-256(IP + IP_HASH_SALT)
                  ├── Resolve Country/City via offline GeoIP binary database
                  ├── Parse User-Agent (Hardware device, OS, Browser engine)
                  ├── Insert document into Click collection
                  └── Atomic update: Url.findByIdAndUpdate(..., { $inc: { clicks: 1 } })
```

---

## 4. Workstation State Management

- **Dynamic Period Filtering:** 7-Day, 30-Day, and 90-Day time windows update all Chart.js instances without full-page reloads.
- **Search & Sort Pipeline:** Debounced real-time input filtering for the route inventory table with pagination memory.
- **API Key Persistence:** Header-based session memory enabling seamless sync between Landing and Workstation views.
