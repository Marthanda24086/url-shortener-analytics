// ============================================================
// public/js/dashboard.js
// PURPOSE: Dashboard page logic — charts, tables, analytics.
// HOW: Chart.js for visualizations, fetch() for API calls.
// ============================================================

/* ── Chart.js Global Defaults ────────────────────────────────── */
Chart.defaults.color = '#94a3b8';
Chart.defaults.borderColor = 'rgba(99, 102, 241, 0.1)';
Chart.defaults.font.family = 'Inter, system-ui, sans-serif';

/* ── State ──────────────────────────────────────────────────── */
let currentPeriod = 7;
let charts = {}; // Store chart instances to destroy/re-create
let currentPage = 1;

/* ── Helpers ─────────────────────────────────────────────────── */
const $ = (id) => document.getElementById(id);
const getApiKey = () => $('dash-api-key').value.trim();

const showToast = (msg, type = 'info') => {
  const container = $('toast-container');
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${icons[type]}</span><span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3100);
};

/* ── Section Navigation ──────────────────────────────────────── */
function showSection(section) {
  ['overview', 'links', 'analytics'].forEach((s) => {
    $(`section-${s}`).style.display = s === section ? 'block' : 'none';
  });

  // Update active state in sidebar
  document.querySelectorAll('.sidebar-nav-item').forEach((el) => {
    el.classList.remove('active');
    if (el.textContent.toLowerCase().includes(section)) {
      el.classList.add('active');
    }
  });

  if (section === 'links') loadLinks();
}

