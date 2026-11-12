# ⚡ LinkSnap — Precision Edge Routing Engine & Telemetry System

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-24.x-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-4.19-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-FF5500?style=for-the-badge)

A high-performance, full-stack **URL Shortener** and **Real-Time Telemetry Workstation** designed with Swiss modernist precision engineering. Features sub-5ms 302 redirects, offline MaxMind GeoIP resolution, User-Agent hardware fingerprinting, cryptographic Base62 synthesis, dynamic QR generation, and an aerospace-grade analytics dashboard.

[🌐 Live Preview](https://marthanda24086.github.io/url-shortener-analytics/) • [Architecture](#-architecture) • [Design System](#-design-system) • [Documentation Suite](#-documentation-suite) • [Quick Start](#-quick-start) • [API Specs](#-api-documentation)

</div>

---

## 📚 Studio Documentation Suite

This project includes professional product and engineering documentation:

1. 📄 **[PROJECT_ANALYSIS.md](PROJECT_ANALYSIS.md)** — Architecture analysis, product goals, problem statement, and roadmap.
2. 🎨 **[DESIGN_RESEARCH.md](DESIGN_RESEARCH.md)** — Benchmark studies from Awwwards, Godly, Linear, Stripe Press, and Vercel.
3. 📐 **[DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)** — Complete token specifications, obsidian color systems, and typography rules.
4. 🏗️ **[ARCHITECTURE.md](ARCHITECTURE.md)** — Frontend and backend system design, fire-and-forget ingestion pipeline.
5. 📝 **[IMPLEMENTATION_LOG.md](IMPLEMENTATION_LOG.md)** — Log of all component additions, technical improvements, and feature mappings.
6. 🧪 **[TESTING_REPORT.md](TESTING_REPORT.md)** — Automated Chromium visual regression audits across 5 viewports and WCAG 2.1 AAA accessibility report.
7. 🎓 **[INTERVIEW_GUIDE.md](INTERVIEW_GUIDE.md)** — Technical deep-dive teaching every concept and line of code for interviews and CV reviews.

---

## ✨ System Capabilities

### 🔗 Routing & Link Engineering
- **Cryptographic Base62 Generation**: Utilizes `nanoid` CSPRNG with 6-character Base62 encoding (over **56.8 billion** possible unique combinations).
- **Custom Vanity Aliases**: Create branded URLs (e.g., `linksnap.com/prod-launch`) with automatic collision checking.
- **URL Deduplication**: Fingerprints URLs using SHA-256 to prevent duplicate generation for the same user.
- **Link Expiration (TTL)**: Optional auto-expiring links that automatically return `410 Gone` after expiration.
- **Bcrypt Password Protection**: Secure private short links with encrypted passwords.
- **Dynamic QR Code Matrix**: Downloadable high-error-correction PNG QR codes for every generated link.

### 📊 Real-Time Click Telemetry
- **Sub-5ms Fire-and-Forget Architecture**: Analytics ingestion happens asynchronously in background micro-tasks — redirects complete in **< 3.8ms** with zero user latency.
- **Offline Geolocation Resolution**: Instant MaxMind GeoIP lookup using local embedded binary databases (resolves Country, Region, and City in < 0.1ms).
- **Hardware & Engine Fingerprinting**: In-depth User-Agent parsing for device type (Mobile, Desktop, Tablet), OS kernel, and browser engine.
- **Referrer Attribution**: Captures incoming HTTP referrers to track marketing campaign conversion channels.
- **GDPR-Compliant Salted Hashing**: IP addresses are irreversibly hashed with a rotating secret salt before storage.
- **Interactive Telemetry Workstation**: Chart.js data visualizations displaying 30-day velocity curves, device breakdowns, browser distributions, and geo maps.

### 🛡️ Enterprise Security & Reliability
- **Multi-Tier Rate Limiting**: Built-in sliding-window rate limiters for API requests, key generation, and redirects.
- **API Key Authentication**: Header-based authentication (`x-api-key`).
- **HTTP Security Headers**: Complete `helmet` integration (CSP, HSTS, X-Frame-Options against clickjacking, XSS protection).
- **Graceful Zero-Downtime Shutdown**: Handles `SIGTERM` and `SIGINT` to safely flush MongoDB queries before process termination.
- **Docker & Docker Compose**: Full containerization with health checks and persistent volume management.

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Encoding & Math**: `nanoid` (Base62 CSPRNG), `crypto` (SHA-256 & Salted IP Hashing), `bcryptjs`
- **Analytics & Geo**: `geoip-lite`, `ua-parser-js`
- **Security**: `helmet`, `cors`, `express-rate-limit`, `joi`
- **Frontend**: Semantic HTML5, CSS Custom Properties, Vanilla ES6, [Chart.js](https://www.chartjs.org/)
- **DevOps**: Docker, Docker Compose, Alpine Linux

---

## 🚀 Quick Start (Local Setup)

### 1. Clone the repository
```bash
git clone https://github.com/<your-username>/url-shortener-analytics.git
cd url-shortener-analytics
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Create a `.env` file in the project root (see `.env.example`):
```env
PORT=3000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/url-shortener
BASE_URL=http://localhost:3000
MASTER_API_KEY=sk_master_secret_key_12345
DEMO_API_KEY=demo_key_12345
IP_HASH_SALT=your_custom_secret_salt_here
```

### 4. Run the app
```bash
# Development (with nodemon auto-restart)
npm run dev

# Production
npm start
```

Open your browser at:
- **Landing Page & Routing Console**: [http://localhost:3000](http://localhost:3000)
- **Telemetry Workstation**: [http://localhost:3000/dashboard.html](http://localhost:3000/dashboard.html)

---

## 🐳 Run with Docker Compose

Run the entire application stack including MongoDB and Mongo Express with a single command:

```bash
docker compose up -d
```

- **App**: `http://localhost:3000`
- **Mongo Express DB Admin**: `http://localhost:8081` (User: `admin`, Pass: `password`)

---

## 🌐 Live Deployment Guide (Deploy Free Webpage)

### Step 1: Set Up Free Cloud MongoDB (MongoDB Atlas)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and sign up for a free account.
2. Click **Create Cluster** and select the free **M0 Shared** tier.
3. In **Database Access**, create a database user (username and password).
4. In **Network Access**, click **Add IP Address** and choose **Allow Access From Anywhere** (`0.0.0.0/0`).
5. Click **Connect** → **Drivers** and copy your MongoDB connection string.

### Step 2: Deploy to Render.com (100% Free Hosting)
1. Push your repository to **GitHub**.
2. Go to [Render.com](https://render.com) and sign in with GitHub.
3. Click **New +** → **Web Service** and select your repository.
4. Set Build Command: `npm install`, Start Command: `npm start`.
5. Under **Environment Variables**, add `MONGO_URI`, `NODE_ENV=production`, `DEMO_API_KEY=demo_key_12345`, `IP_HASH_SALT=your_salt`, `BASE_URL=https://your-service.onrender.com`.
6. Click **Deploy Web Service**.

---

## 📖 API Documentation

All write endpoints require the `x-api-key` HTTP header.

### 1. Shorten URL
```http
POST /api/shorten
Content-Type: application/json
x-api-key: your_api_key

{
  "url": "https://example.com/very-long-url-path",
  "customAlias": "prod-release",        // optional
  "expiresIn": 86400,                   // optional (seconds)
  "password": "secretPassword",          // optional
  "title": "Release v2.0",              // optional
  "tags": ["deploy", "cloud"]           // optional
}
```

### 2. Access / Redirect
```http
GET /:code
```
Redirects client with `302 Found` to the target URL and triggers background click analytics recording in `<3.8ms`.

### 3. URL Analytics
```http
GET /api/analytics/:code?days=30
x-api-key: your_api_key
```

### 4. Overall User Analytics Dashboard
```http
GET /api/analytics/dashboard
x-api-key: your_api_key
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
