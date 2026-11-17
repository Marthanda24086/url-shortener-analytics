# KAIRO — REST API Documentation

Base URL: `http://localhost:3000`  
Standard Response Format: JSON (`{ "success": boolean, "data"?: any, "error"?: string }`)  
Authentication: HTTP-only Session Cookie (`kairo_token`) or `Authorization: Bearer <token>`  

---

## 1. Authentication Endpoints

### `POST /api/auth/register`
Creates a new user account.
- **Request Body:**
  ```json
  {
    "name": "Alex Mercer",
    "email": "alex@example.com",
    "password": "SecurePassword123!"
  }
  ```
- **Response (201 Created):**
  Sets `kairo_token` HTTP-only cookie.
  ```json
  {
    "success": true,
    "user": { "id": "usr_abc123", "name": "Alex Mercer", "email": "alex@example.com" }
  }
  ```

### `POST /api/auth/login`
Authenticates existing credentials.
- **Request Body:**
  ```json
  {
    "email": "alex@example.com",
    "password": "SecurePassword123!"
  }
  ```
- **Response (200 OK):**
  Sets `kairo_token` HTTP-only cookie.

### `GET /api/auth/me`
Fetches authenticated user identity.
- **Response (200 OK):** Current user object.
- **Response (401 Unauthorized):** If unauthenticated.

### `POST /api/auth/logout`
Clears session cookies.

---

## 2. Links Management Endpoints

### `POST /api/links`
Generates a new shortened URL.
- **Headers:** Authentication required
- **Request Body:**
  ```json
  {
    "originalUrl": "https://github.com/features/actions",
    "customAlias": "gh-actions",  // optional
    "title": "GitHub Actions Documentation", // optional
    "expiresAt": "2026-12-31T23:59:59Z" // optional
  }
  ```
- **Validation Rules:**
  - Protocol must be `http://` or `https://`
  - Rejects localhost, 127.0.0.1, private RFC-1918 IPs, or executable schemes (`javascript:`, `data:`)
  - Validates character set for `customAlias` (`[a-zA-Z0-9-_]+`, min 3, max 32)
  - Checks against reserved slugs (`api`, `login`, `register`, `dashboard`, `r`, `settings`, etc.)
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "link": {
      "id": "lnk_987xyz",
      "shortCode": "gh-actions",
      "shortUrl": "http://localhost:3000/r/gh-actions",
      "originalUrl": "https://github.com/features/actions",
      "title": "GitHub Actions Documentation",
      "isActive": true,
      "expiresAt": "2026-12-31T23:59:59Z",
      "createdAt": "2026-11-12T20:45:00Z"
    }
  }
  ```

### `GET /api/links`
Retrieves paginated list of user's links.
- **Query Parameters:**
  - `page`: default `1`
  - `limit`: default `10`
  - `search`: search query in title, shortCode, or originalUrl
  - `status`: filter by `all`, `active`, `paused`, `expired`
  - `sortBy`: `createdAt`, `clicks`, `title`
  - `sortOrder`: `asc`, `desc`
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "links": [ ... ],
    "pagination": { "total": 24, "page": 1, "limit": 10, "totalPages": 3 }
  }
  ```

### `GET /api/links/[id]`
Retrieves detail information for a single link belonging to the authenticated user.

### `PATCH /api/links/[id]`
Updates link properties: destination, title, customAlias, expiresAt, or toggles `isActive` status.

### `DELETE /api/links/[id]`
Permanently deletes a short link and all associated click events.

---

## 3. Short URL Redirection Engine

### `GET /r/:shortCode`
Public HTTP 302 redirect endpoint.
- Validates short code.
- Checks if link exists. Returns custom branded 404 page if not found.
- Checks if link is paused (`isActive === 0`). Returns custom 403 Paused page if paused.
- Checks if expired (`expiresAt < NOW()`). Returns custom 410 Expired page if expired.
- Asynchronously records click event:
  - Extracts Referrer header and canonicalizes domain.
  - Parses User-Agent for OS, Browser, Device Type, and Bot flag.
  - Generates privacy-preserving SHA-256 HMAC visitor fingerprint.
- Sends HTTP 302 Found redirect with `Location: <originalUrl>` and `Cache-Control: no-cache, no-store, must-revalidate`.

---

## 4. Analytics Endpoints

### `GET /api/analytics/overview`
Retrieves aggregated dashboard metrics across all user links for the given timeframe.
- **Query Parameters:** `range`: `24h` | `7d` | `30d` | `90d` | `all`
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "metrics": {
      "totalClicks": 1420,
      "clicksToday": 84,
      "uniqueVisitors": 980,
      "activeLinks": 12,
      "growthRate": 18.5
    },
    "clicksOverTime": [ { "date": "2026-11-06", "clicks": 180, "unique": 142 }, ... ],
    "devices": [ { "name": "Desktop", "value": 850 }, { "name": "Mobile", "value": 520 }, { "name": "Tablet", "value": 50 } ],
    "browsers": [ { "name": "Chrome", "value": 820 }, { "name": "Safari", "value": 310 }, ... ],
    "operatingSystems": [ { "name": "macOS", "value": 620 }, { "name": "Windows", "value": 480 }, ... ],
    "referrers": [ { "name": "Direct", "value": 600 }, { "name": "twitter.com", "value": 350 }, ... ],
    "recentActivity": [ ... ]
  }
  ```

### `GET /api/analytics/link/[id]`
Retrieves granular analytics for a single specific link over the selected date range.