/* ── Load Dashboard ──────────────────────────────────────────── */
async function loadDashboard() {
  const apiKey = getApiKey();
  if (!apiKey) { showToast('Enter your API key', 'error'); return; }

  try {
    const res = await fetch('/api/analytics/dashboard', {
      headers: { 'x-api-key': apiKey },
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);

    const d = data.data;

    // ── Update stat cards ─────────────────────────────────────
    $('stat-links').textContent = d.totalUrls.toLocaleString();
    $('stat-clicks').textContent = d.totalClicks.toLocaleString();
    $('last-updated').textContent = new Date().toLocaleTimeString();

    // Best link clicks
    const bestClicks = d.topUrls[0]?.clicks || 0;
    $('stat-top-clicks').textContent = bestClicks.toLocaleString();
    $('stat-unique').textContent = '—'; // Would require separate query

    // ── Top Links ─────────────────────────────────────────────
    renderTopLinks(d.topUrls);

    // ── Recent Activity ───────────────────────────────────────
    renderRecentActivity(d.recentClicks);

    // ── Load clicks-over-time chart ───────────────────────────
    await loadOverviewChart(apiKey);

  } catch (err) {
    showToast(err.message || 'Failed to load dashboard', 'error');
  }
}

/* ── Overview Chart (aggregate of all links) ─────────────────── */
async function loadOverviewChart(apiKey) {
  // For demo: use first URL's analytics if available
  try {
    const res = await fetch('/api/urls?limit=1', { headers: { 'x-api-key': apiKey } });
    const data = await res.json();
    if (data.data?.length) {
      const code = data.data[0].shortCode;
      const aRes = await fetch(`/api/analytics/${code}?days=30`, { headers: { 'x-api-key': apiKey } });
      const aData = await aRes.json();
      if (aData.success) {
        renderClicksOverTimeChart('chart-clicks-over-time', aData.data.charts.clicksByDay);
      }
    }
  } catch { /* silent */ }
}

/* ── Render Top Links ─────────────────────────────────────────── */
function renderTopLinks(urls) {
  if (!urls.length) {
    $('top-links-list').innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem;">No links yet</p>';
    return;
  }

  const max = urls[0]?.clicks || 1;

  $('top-links-list').innerHTML = urls.map((u, i) => `
    <div style="display: flex; align-items: center; gap: 1rem; padding: 0.75rem 0; border-bottom: 1px solid var(--border-light);">
      <span style="font-size: 0.8rem; color: var(--text-muted); width: 20px; text-align: center;">${i + 1}</span>
      <div style="flex: 1; min-width: 0;">
        <div style="font-size: 0.85rem; font-weight: 600; color: var(--primary-light); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          /${u.customAlias || u.shortCode}
        </div>
        <div style="font-size: 0.75rem; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          ${u.originalUrl}
        </div>
        <div class="geo-bar-bg" style="margin-top: 6px;">
          <div class="geo-bar-fill" style="width: ${Math.round((u.clicks / max) * 100)}%"></div>
        </div>
      </div>
      <div style="text-align: right; flex-shrink: 0;">
        <div style="font-size: 1rem; font-weight: 700; color: var(--text-primary);">${u.clicks}</div>
        <div style="font-size: 0.7rem; color: var(--text-muted);">clicks</div>
      </div>
      <button class="btn btn-secondary btn-sm" onclick="analyzeCode('${u.shortCode}')">
        <i class="fas fa-chart-bar"></i>
      </button>
    </div>
  `).join('');
}

/* ── Render Recent Activity ───────────────────────────────────── */
function renderRecentActivity(clicks) {
  if (!clicks.length) {
    $('recent-activity').innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem;">No recent activity</p>';
    return;
  }

  const deviceIcons = { mobile: 'fa-mobile-alt', desktop: 'fa-desktop', tablet: 'fa-tablet-alt', unknown: 'fa-question' };

  $('recent-activity').innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th>Link</th>
          <th>Browser</th>
          <th>Country</th>
          <th>Device</th>
          <th>Time</th>
        </tr>
      </thead>
      <tbody>
        ${clicks.map((c) => `
          <tr>
            <td><span style="color: var(--primary-light); font-weight: 500;">/${c.shortCode}</span></td>
            <td>${c.browser || '—'}</td>
            <td>${c.country || '—'}</td>
            <td><i class="fas ${deviceIcons[c.device] || deviceIcons.unknown}" style="color: var(--text-muted);"></i> ${c.device}</td>
            <td style="font-size: 0.8rem;">${timeAgo(c.clickedAt)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

/* ── Load Links Table ─────────────────────────────────────────── */
async function loadLinks(page = 1) {
  currentPage = page;
  const apiKey = getApiKey();
  const search = $('search-input')?.value || '';

  try {
    const res = await fetch(`/api/urls?page=${page}&limit=10&search=${encodeURIComponent(search)}`, {
      headers: { 'x-api-key': apiKey },
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);

    renderLinksTable(data.data);
    renderPagination(data.pagination);

  } catch (err) {
    $('links-table-body').innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--danger);">${err.message}</td></tr>`;
  }
}

let searchTimeout;
function searchLinks(value) {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => loadLinks(1), 400); // Debounce 400ms
}

function renderLinksTable(urls) {
  if (!urls.length) {
    $('links-table-body').innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No links found</td></tr>`;
    return;
  }

  $('links-table-body').innerHTML = urls.map((u) => `
    <tr>
      <td>
        <a href="${u.shortUrl}" target="_blank" style="color: var(--primary-light); font-weight: 500;">
          ${u.shortUrl.replace(/^https?:\/\//, '')}
        </a>
        ${u.hasPassword ? '<i class="fas fa-lock" style="color: var(--warning); margin-left: 6px; font-size: 0.8rem;"></i>' : ''}
      </td>
      <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${u.originalUrl}">
        ${u.originalUrl}
      </td>
      <td style="font-weight: 600; color: var(--text-primary);">${u.clicks.toLocaleString()}</td>
      <td>
        <span class="badge ${u.isActive ? 'badge-success' : 'badge-danger'}">
          ${u.isActive ? 'Active' : 'Inactive'}
        </span>
        ${u.expiresAt ? `<span class="badge badge-warning" style="margin-left: 4px;" title="Expires ${new Date(u.expiresAt).toLocaleDateString()}">Expires</span>` : ''}
      </td>
      <td style="font-size: 0.8rem; color: var(--text-muted);">${new Date(u.createdAt).toLocaleDateString()}</td>
      <td>
        <div style="display: flex; gap: 0.5rem;">
          <button class="btn btn-secondary btn-sm" onclick="analyzeCode('${u.shortCode}')" title="Analytics">
            <i class="fas fa-chart-bar"></i>
          </button>
          <button class="btn btn-danger btn-sm" onclick="deleteLink('${u.shortCode}')" title="Delete">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function renderPagination({ total, page, pages }) {
  if (pages <= 1) { $('pagination').innerHTML = ''; return; }

  let html = '';
  for (let i = 1; i <= pages; i++) {
    html += `<button class="period-btn ${i === page ? 'active' : ''}" onclick="loadLinks(${i})">${i}</button>`;
  }
  $('pagination').innerHTML = html;
}

/* ── Delete Link ─────────────────────────────────────────────── */
async function deleteLink(code) {
  if (!confirm(`Delete /${code}? Analytics data will be preserved.`)) return;

  try {
    const res = await fetch(`/api/urls/${code}`, {
      method: 'DELETE',
      headers: { 'x-api-key': getApiKey() },
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    showToast('Link deleted', 'success');
    loadLinks(currentPage);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

/* ── Load Analytics ──────────────────────────────────────────── */
function analyzeCode(code) {
  showSection('analytics');
  $('analytics-code').value = code;
  loadAnalytics();
}

async function loadAnalytics() {
  const code = $('analytics-code').value.trim();
  const apiKey = getApiKey();
  if (!code) { showToast('Enter a short code', 'error'); return; }

  try {
    const res = await fetch(`/api/analytics/${code}?days=${currentPeriod}`, {
      headers: { 'x-api-key': apiKey },
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);

    $('analytics-panel').style.display = 'block';
    const { url, period, charts: ch } = data.data;

    // Stats
    $('a-total-clicks').textContent = period.totalClicks.toLocaleString();
    $('a-unique').textContent = period.uniqueVisitors.toLocaleString();
    $('a-bots').textContent = period.botClicks.toLocaleString();
    $('a-all-time').textContent = url.totalClicks.toLocaleString();

    // Charts
    renderClicksOverTimeChart('chart-daily', ch.clicksByDay);
    renderDonutChart('chart-devices', ch.clicksByDevice, 'device');
    renderDonutChart('chart-browsers', ch.clicksByBrowser, 'browser');
    renderBarChart('chart-hourly', ch.clicksByHour, 'hour', 'Clicks');
    renderGeoList('geo-list', ch.clicksByCountry, 'country');
    renderGeoList('referrer-list', ch.clicksByReferrer, 'referrer');

  } catch (err) {
    showToast(err.message, 'error');
  }
}

function setPeriod(days, btn) {
  currentPeriod = days;
  document.querySelectorAll('.period-btn').forEach((b) => b.classList.remove('active'));
  btn.classList.add('active');
  if ($('analytics-code').value) loadAnalytics();
}

/* ── Chart Renderers ─────────────────────────────────────────── */
const CHART_COLORS = [
  'rgba(99, 102, 241, 0.8)',
  'rgba(139, 92, 246, 0.8)',
  'rgba(6, 182, 212, 0.8)',
  'rgba(16, 185, 129, 0.8)',
  'rgba(245, 158, 11, 0.8)',
  'rgba(239, 68, 68, 0.8)',
];

function destroyChart(id) {
  if (charts[id]) { charts[id].destroy(); delete charts[id]; }
}

function renderClicksOverTimeChart(canvasId, data) {
  destroyChart(canvasId);
  if (!data.length) return;

  const ctx = $(canvasId).getContext('2d');

  // Fill missing days with 0
  charts[canvasId] = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.map((d) => d.date),
      datasets: [{
        label: 'Clicks',
        data: data.map((d) => d.count),
        borderColor: 'rgba(99, 102, 241, 1)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        fill: true,
        tension: 0.4, // Smooth curve
        pointRadius: 4,
        pointBackgroundColor: 'rgba(99, 102, 241, 1)',
        pointBorderColor: '#0a0a0f',
        pointBorderWidth: 2,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.04)' } },
        y: { grid: { color: 'rgba(255,255,255,0.04)' }, beginAtZero: true },
      },
    },
  });
}

function renderDonutChart(canvasId, data, key) {
  destroyChart(canvasId);
  if (!data.length) return;

  const ctx = $(canvasId).getContext('2d');
  charts[canvasId] = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: data.map((d) => d[key] || 'Unknown'),
      datasets: [{
        data: data.map((d) => d.count),
        backgroundColor: CHART_COLORS,
        borderColor: 'transparent',
        hoverOffset: 8,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true } },
      },
    },
  });
}

function renderBarChart(canvasId, data, labelKey, valueLabel) {
  destroyChart(canvasId);
  if (!data.length) return;

  const ctx = $(canvasId).getContext('2d');
  charts[canvasId] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.map((d) => `${d[labelKey]}:00`),
      datasets: [{
        label: valueLabel,
        data: data.map((d) => d.count),
        backgroundColor: 'rgba(99, 102, 241, 0.7)',
        borderRadius: 4,
        borderSkipped: false,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.04)' } },
        y: { grid: { color: 'rgba(255,255,255,0.04)' }, beginAtZero: true },
      },
    },
  });
}

