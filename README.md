# ⚡ LinkSnap — Production URL Shortener & Click Analytics

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-4.19-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

A high-performance, full-stack **URL Shortener** and **Real-Time Click Analytics Engine** built with Node.js, Express, and MongoDB. Includes a responsive Glassmorphism Web UI, high-speed 302 redirects (<5ms), GeoIP resolution, User-Agent device fingerprinting, QR code generator, and comprehensive aggregation dashboards.

[Features](#-features) • [Tech Stack](#-tech-stack) • [Quick Start](#-quick-start) • [Live Deployment Guide](#-live-deployment-guide) • [API Documentation](#-api-documentation) • [Architecture](#-architecture)

</div>

---

## ✨ Features

### 🔗 URL Shortening & Link Management
- **Cryptographic Base62 Generation**: Utilizes `nanoid` CSPRNG with 6-character Base62 encoding (over **56.8 billion** possible unique combinations).
- **Custom Vanity Aliases**: Create branded URLs (e.g., `linksnap.com/my-launch`) with automatic collision checking.
- **URL Deduplication**: Fingerprints URLs using SHA-256 to prevent duplicate generation for the same user.
- **Link Expiration (TTL)**: Optional auto-expiring links that automatically return `410 Gone` after expiration.
- **Bcrypt Password Protection**: Secure private short links with encrypted passwords.
- **Dynamic QR Code Generation**: Downloadable Base64 and PNG QR codes for every generated link.

### 📊 Real-Time Click Analytics
- **Fire-and-Forget Architecture**: Analytics ingestion happens asynchronously in background micro-tasks — redirects complete in **< 5ms** with zero user latency.
- **Geolocation Resolution**: Offline GeoIP lookup using local MaxMind databases (resolves Country, Region, and City in < 0.1ms).
- **Device & Browser Analytics**: In-depth User-Agent parsing for device type (Mobile, Desktop, Tablet), OS, and browser.
- **Referrer Tracking**: Captures incoming HTTP referrers to track marketing campaign attribution.
- **GDPR-Compliant IP Anonymization**: IP addresses are irreversibly hashed with a rotating secret salt before storage.
- **Interactive Visual Dashboard**: Chart.js graphs displaying click velocity over time, device breakdowns, browser distributions, and geo maps.

### 🛡️ Enterprise Security & Reliability
- **Multi-Tier Rate Limiting**: Built-in sliding-window rate limiters for API requests, key generation, and redirects.
- **API Key Authentication**: In-memory and header-based authentication (`x-api-key`).
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
- **Frontend**: Vanilla HTML5, Modern Glassmorphism CSS, Vanilla JS, [Chart.js](https://www.chartjs.org/)
- **DevOps**: Docker, Docker Compose, Alpine Linux

---

## 🚀 Quick Start (Local Setup)

### 1. Clone the repository
```bash
git clone https://github.com/<your-username>/<repo-name>.git
cd <repo-name>
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
- **Landing Page & Shortener**: [http://localhost:3000](http://localhost:3000)
- **Analytics Dashboard**: [http://localhost:3000/dashboard.html](http://localhost:3000/dashboard.html)

---

## 🐳 Run with Docker Compose

Run the entire application stack including MongoDB and Mongo Express with a single command:

```bash
docker compose up -d
```

- **App**: `http://localhost:3000`
- **Mongo Express DB Admin**: `http://localhost:8081` (User: `admin`, Pass: `password`)

---

## 🌐 Live Deployment Guide (Deploy as a Free Public Webpage)

To make your project a live, interactive webpage that anyone can visit on the internet:

### Step 1: Set Up Free Cloud MongoDB (MongoDB Atlas)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and sign up for a free account.
2. Click **Create Cluster** and select the free **M0 Shared** tier.
3. In **Database Access**, create a database user (username and password).
4. In **Network Access**, click **Add IP Address** and choose **Allow Access From Anywhere** (`0.0.0.0/0`).
5. Click **Connect** → **Drivers** and copy your MongoDB connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net/url-shortener?retryWrites=true&w=majority
   ```

### Step 2: Deploy to Render.com (100% Free Hosting)
1. Push your repository to **GitHub** (see Git steps below).
2. Go to [Render.com](https://render.com) and sign in with GitHub.
3. Click **New +** → **Web Service**.
4. Connect your GitHub repository.
5. Configure the service:
   - **Name**: `linksnap-shortener` (or your preferred name)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free`
6. Under **Environment Variables**, add:
   - `MONGO_URI`: *(Paste your MongoDB Atlas connection string from Step 1)*
   - `NODE_ENV`: `production`
   - `DEMO_API_KEY`: `demo_key_12345`
   - `IP_HASH_SALT`: `your_random_salt_string`
   - `BASE_URL`: `https://linksnap-shortener.onrender.com` *(Use your Render service URL)*
7. Click **Create Web Service**. Within 2-3 minutes, your live webpage and API are active!

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
  "customAlias": "my-custom-link",      // optional
  "expiresIn": 86400,                   // optional (seconds)
  "password": "secretPassword",          // optional
  "title": "My Link",                   // optional
  "tags": ["marketing", "promo"]        // optional
}
```

**Response (`201 Created`):**
```json
{
  "success": true,
  "data": {
    "shortCode": "my-custom-link",
    "shortUrl": "http://localhost:3000/my-custom-link",
    "originalUrl": "https://example.com/very-long-url-path",
    "qrCode": "data:image/png;base64,...",
    "expiresAt": "2026-10-30T23:00:00.000Z",
    "clicks": 0
  }
}
```

### 2. Access / Redirect
```http
GET /:code
```
Redirects client with `302 Found` to the target URL and triggers background click analytics recording.

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

### 5. Generate API Key
```http
POST /api/keys/generate
```

### 6. Health Check
```http
GET /api/health
```

---

## 🏛️ Architecture

```
[ Client Request ]
       │
       ▼
 [ Express App ]
   ├── Helmet.js (Security Headers)
   ├── CORS Middleware
   ├── Rate Limiters (express-rate-limit)
   └── Body Parser
       │
   ┌───┴────────────────────────┐
   ▼                            ▼
[ API Routes ]            [ Redirect Router ]
/api/*                         /:code
   │                            │
   ▼                            ├─► [ MongoDB Url Lookup ]
[ Controller Logic ]            │
- Joi Validation                ├─► [ 302 Redirect Response ] (<5ms)
- Base62 / SHA-256              │
- Mongoose Operations           └─► [ Background Analytics Task (Fire-and-Forget) ]
   │                                  ├── User-Agent Parser
   ▼                                  ├── Offline GeoIP Resolution
[ MongoDB Atlas ]                     ├── Salted IP Anonymizer
(Urls & Clicks collections)           └── Click Event Insertion & $inc Counter
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
