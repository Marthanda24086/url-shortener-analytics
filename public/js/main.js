// ============================================================
// public/js/main.js
// PURPOSE: Frontend logic for the landing page.
// WHY: Vanilla JS — no framework overhead; simpler for this scale.
// HOW: fetch() API for AJAX calls to our Express backend.
// ============================================================

/* ── State ──────────────────────────────────────────────────── */
let lastCreatedUrl = null; // Store the last API response

/* ── DOM Helpers ─────────────────────────────────────────────── */
const $ = (id) => document.getElementById(id);

/* ── Toggle Advanced Options ─────────────────────────────────── */
function toggleAdvanced() {
  const opts = $('advanced-options');
  const chevron = $('adv-chevron');
  const visible = opts.classList.toggle('visible');
  chevron.style.transform = visible ? 'rotate(180deg)' : 'rotate(0deg)';
}

/* ── Generate API Key ─────────────────────────────────────────── */
async function generateApiKey() {
  try {
    const response = await fetch('/api/keys/generate', { method: 'POST' });
    const data = await response.json();

    if (data.success) {
      $('api-key-input').value = data.apiKey;
      showToast('🔑 API key generated! Save it securely.', 'success');
    }
  } catch (err) {
    showToast('Failed to generate API key', 'error');
  }
}

/* ── Shorten URL ─────────────────────────────────────────────── */
async function shortenUrl() {
  const url = $('url-input').value.trim();
  const apiKey = $('api-key-input').value.trim();

  // Client-side validation before hitting the server
  if (!url) {
    showToast('Please enter a URL', 'error');
    $('url-input').focus();
    return;
  }

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    showToast('URL must start with http:// or https://', 'error');
    return;
  }

  if (!apiKey) {
    showToast('Please enter your API key', 'error');
    return;
  }

  // Build request payload
  const payload = { url };

  const alias = $('custom-alias').value.trim();
  if (alias) payload.customAlias = alias;

  const expires = $('expires-in').value.trim();
  if (expires) payload.expiresIn = parseInt(expires);

  const password = $('link-password').value.trim();
  if (password) payload.password = password;

  const tagsRaw = $('link-tags').value.trim();
  if (tagsRaw) payload.tags = tagsRaw.split(',').map((t) => t.trim()).filter(Boolean);

  const title = $('link-title').value.trim();
  if (title) payload.title = title;

  // Show loading state
  setLoading(true);

  try {
    /**
     * fetch() — browser's built-in HTTP client.
     *
     * fetch(url, options) returns a Promise<Response>
     * We await the Response then call .json() to parse the body.
     * .json() also returns a Promise — hence the second await.
     */
    const response = await fetch('/api/shorten', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json', // Tell server body is JSON
        'x-api-key': apiKey,               // Our custom auth header
      },
      body: JSON.stringify(payload), // Convert JS object to JSON string
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to shorten URL');
    }

    // ── Success ───────────────────────────────────────────────
    lastCreatedUrl = data.data;
    displayResult(data.data);
    showToast('🎉 URL shortened successfully!', 'success');
    loadRecentLinks(apiKey);
    loadStats(apiKey);

  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    setLoading(false);
  }
}

/* ── Display Result ───────────────────────────────────────────── */
function displayResult(urlData) {
  $('result-section').style.display = 'block';
  $('result-section').scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  $('short-url-display').textContent = urlData.shortUrl;
  $('short-url-display').href = urlData.shortUrl;

  // QR Code (base64 image)
  if (urlData.qrCode) {
    $('qr-image').src = urlData.qrCode;
  }

  // Meta info
  $('qr-original').textContent = truncate(urlData.originalUrl, 50);
  $('qr-created').textContent = new Date(urlData.createdAt).toLocaleDateString();
  $('qr-expires').textContent = urlData.expiresAt
    ? new Date(urlData.expiresAt).toLocaleDateString()
    : 'Never';

  // Animate in
  $('result-section').style.animation = 'fadeInUp 0.4s ease';
}

/* ── Copy URL ─────────────────────────────────────────────────── */
async function copyUrl() {
  if (!lastCreatedUrl) return;

  try {
    // navigator.clipboard is the modern async clipboard API
    await navigator.clipboard.writeText(lastCreatedUrl.shortUrl);
    showToast('📋 Copied to clipboard!', 'success');
  } catch {
    // Fallback for older browsers
    const el = document.createElement('textarea');
    el.value = lastCreatedUrl.shortUrl;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    showToast('📋 Copied!', 'success');
  }
}