function renderGeoList(containerId, data, key) {
  if (!data.length) {
    $(containerId).innerHTML = '<p style="color: var(--text-muted); font-size: 0.85rem;">No data yet</p>';
    return;
  }

  const max = data[0]?.count || 1;
  $(containerId).innerHTML = data.slice(0, 8).map((d) => `
    <div class="geo-item">
      <span class="geo-name">${d[key] || 'Unknown'}</span>
      <div class="geo-bar-bg">
        <div class="geo-bar-fill" style="width: ${Math.round((d.count / max) * 100)}%"></div>
      </div>
      <span class="geo-count">${d.count}</span>
    </div>
  `).join('');
}

/* ── API Health Check ─────────────────────────────────────────── */
async function checkHealth() {
  try {
    const res = await fetch('/api/health');
    const data = await res.json();
    if (data.success) {
      showToast(`✅ API OK — Uptime: ${Math.round(data.uptime)}s`, 'success');
    }
  } catch {
    showToast('❌ API unreachable', 'error');
  }
}

/* ── Time Ago ─────────────────────────────────────────────────── */
function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

/* ── Init ─────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  // Check URL params for pre-selected code
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');

  if (code) {
    showSection('analytics');
    $('analytics-code').value = code;
    loadAnalytics();
  }

  // Auto-load dashboard
  loadDashboard();
});
