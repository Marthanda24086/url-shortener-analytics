# 🎓 URL Shortener — Complete Interview Mastery Guide

> Read this once thoroughly, then you can explain **every single line** confidently.

---

## 📋 Table of Contents
1. [The Big Picture — How It All Connects](#1-big-picture)
2. [The Request Lifecycle](#2-request-lifecycle)
3. [Hashing & Encoding — The Math](#3-hashing--encoding)
4. [MongoDB & Mongoose Deep Dive](#4-mongodb--mongoose)
5. [Express Middleware Chain](#5-express-middleware-chain)
6. [Analytics Architecture](#6-analytics-architecture)
7. [Security Decisions](#7-security-decisions)
8. [Deployment & DevOps](#8-deployment--devops)
9. [Interview Q&A Cheatsheet](#9-interview-qa-cheatsheet)

---

## 1. Big Picture

### System Overview (How Every File Connects)

```
CLIENT (Browser)
    │
    ▼
index.html / dashboard.html   ← Static files served by Express
    │ fetch() / XMLHttpRequest
    ▼
server.js                     ← Entry point: connects DB, starts HTTP server
    │
    ▼
src/app.js                    ← Express app setup: middleware, routes
    │
    ├── /api/*  ──────────────► src/routes/api.js
    │                               │
    │                          authenticate   ← src/middleware/auth.js
    │                          rateLimiter    ← src/middleware/rateLimiter.js
    │                               │
    │                          controllers ──► src/controllers/urlController.js
    │                                         src/controllers/analyticsController.js
    │                                              │
    │                                         Models ─────► src/models/Url.js
    │                                                        src/models/Click.js
    │                                              │
    │                                         Utils ──────► src/utils/hash.js
    │                                                        src/utils/qrcode.js
    │
    └── /:code ─────────────► src/routes/redirect.js
                                    │
                               src/middleware/analytics.js (fire-and-forget)
                                    │
                               src/models/Click.js (insert)
                               src/models/Url.js ($inc clicks)
```

### One-Sentence Explanations Per File

| File | What it does | Why it exists |
|------|-------------|---------------|
| `server.js` | Starts the HTTP server after DB connects | Entry point; separates startup from app config |
| `src/app.js` | Configures Express: middleware stack, routes | So tests can import app without starting a real server |
| `src/config/db.js` | Connects Mongoose to MongoDB | Centralizes DB config; one place to change the URI |
| `src/models/Url.js` | Defines the shape of a URL document | Mongoose enforces schema; gives ORM query methods |
| `src/models/Click.js` | Stores every click event | Separate collection = independent scaling; detailed queries |
| `src/middleware/auth.js` | Validates API keys | Protects write endpoints without blocking redirects |
| `src/middleware/rateLimiter.js` | Limits requests per IP | Prevents spam, brute-force, DDoS |
| `src/middleware/analytics.js` | Records click data | Fire-and-forget so redirects stay fast |
| `src/utils/hash.js` | nanoid, SHA-256, base62 | All encoding logic in one place (SRP) |
| `src/utils/qrcode.js` | Generates QR codes | Isolated utility — easy to swap library later |
| `src/controllers/urlController.js` | URL CRUD business logic | Keeps routes thin; controllers handle data logic |
| `src/controllers/analyticsController.js` | MongoDB aggregation pipelines | Complex aggregations belong in controllers |
| `src/routes/api.js` | Maps HTTP verbs to controllers | Route file = glue; no logic here |
| `src/routes/redirect.js` | `GET /:code` → 302 redirect | Most-hit route; kept minimal for speed |

---

## 2. Request Lifecycle

### A. Shortening a URL (POST /api/shorten)

```
Browser ──POST /api/shorten──► Express
                                  │
                            [1] app.js global middleware:
                                  ├── helmet() → sets security headers
                                  ├── cors() → checks Origin header
                                  ├── express.json() → parses body to req.body
                                  └── morgan() → logs the request
                                  │
                            [2] api.js router:
                                  ├── apiLimiter → check rate limit
                                  └── authenticate → verify x-api-key header
                                  │
                            [3] urlController.shortenUrl():
                                  ├── Joi.validate() → check body shape
                                  ├── Url.findOne() → duplicate check
                                  ├── generateShortCode() → nanoid 6 chars
                                  ├── bcrypt.hash() → hash password if given
                                  ├── generateQRCode() → QR as base64
                                  └── Url.create() → save to MongoDB
                                  │
                            [4] Response: 201 { shortUrl, qrCode, ... }
                                  │
Browser ◄────────────────────────┘
```

### B. Redirecting (GET /abc123)

```
Browser ──GET /abc123──► Express
                            │
                      [1] redirect.js route matches /:code
                            │
                      [2] redirectLimiter → rate limit check
                            │
                      [3] Url.findByCode('abc123'):
                            ├── tries customAlias first
                            └── then shortCode
                            │
                      [4] isExpired() check
                            │
                      [5] password check (if applicable)
                            │
                      [6] recordClick(urlDoc, req) ← FIRE & FORGET
                            │   (doesn't await — runs in background)
                            │
                      [7] res.redirect(302, originalUrl)
                            │
Browser ◄────────── 302 Location: https://original-url.com
```

**Why is step 6 fire-and-forget?**
If we await `recordClick()`, the user's redirect waits for:
- UA parsing (~1ms)
- GeoIP lookup (~0.1ms)
- MongoDB insert (~5-20ms)

That is 25ms delay just for analytics! By not awaiting, the user gets redirected in <5ms, and the DB write happens in the background. Worst case: if the server crashes between redirect and analytics write, we lose ONE click — acceptable tradeoff.

---

## 3. Hashing & Encoding

### What is the Difference?

| Term | Meaning | Example in Project |
|------|---------|-------------------|
| **Hashing** | One-way transformation; same input = same output | SHA-256 of URL for deduplication |
| **Encoding** | Reversible transformation to different representation | Base62 converts numbers to short strings |
| **Encryption** | Reversible with a key | Not used (bcrypt is one-way hashing) |

### nanoid — Short Code Generation

```javascript
const generate = customAlphabet('0-9a-zA-Z', 6);
// Produces: "aB3kZ9" — 62^6 = 56 billion possibilities
```

**Why not Math.random()?**
Math.random() uses a non-cryptographic PRNG (Pseudo-Random Number Generator). Its output can be predicted if an attacker knows the seed. `nanoid` uses `crypto.randomFillSync` — a CSPRNG (Cryptographically Secure PRNG) backed by the OS entropy pool. Even if an attacker watches 1000 generated codes, they cannot predict the next one.

**Why Base62?**
- 26 lowercase + 26 uppercase + 10 digits = 62 characters
- No hyphens, underscores, or special chars that break URLs
- 62^6 = 56,800,235,584 unique codes (56 billion) in just 6 characters
- Compare: 26^6 = 308 million (lowercase only) — much less space

### SHA-256 — URL Deduplication

```javascript
crypto.createHash('sha256').update(url).digest('hex')
// "https://google.com" → always → "2c624232cdd221771294dfbb310acbc..."
```

**Why hash the URL?**
We store the hash to detect if the same API key tries to shorten the same URL twice. We could compare the original URL strings directly, but:
1. Long URLs are slow to compare (string comparison is O(n))
2. A SHA-256 hash is always 64 chars — O(1) comparison with a proper index

**Collision probability?**
SHA-256 produces 2^256 possible hashes. The birthday paradox says you need ~2^128 inputs before collision probability hits 50%. For URL deduplication, SHA-256 collisions are effectively impossible.

### bcrypt — Password Hashing

```javascript
const hash = await bcrypt.hash(password, 10);
// 10 = salt rounds = 2^10 = 1024 bcrypt iterations
```

**Why bcrypt and not SHA-256 for passwords?**
SHA-256 is fast (billions per second on a GPU). If an attacker gets the hash database, they can brute-force SHA-256 hashes with rainbow tables or GPU cracking.

bcrypt is intentionally slow:
- saltRounds=10 means ~100ms per hash on modern hardware
- At 100ms per attempt, GPU cracking is ~10 attempts/second instead of billions
- Salt is stored WITH the hash, so rainbow tables are useless

### Base62 Encode/Decode

```javascript
// Sequential ID approach (alternative to nanoid)
encodeBase62(1000000)  // → "4C92"
decodeBase62("4C92")   // → 1000000
```

Twitter uses this: Tweet ID 20 in base62 is "k". This is how they make short tweet URLs.

**The algorithm:**
```
1000000 / 62 = 16129 remainder 2  → char '2'
16129   / 62 = 260   remainder 9  → char '9'
260     / 62 = 4     remainder 12 → char 'C'
4       / 62 = 0     remainder 4  → char '4'
Read remainders bottom-to-top: "4C92"
```

---

## 4. MongoDB & Mongoose

### Why MongoDB Over SQL?

| Aspect | MongoDB | PostgreSQL |
|--------|---------|-----------|
| Schema | Flexible — clicks can have different fields | Rigid — all rows same columns |
| Scaling | Horizontal sharding built-in | Vertical scaling (bigger server) |
| Aggregation | Pipelines in query language | SQL GROUP BY + JOINs |
| Analytics | Built-in time-series queries | Requires extensions |
| Fit for project | Click documents vary; no complex JOINs | Overkill for this use case |

### Mongoose Schema Concepts

**Schema** = Blueprint for a document. Mongoose validates data against it before saving.
**Model** = JavaScript class generated from schema. Gives you Url.find(), Url.create(), etc.
**Document** = One instance in the collection (like a row in SQL).

```javascript
const urlSchema = new mongoose.Schema({ ... }, { timestamps: true });
const Url = mongoose.model('Url', urlSchema); // pluralizes to 'urls' collection

await Url.create({ ... });                    // INSERT
await Url.findOne({ shortCode: 'x' });        // SELECT WHERE
await Url.findByIdAndUpdate(id, { $inc: { clicks: 1 } }); // atomic UPDATE
```

### Indexes — Why They Matter

Without an index, MongoDB scans EVERY document to find a match (O(n)).
With an index, it jumps directly to the result (O(log n)).

```javascript
// In our Url schema:
shortCode: { unique: true }  // Creates a B-tree index automatically

// In Click schema:
clickSchema.index({ shortCode: 1, clickedAt: -1 });
// Compound index: efficient for "clicks for shortCode X sorted by date"
```

**sparse: true on customAlias:**
```javascript
customAlias: { unique: true, sparse: true }
```
Unique index would reject multiple documents with customAlias: null.
sparse: true tells MongoDB to only index documents where the field EXISTS — ignores null values.

### Aggregation Pipeline — The Star Feature

```javascript
// "Top 5 countries for shortCode 'abc123' in last 30 days"
Click.aggregate([
  { $match: { shortCode: 'abc123', clickedAt: { $gte: thirtyDaysAgo } } },
  // Like WHERE clause. MongoDB uses the compound index here.

  { $group: { _id: '$country', count: { $sum: 1 } } },
  // Group by country, count documents per group (like GROUP BY + COUNT(*))

  { $sort: { count: -1 } },
  // Sort by count descending

  { $limit: 5 },
  // Take only top 5

  { $project: { _id: 0, country: '$_id', count: 1 } },
  // Reshape output: rename _id to country
])
```

**Promise.all for parallel queries:**
```javascript
const [totalClicks, byCountry, byBrowser] = await Promise.all([
  Click.countDocuments(match),
  Click.aggregate([...countryPipeline]),
  Click.aggregate([...browserPipeline]),
]);
// All three run simultaneously. If each takes 20ms, total = 20ms. Sequential = 60ms.
```

### Virtual Fields

```javascript
urlSchema.virtual('effectiveCode').get(function() {
  return this.customAlias || this.shortCode;
});
```
A virtual is computed in JavaScript, NOT stored in MongoDB. Recalculated whenever you access it.
Never use arrow functions in virtuals — they don't have their own 'this'.

### $inc — Atomic Counter

```javascript
await Url.findByIdAndUpdate(id, { $inc: { clicks: 1 } });
```

Why $inc instead of doc.clicks++; doc.save()?

**Race condition without $inc:**
```
Request 1: reads clicks=5
Request 2: reads clicks=5
Request 1: sets clicks=6, saves
Request 2: sets clicks=6, saves  ← LOST UPDATE! Should be 7
```

**With $inc (atomic):**
MongoDB's $inc is a single database operation. The database increments the value as one atomic unit — no race conditions possible.

---

## 5. Express Middleware Chain

### What Is Middleware?

A function with signature (req, res, next). Express processes them in order:
```
Request → [middleware 1] → [middleware 2] → [route handler] → Response
                                ↓ (if error)
                          [error handler]
```

### Our Middleware Stack (in order)

```javascript
app.use(helmet())           // 1. Set security headers
app.use(cors())             // 2. Handle CORS preflight
app.set('trust proxy', 1)  // 3. Trust X-Forwarded-For
app.use(express.json())    // 4. Parse JSON body → req.body
app.use(morgan())          // 5. Log request
app.use(express.static()) // 6. Serve public/ files

// api.js router
router.use(apiLimiter)    // 7. Rate limit /api/* routes

// Per-route:
router.post('/shorten', authenticate, shortenUrl)
//                       ↑ 8. Auth   ↑ 9. Controller
```

### authenticate Middleware

```javascript
const authenticate = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) return res.status(401).json({ error: 'API key required' });
  if (!validKeys.has(apiKey)) return res.status(403).json({ error: 'Invalid' });

  req.apiKey = apiKey;  // Attach to req for downstream use
  next();               // Hand off to next handler
};
```

**401 vs 403:**
- 401 = Unauthenticated (no credentials provided)
- 403 = Forbidden (credentials provided but access denied)

### Rate Limiting

The library creates a sliding window counter per IP address.

```
Time: 0:00  → IP 1.2.3.4: 1 request
Time: 0:14  → IP 1.2.3.4: 100 requests → BLOCKED (429)
Time: 0:15  → Window resets → 100 more requests allowed
```

Three levels in our app:
- apiLimiter: 100 req / 15 min — general API usage
- strictLimiter: 5 req / 1 hour — key generation (prevent farming)
- redirectLimiter: 60 req / 1 min — redirect endpoint (high traffic)

---

## 6. Analytics Architecture

### Why a Separate Click Collection?

**Option A (bad): Counter-only in Url document**
Only know total clicks — no breakdown possible.

**Option B (bad): Embed clicks array in Url document**
MongoDB documents have a 16MB limit. 100,000 clicks with metadata = document explosion.

**Option C (our approach): Separate Click collection**
- Each click is one document
- Can query for any breakdown (by country, date, browser, etc.)
- Independently scalable
- Historical data preserved even if URL is deleted
- We ALSO maintain url.clicks as a denormalized counter for fast dashboard reads

### UA Parsing

```javascript
const parser = new UAParser(req.headers['user-agent']);
const result = parser.getResult();
// result = {
//   browser: { name: 'Chrome', version: '120.0' },
//   os: { name: 'Windows', version: '10' },
//   device: { type: 'mobile', vendor: 'Samsung' }
// }
```

The User-Agent header is sent by every browser automatically. ua-parser-js has a regex database of 10,000+ UA patterns to identify browsers, OSes, and devices.

### GeoIP

```javascript
const geo = geoip.lookup('8.8.8.8');
// { country: 'US', city: 'Mountain View', ll: [37.386, -122.0838] }
```

geoip-lite bundles the MaxMind GeoLite2 database locally. No external API call — geolocation is resolved in <0.1ms. The database maps IP ranges to geographic locations.

**Why is 127.0.0.1 (localhost) null?**
Private IP ranges (10.x.x.x, 192.168.x.x, 127.x.x.x) are not in the GeoIP database — they are never assigned to geographic locations.

### Fire-and-Forget Pattern

```javascript
// In redirect.js — NO await
recordClick(urlDoc, req);
return res.redirect(302, urlDoc.originalUrl);

// In analytics.js — never throws to caller
const recordClick = async (urlDoc, req) => {
  try {
    await Click.create({ ... });
    await Url.findByIdAndUpdate(urlDoc._id, { $inc: { clicks: 1 } });
  } catch (error) {
    console.error(error);
  }
};
```

Node.js event loop continues processing other work while the async analytics functions await DB operations. The redirect response reaches the user first.

---

## 7. Security Decisions

### helmet.js — 12 Headers for Free

```javascript
app.use(helmet())
```

Sets these headers automatically:
- Content-Security-Policy — tells browser where JS/CSS can load from (prevents XSS)
- X-Frame-Options: SAMEORIGIN — prevents clickjacking (embedding in iframes)
- X-Content-Type-Options: nosniff — prevents MIME confusion attacks
- Strict-Transport-Security — forces HTTPS for 1 year
- Referrer-Policy — controls referrer information leakage

### CORS — Why It Exists

The browser's Same-Origin Policy blocks JavaScript from making requests to a different domain. This protects users from malicious websites stealing their data.

CORS headers tell the browser: "It is intentional that app.example.com calls api.example.com."

```
Server response includes:
Access-Control-Allow-Origin: https://app.example.com
Access-Control-Allow-Headers: Content-Type, x-api-key
Access-Control-Allow-Methods: GET, POST, DELETE, PUT
```

### IP Hashing for Privacy (GDPR)

```javascript
const hashIp = (ip) => {
  const salt = process.env.IP_HASH_SALT;
  return crypto.createHash('sha256').update(ip + salt).digest('hex').substring(0, 16);
};
```

GDPR requires that IP addresses (which are PII) either be deleted or anonymized. We hash with a salt so:
1. Raw IP is never stored
2. Same IP always produces same hash (allows unique visitor counting)
3. Hash cannot be reversed to find the original IP
4. Salt prevents rainbow table attacks (pre-computed hash databases)

### 302 vs 301 Redirect

**301 Permanent**: Browser caches indefinitely. Second visit — browser redirects without asking server. You lose all analytics for repeat visitors.

**302 Temporary**: Browser always asks server. Every click hits your server, every click is tracked. You can also change the destination URL later.

---

## 8. Deployment & DevOps

### Local Development

```bash
cp .env.example .env        # Copy and edit environment variables
npm install                 # Install dependencies
npm run dev                 # Start with nodemon (auto-reload)
```

### Docker

```bash
docker compose up -d        # Build and start all services
docker compose logs -f app  # View logs
docker compose down         # Stop everything
```

How Docker Compose works:
1. app service: builds from Dockerfile, starts Node.js
2. mongo service: pulls official MongoDB 7 image
3. depends_on: app waits for MongoDB health check before starting
4. volumes: data survives docker compose down
5. networks: services talk to each other by service name (mongo, not 127.0.0.1)

### Railway Deployment

```bash
git init && git add . && git commit -m "initial"
git push -u origin main
# Go to railway.app → New Project → Deploy from GitHub
# Add MongoDB plugin
# Set environment variables
# Railway auto-detects Node.js and runs npm start
```

### PM2 (Process Manager for VPS)

```bash
npm install -g pm2
pm2 start server.js --name url-shortener
pm2 startup    # auto-start on reboot
pm2 save       # save process list
pm2 logs url-shortener
```

### Graceful Shutdown

```javascript
process.on('SIGTERM', async () => {
  server.close();                     // Stop accepting new connections
  await mongoose.connection.close();  // Close DB connection cleanly
  process.exit(0);
});
```

Without graceful shutdown, in-flight requests get dropped, MongoDB writes may be incomplete, and connection pools are not released properly. Docker and Kubernetes send SIGTERM before killing a container, giving the app time to finish gracefully.

---

## 9. Interview Q&A Cheatsheet

### "Walk me through what happens when someone visits a short link"

The request hits GET /:code in redirect.js. Express applies the rate limiter middleware first — if the IP has made more than 60 requests in the last minute, it returns 429. Otherwise, we extract the code from the params, sanitize it to strip any non-alphanumeric characters, then call Url.findByCode() which is a static method I defined on the Mongoose model — it tries the custom alias first, then the shortCode. If found, we check if it is expired using the isExpired() instance method. If it is password protected, we check the query parameter against the bcrypt hash. Then we call recordClick() WITHOUT awaiting it — that is a deliberate fire-and-forget pattern so the redirect happens in under 5ms and analytics recording happens in the background. Finally we send a 302 redirect, not 301, because 302 makes the browser ask our server every time, so we can track every single click.

### "How does your URL shortening algorithm work?"

I use nanoid with a custom Base62 alphabet — that is 10 digits plus 26 lowercase plus 26 uppercase letters. nanoid uses Node's crypto.randomFillSync internally which is a cryptographically secure random number generator — unlike Math.random() which can be predicted. With 6 characters in Base62, I get 62 to the power of 6, that is about 56 billion possible codes. To handle collisions — two codes being the same — I have a retry loop in the controller. I generate a code, check if it exists in MongoDB, and if it does, I generate another. After 3 collisions I increase the length to 7 characters. Collision probability with 56 billion codes is astronomically low anyway.

### "Why did you choose MongoDB over PostgreSQL?"

Click analytics data is a good fit for MongoDB because: first, each click document can have slightly different fields depending on what GeoIP and the UA parser return — MongoDB's flexible schema handles this better than SQL's rigid columns. Second, MongoDB's aggregation pipeline is purpose-built for the kind of analytics I need — grouping by country, bucketing by hour of day, time-series aggregations. Third, horizontal scaling — if this app grew to billions of clicks, MongoDB's native sharding would let me distribute across multiple servers. The tradeoff is that MongoDB does not support multi-document ACID transactions as naturally as SQL, but I do not need complex cross-collection transactions here.

### "What is the difference between your auth middleware and route handler?"

Middleware runs before the route handler in Express's pipeline. In my authenticate middleware, I look at the x-api-key header. If it is missing, I send a 401 and return — I never call next(), so the route handler never runs. If it is valid, I attach the apiKey to req.apiKey and call next() to hand off to the controller. This is the key pattern — middleware either calls next() to continue the chain, or terminates the request by sending a response. The controller never worries about authentication — it just reads req.apiKey and knows it has already been validated.

### "How do you prevent abuse of your API?"

Three layers. First, rate limiting with express-rate-limit — different limits for different endpoints: 100 requests per 15 minutes for the API, only 5 per hour for key generation, 60 per minute for redirects. The library tracks a counter per IP address in memory. Second, API key authentication on all write endpoints — no key, no shortening. Third, Helmet.js sets Content-Security-Policy and other headers that prevent the admin dashboard from being embedded in iframes or injected with external scripts. I also hash IP addresses with SHA-256 and a salt before storing them — that is GDPR compliance, since raw IPs are personally identifiable information.

### "What is an aggregation pipeline?"

It is MongoDB's way of processing data in stages, similar to Unix pipes where output of one command feeds into the next. Each stage transforms the document set. For example, to get click counts by country: first $match to filter clicks for a specific short code and date range — this uses the compound index. Then $group to aggregate by country field and sum up document counts. Then $sort descending by count. Then $limit to take top 10. Then $project to reshape the output fields. It is equivalent to SELECT country, COUNT(*) FROM clicks WHERE shortCode='abc' GROUP BY country ORDER BY COUNT(*) DESC LIMIT 10 in SQL. I run multiple pipelines in parallel using Promise.all() so all the different chart datasets load simultaneously instead of sequentially.

### "Explain graceful shutdown"

When the OS or Docker wants to stop the process — like during a deployment — it sends SIGTERM. Without handling it, Node.js would immediately die, dropping any in-progress HTTP requests and leaving MongoDB write operations incomplete. I listen for SIGTERM and SIGINT signals. When received, I call server.close() which stops accepting new connections but lets existing requests finish. Then I close the Mongoose connection cleanly, which flushes any pending writes. Then I exit with code 0. I also have a 10-second timeout — if graceful shutdown takes too long, I force exit. This is especially important in Docker and Kubernetes where containers are frequently restarted.

### "What are Mongoose virtuals?"

Virtuals are computed properties on a Mongoose document that are NOT stored in MongoDB. They are calculated in JavaScript when you access them. I use one called effectiveCode which returns the custom alias if it exists, otherwise the shortCode. This is useful so I can always call urlDoc.effectiveCode and it figures out the right code to use without me needing conditional logic everywhere. The important thing is I have to use a regular function, not an arrow function, because virtuals use 'this' to refer to the document, and arrow functions do not have their own 'this' — they would inherit from the outer scope.

---

## Quick Technical Reference

### HTTP Status Codes Used

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | URL already shortened (returned existing) |
| 201 | Created | New URL created |
| 302 | Found (redirect) | Successful redirect |
| 400 | Bad Request | Validation error |
| 401 | Unauthorized | No API key provided |
| 403 | Forbidden | Invalid API key / wrong owner |
| 404 | Not Found | Short code does not exist |
| 409 | Conflict | Custom alias already taken |
| 410 | Gone | Link expired |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unhandled exception |

### Key Libraries and What They Replace

| Library | Replaces | Why Better |
|---------|---------|------------|
| nanoid | Math.random() | Cryptographically secure |
| bcryptjs | SHA-256 for passwords | Intentionally slow; salted |
| joi | Manual if checks | Declarative; better errors |
| helmet | 15 manual res.setHeader() calls | One line, best practices |
| express-rate-limit | Manual IP counters | Tested, handles edge cases |
| ua-parser-js | Regex from scratch | 10k+ browser patterns |
| geoip-lite | External API call | Offline, <0.1ms, no rate limits |
| morgan | console.log(req.url) | Apache format, configurable |

---

This document was created alongside the project. Every concept here is implemented in the actual source files — cross-reference any section with the corresponding source file for the real code.