/* ── Download QR ─────────────────────────────────────────────── */
function downloadQR() {
  if (!lastCreatedUrl?.qrCode) return;

  const link = document.createElement('a');
  link.href = lastCreatedUrl.qrCode;
  link.download = `qr-${lastCreatedUrl.shortCode}.png`;
  link.click(); // Programmatically trigger download
}

/* ── View Analytics ───────────────────────────────────────────── */
function viewAnalytics() {
  if (!lastCreatedUrl) return;
  // Navigate to dashboard with the short code as a query param
  window.location.href = `/dashboard.html?code=${lastCreatedUrl.shortCode}`;
}

/* ── Load Stats ───────────────────────────────────────────────── */
async function loadStats(apiKey) {
  try {
    const res = await fetch('/api/analytics/dashboard', {
      headers: { 'x-api-key': apiKey },
    });
    const data = await res.json();

    if (data.success) {
      // Animate number counting
      animateCounter('stat-total-urls', data.data.totalUrls);
      animateCounter('stat-total-clicks', data.data.totalClicks);
    }
  } catch (err) {
    // Silently fail — stats are not critical
  }
}

/* ── Load Recent Links ────────────────────────────────────────── */
async function loadRecentLinks(apiKey) {
  try {
    const res = await fetch('/api/urls?limit=5', {
      headers: { 'x-api-key': apiKey },
    });
    const data = await res.json();

    if (!data.success || !data.data.length) return;

    $('recent-links').style.display = 'block';

    const html = data.data.map((url) => `
      <div class="glass-card" style="margin-bottom: 1rem; padding: 1rem 1.5rem;">
        <div style="display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;">
          <div style="flex: 1; min-width: 200px;">
            <a href="${url.shortUrl}" target="_blank" style="font-weight: 600; color: var(--primary-light); font-size: 0.95rem;">
              ${url.shortUrl}
            </a>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.2rem; word-break: break-all;">
              ${truncate(url.originalUrl, 60)}
            </p>
          </div>
          <div style="display: flex; align-items: center; gap: 1.5rem; flex-shrink: 0;">
            <div style="text-align: center;">
              <div style="font-size: 1.25rem; font-weight: 700; color: var(--primary-light);">${url.clicks}</div>
              <div style="font-size: 0.7rem; color: var(--text-muted);">clicks</div>
            </div>
            <span class="badge ${url.isActive ? 'badge-success' : 'badge-danger'}">
              ${url.isActive ? 'Active' : 'Inactive'}
            </span>
            <a href="/dashboard.html?code=${url.shortCode}" class="btn btn-secondary btn-sm">
              <i class="fas fa-chart-bar"></i>
            </a>
          </div>
        </div>
      </div>
    `).join('');

    $('recent-links-list').innerHTML = html;

  } catch (err) {
    // Silently fail
  }
}

/* ── Utility: Animate Counter ─────────────────────────────────── */
function animateCounter(elementId, target) {
  const el = $(elementId);
  if (!el) return;
  let current = 0;
  const step = Math.max(1, Math.floor(target / 30));
  const timer = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = current.toLocaleString();
    if (current >= target) clearInterval(timer);
  }, 30);
}

/* ── Utility: Loading State ───────────────────────────────────── */
function setLoading(loading) {
  const btn = $('shorten-btn');
  const text = $('btn-text');
  const spinner = $('btn-spinner');

  btn.disabled = loading;
  text.style.display = loading ? 'none' : 'flex';
  spinner.style.display = loading ? 'block' : 'none';
}

/* ── Utility: Toast ───────────────────────────────────────────── */
function showToast(message, type = 'info') {
  const container = $('toast-container');
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${icons[type]}</span><span>${message}</span>`;

  container.appendChild(toast);

  // Auto-remove after 3 seconds
  setTimeout(() => toast.remove(), 3100);
}

/* ── Utility: Truncate ────────────────────────────────────────── */
function truncate(str, len) {
  return str.length > len ? str.substring(0, len) + '...' : str;
}

/* ── Enter key shortcut ───────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  $('url-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') shortenUrl();
  });

  // Auto-load stats if API key is set
  const apiKey = $('api-key-input').value.trim();
  if (apiKey) {
    loadStats(apiKey);
    loadRecentLinks(apiKey);
  }
});
