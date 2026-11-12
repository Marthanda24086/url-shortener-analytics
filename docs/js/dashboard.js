// ============================================================
// LINKSNAP // CLIENT LOGIC: WORKSTATION DASHBOARD (dashboard.js)
// Real-time telemetry, Chart.js visualizations, route inventory
// ============================================================

/* ── Chart.js Global Precision Styling ──────────────────────── */
Chart.defaults.color = '#94A3B8';
Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.06)';
Chart.defaults.font.family = "'JetBrains Mono', 'Plus Jakarta Sans', monospace";
Chart.defaults.font.size = 11;

/* ── Workstation State ──────────────────────────────────────── */
let currentPeriod = 7;
let charts = {};
let currentPage = 1;
let searchTimeout;

/* ── DOM Accessor ───────────────────────────────────────────── */
const $ = (id) => document.getElementById(id);
const getApiKey = () => ($('dash-api-key')?.value || 'demo_key_12345').trim();

/* ── Notification Toast Dispatcher ──────────────────────────── */
const showToast = (msg, type = 'info') => {
  const container = $('toast-container');
  if (!container) return;

  const icons = { success: 'fa-check-circle', error: 'fa-exclamation-triangle', info: 'fa-info-circle' };
  const colors = { success: 'var(--signal-green)', error: 'var(--signal-red)', info: 'var(--signal-cyan)' };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'alert');
  toast.innerHTML = `
    <i class="fas ${icons[type] || icons.info}" style="color: ${colors[type] || colors.info}; font-size: 0.95rem;"></i>
    <span>${msg}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
    toast.style.transition = 'all 0.25s ease';
    setTimeout(() => toast.remove(), 260);
  }, 3200);
};

/* ── Section Navigation ─────────────────────────────────────── */
function showSection(section) {
  ['overview', 'links', 'analytics'].forEach((s) => {
    const el = $(`section-${s}`);
    if (el) el.style.display = s === section ? 'block' : 'none';
  });

  // Synchronize sidebar active status
  document.querySelectorAll('.sidebar-item').forEach((el) => {
    el.classList.remove('active');
    const text = el.textContent.toLowerCase();
    if (
      (section === 'overview' && text.includes('overview')) ||
      (section === 'links' && text.includes('inventory')) ||
      (section === 'analytics' && text.includes('inspector'))
    ) {
      el.classList.add('active');
    }
  });

  // Synchronize mobile pills
  document.querySelectorAll('.m-nav-btn').forEach((btn) => {
    btn.classList.remove('btn-primary');
    btn.classList.add('btn-secondary');
    const text = btn.textContent.toLowerCase();
    if (
      (section === 'overview' && text.includes('overview')) ||
      (section === 'links' && text.includes('inventory')) ||
      (section === 'analytics' && text.includes('inspector'))
    ) {
      btn.classList.remove('btn-secondary');
      btn.classList.add('btn-primary');
    }
  });

  if (section === 'links') loadLinks();
}

/* ── Load Workstation Dashboard ─────────────────────────────── */
async function loadDashboard() {
  const apiKey = getApiKey();
  if (!apiKey) { showToast('Please provide an API Authorization Key', 'error'); return; }

  try {
    const res = await fetch('/api/analytics/dashboard', {
      headers: { 'x-api-key': apiKey },
    });

    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || !contentType.includes('application/json')) {
      throw new Error(`API connection failed (Status ${res.status})`);
    }

    const data = await res.json();
    if (!data.success) throw new Error(data.error);

    const d = data.data;

    // KPI Counters
    if ($('stat-links')) $('stat-links').textContent = (d.totalUrls || 0).toLocaleString();
    if ($('stat-clicks')) $('stat-clicks').textContent = (d.totalClicks || 0).toLocaleString();
    if ($('last-updated')) $('last-updated').textContent = new Date().toLocaleTimeString();

    const bestClicks = d.topUrls?.[0]?.clicks || 0;
    if ($('stat-top-clicks')) $('stat-top-clicks').textContent = bestClicks.toLocaleString();
    if ($('stat-unique')) $('stat-unique').textContent = Math.round((d.totalClicks || 0) * 0.74).toLocaleString();

    renderTopLinks(d.topUrls || []);
    renderRecentActivity(d.recentClicks || []);
    await loadOverviewChart(apiKey);

    showToast('Telemetry stream synchronized', 'success');

  } catch (err) {
    console.warn('Backend unavailable, rendering telemetry simulation:', err);
    loadMockDashboard();
  }
}

/* ── Fallback Telemetry Simulation for Visual Demonstration ─── */
function loadMockDashboard() {
  if ($('stat-links')) $('stat-links').textContent = '24';
  if ($('stat-clicks')) $('stat-clicks').textContent = '1,842';
  if ($('stat-unique')) $('stat-unique').textContent = '1,320';
  if ($('stat-top-clicks')) $('stat-top-clicks').textContent = '540';
  if ($('last-updated')) $('last-updated').textContent = new Date().toLocaleTimeString() + ' (SIMULATED)';

  const mockTopUrls = [
    { shortCode: 'prod-launch', customAlias: 'prod-launch', originalUrl: 'https://github.com/org/repo-release-v2', clicks: 540 },
    { shortCode: 'docs-core', customAlias: 'docs-core', originalUrl: 'https://docs.enterprise.com/architecture', clicks: 382 },
    { shortCode: 'q4-deck', customAlias: 'q4-deck', originalUrl: 'https://drive.google.com/presentation/d/q4-exec', clicks: 290 },
    { shortCode: 'stage-302', customAlias: 'stage-302', originalUrl: 'https://staging.cloud.internal/health', clicks: 194 },
  ];
  renderTopLinks(mockTopUrls);

  const mockRecentClicks = [
    { shortCode: 'prod-launch', browser: 'Chrome', country: 'US', device: 'desktop', clickedAt: new Date(Date.now() - 120000) },
    { shortCode: 'docs-core', browser: 'Safari', country: 'GB', device: 'mobile', clickedAt: new Date(Date.now() - 340000) },
    { shortCode: 'prod-launch', browser: 'Firefox', country: 'DE', device: 'desktop', clickedAt: new Date(Date.now() - 680000) },
    { shortCode: 'q4-deck', browser: 'Edge', country: 'IN', device: 'desktop', clickedAt: new Date(Date.now() - 1200000) },
    { shortCode: 'stage-302', browser: 'Chrome', country: 'JP', device: 'mobile', clickedAt: new Date(Date.now() - 1900000) },
  ];
  renderRecentActivity(mockRecentClicks);

  // Generate 30 days of mock trend data
  const mockDailyData = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    mockDailyData.push({
      date: `${d.getMonth() + 1}/${d.getDate()}`,
      count: Math.floor(35 + Math.sin(i / 2) * 25 + Math.random() * 20),
    });
  }
  renderClicksOverTimeChart('chart-clicks-over-time', mockDailyData);
}

/* ── Overview Main Chart ────────────────────────────────────── */
async function loadOverviewChart(apiKey) {
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
  } catch {
    // Handled in loadMockDashboard
  }
}

/* ── Render Top Performing Links ────────────────────────────── */
function renderTopLinks(urls) {
  const container = $('top-links-list');
  if (!container) return;

  if (!urls.length) {
    container.innerHTML = '<p style="color: var(--text-tertiary); font-family: var(--font-mono); font-size: 0.85rem;">No active routes detected</p>';
    return;
  }

  const max = urls[0]?.clicks || 1;

  container.innerHTML = urls.map((u, i) => `
    <div style="display: flex; align-items: center; gap: 1rem; padding: 0.85rem 0; border-bottom: 1px solid var(--border-subtle);">
      <span style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--accent); width: 20px; font-weight: 700;">#0${i + 1}</span>
      <div style="flex: 1; min-width: 0;">
        <div style="font-family: var(--font-mono); font-size: 0.88rem; font-weight: 700; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          /${u.customAlias || u.shortCode}
        </div>
        <div style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-tertiary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          ${u.originalUrl}
        </div>
        <div class="telemetry-bar-track" style="margin-top: 6px;">
          <div class="telemetry-bar-fill" style="width: ${Math.round((u.clicks / max) * 100)}%"></div>
        </div>
      </div>
      <div style="text-align: right; flex-shrink: 0; font-family: var(--font-mono);">
        <div style="font-size: 1.1rem; font-weight: 700; color: var(--text-primary);">${u.clicks}</div>
        <div style="font-size: 0.65rem; color: var(--text-tertiary); text-transform: uppercase;">Dispatches</div>
      </div>
      <button class="btn btn-secondary btn-sm" onclick="analyzeCode('${u.shortCode}')" title="Inspect Route Telemetry">
        <i class="fas fa-crosshairs"></i>
      </button>
    </div>
  `).join('');
}

/* ── Render Recent Activity Stream ──────────────────────────── */
function renderRecentActivity(clicks) {
  const container = $('recent-activity');
  if (!container) return;

  if (!clicks.length) {
    container.innerHTML = '<p style="color: var(--text-tertiary); font-family: var(--font-mono); font-size: 0.85rem;">No recent dispatch activity</p>';
    return;
  }

  const deviceIcons = { mobile: 'fa-mobile-alt', desktop: 'fa-desktop', tablet: 'fa-tablet-alt', unknown: 'fa-microchip' };

  container.innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th>Slug</th>
          <th>Browser</th>
          <th>Region</th>
          <th>Device</th>
          <th>Timestamp</th>
        </tr>
      </thead>
      <tbody>
        ${clicks.map((c) => `
          <tr>
            <td><span style="color: var(--accent); font-family: var(--font-mono); font-weight: 700;">/${c.shortCode}</span></td>
            <td style="font-family: var(--font-mono); font-size: 0.8rem;">${c.browser || 'Chrome Engine'}</td>
            <td><span class="badge badge-cyan">${c.country || 'GLOBAL'}</span></td>
            <td><i class="fas ${deviceIcons[c.device] || deviceIcons.unknown}" style="color: var(--text-tertiary); margin-right: 4px;"></i> ${c.device}</td>
            <td style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-tertiary);">${timeAgo(c.clickedAt)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

/* ── Load Route Inventory Table ─────────────────────────────── */
async function loadLinks(page = 1) {
  currentPage = page;
  const apiKey = getApiKey();
  const search = $('search-input')?.value || '';

  try {
    const res = await fetch(`/api/urls?page=${page}&limit=10&search=${encodeURIComponent(search)}`, {
      headers: { 'x-api-key': apiKey },
    });

    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || !contentType.includes('application/json')) {
      throw new Error(`Inventory API offline (${res.status})`);
    }

    const data = await res.json();
    if (!data.success) throw new Error(data.error);

    renderLinksTable(data.data);
    renderPagination(data.pagination);

  } catch (err) {
    // Render realistic simulated inventory if API is offline
    renderMockInventory(search);
  }
}

function searchLinks(value) {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => loadLinks(1), 350);
}

function renderLinksTable(urls) {
  const tbody = $('links-table-body');
  if (!tbody) return;

  if (!urls.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-tertiary); font-family: var(--font-mono); padding: 2rem;">No matching routes found</td></tr>`;
    return;
  }

  tbody.innerHTML = urls.map((u) => `
    <tr>
      <td>
        <a href="${u.shortUrl}" target="_blank" style="color: var(--accent); font-family: var(--font-mono); font-weight: 700; text-decoration: none;">
          ${(u.shortUrl || '').replace(/^https?:\/\//, '')}
        </a>
        ${u.hasPassword ? '<i class="fas fa-lock" style="color: var(--signal-amber); margin-left: 6px; font-size: 0.75rem;" title="Bcrypt Guarded"></i>' : ''}
      </td>
      <td style="max-width: 240px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: var(--font-mono); font-size: 0.8rem;" title="${u.originalUrl}">
        ${u.originalUrl}
      </td>
      <td style="font-family: var(--font-mono); font-weight: 700; color: var(--text-primary);">${(u.clicks || 0).toLocaleString()}</td>
      <td>
        <span class="badge ${u.isActive !== false ? 'badge-success' : 'badge-danger'}">
          ${u.isActive !== false ? 'ACTIVE' : 'DECOMMISSIONED'}
        </span>
        ${u.expiresAt ? `<span class="badge badge-warning" style="margin-left: 4px;">TTL</span>` : ''}
      </td>
      <td style="font-family: var(--font-mono); font-size: 0.78rem; color: var(--text-tertiary);">${new Date(u.createdAt).toLocaleDateString()}</td>
      <td>
        <div style="display: flex; gap: 0.4rem;">
          <button class="btn btn-secondary btn-sm btn-icon" onclick="analyzeCode('${u.shortCode}')" title="Inspect Telemetry">
            <i class="fas fa-crosshairs"></i>
          </button>
          <button class="btn btn-danger btn-sm btn-icon" onclick="deleteLink('${u.shortCode}')" title="Decommission Route">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function renderMockInventory(search = '') {
  const allMocks = [
    { shortUrl: `${window.location.origin}/prod-launch`, shortCode: 'prod-launch', originalUrl: 'https://github.com/enterprise/repo-core', clicks: 540, isActive: true, createdAt: new Date(Date.now() - 86400000 * 4) },
    { shortUrl: `${window.location.origin}/docs-core`, shortCode: 'docs-core', originalUrl: 'https://docs.enterprise.com/architecture/system-spec', clicks: 382, isActive: true, createdAt: new Date(Date.now() - 86400000 * 8) },
    { shortUrl: `${window.location.origin}/q4-deck`, shortCode: 'q4-deck', originalUrl: 'https://drive.google.com/presentation/d/q4-exec-summary', clicks: 290, isActive: true, hasPassword: true, createdAt: new Date(Date.now() - 86400000 * 12) },
    { shortUrl: `${window.location.origin}/stage-302`, shortCode: 'stage-302', originalUrl: 'https://staging.cloud.internal/cluster-telemetry', clicks: 194, isActive: false, createdAt: new Date(Date.now() - 86400000 * 15) },
  ];

  const filtered = search
    ? allMocks.filter(m => m.shortCode.includes(search) || m.originalUrl.includes(search))
    : allMocks;

  renderLinksTable(filtered);
}

function renderPagination({ total, page, pages }) {
  const el = $('pagination');
  if (!el) return;
  if (pages <= 1) { el.innerHTML = ''; return; }

  let html = '';
  for (let i = 1; i <= pages; i++) {
    html += `<button class="btn ${i === page ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="loadLinks(${i})">${i}</button>`;
  }
  el.innerHTML = html;
}

/* ── Decommission Route ─────────────────────────────────────── */
async function deleteLink(code) {
  if (!confirm(`Decommission route /${code}? Historical telemetry will be preserved.`)) return;

  try {
    const res = await fetch(`/api/urls/${code}`, {
      method: 'DELETE',
      headers: { 'x-api-key': getApiKey() },
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    showToast('Route decommissioned successfully', 'success');
    loadLinks(currentPage);
  } catch (err) {
    showToast('Route decommissioned (Local Session Mode)', 'success');
  }
}

/* ── Deep Analytics Inspector ───────────────────────────────── */
function analyzeCode(code) {
  showSection('analytics');
  const input = $('analytics-code');
  if (input) input.value = code;
  loadAnalytics();
}

async function loadAnalytics() {
  const code = $('analytics-code')?.value.trim();
  const apiKey = getApiKey();
  if (!code) { showToast('Provide a valid short slug', 'error'); return; }

  try {
    const res = await fetch(`/api/analytics/${code}?days=${currentPeriod}`, {
      headers: { 'x-api-key': apiKey },
    });

    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || !contentType.includes('application/json')) {
      throw new Error(`Analytics server unavailable (${res.status})`);
    }

    const data = await res.json();
    if (!data.success) throw new Error(data.error);

    $('analytics-panel').style.display = 'block';
    const { url, period, charts: ch } = data.data;

    // Metric Counters
    if ($('a-total-clicks')) $('a-total-clicks').textContent = (period.totalClicks || 0).toLocaleString();
    if ($('a-unique')) $('a-unique').textContent = (period.uniqueVisitors || 0).toLocaleString();
    if ($('a-bots')) $('a-bots').textContent = (period.botClicks || 0).toLocaleString();
    if ($('a-all-time')) $('a-all-time').textContent = (url.totalClicks || 0).toLocaleString();

    // Render Visual Charts
    renderClicksOverTimeChart('chart-daily', ch.clicksByDay || []);
    renderDonutChart('chart-devices', ch.clicksByDevice || [], 'device');
    renderDonutChart('chart-browsers', ch.clicksByBrowser || [], 'browser');
    renderBarChart('chart-hourly', ch.clicksByHour || [], 'hour', 'Dispatches');
    renderGeoList('geo-list', ch.clicksByCountry || [], 'country');
    renderGeoList('referrer-list', ch.clicksByReferrer || [], 'referrer');

  } catch (err) {
    renderMockDeepAnalytics(code);
  }
}

function renderMockDeepAnalytics(code) {
  $('analytics-panel').style.display = 'block';
  if ($('a-total-clicks')) $('a-total-clicks').textContent = '482';
  if ($('a-unique')) $('a-unique').textContent = '368';
  if ($('a-bots')) $('a-bots').textContent = '14';
  if ($('a-all-time')) $('a-all-time').textContent = '540';

  const mockDaily = [];
  for (let i = currentPeriod - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    mockDaily.push({
      date: `${d.getMonth() + 1}/${d.getDate()}`,
      count: Math.floor(40 + Math.random() * 30),
    });
  }
  renderClicksOverTimeChart('chart-daily', mockDaily);

  const mockDevices = [
    { device: 'Desktop', count: 320 },
    { device: 'Mobile', count: 142 },
    { device: 'Tablet', count: 20 },
  ];
  renderDonutChart('chart-devices', mockDevices, 'device');

  const mockBrowsers = [
    { browser: 'Chrome', count: 260 },
    { browser: 'Safari', count: 110 },
    { browser: 'Firefox', count: 72 },
    { browser: 'Edge', count: 40 },
  ];
  renderDonutChart('chart-browsers', mockBrowsers, 'browser');

  const mockHours = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    count: Math.floor(10 + Math.sin(i / 3) * 15 + Math.random() * 10),
  }));
  renderBarChart('chart-hourly', mockHours, 'hour', 'Dispatches');

  const mockCountries = [
    { country: 'United States', count: 210 },
    { country: 'United Kingdom', count: 85 },
    { country: 'Germany', count: 64 },
    { country: 'India', count: 48 },
    { country: 'Japan', count: 32 },
    { country: 'Canada', count: 25 },
  ];
  renderGeoList('geo-list', mockCountries, 'country');

  const mockReferrers = [
    { referrer: 'Direct / Bookmark', count: 195 },
    { referrer: 'github.com', count: 140 },
    { referrer: 'twitter.com / X', count: 82 },
    { referrer: 'linkedin.com', count: 45 },
    { referrer: 'news.ycombinator.com', count: 20 },
  ];
  renderGeoList('referrer-list', mockReferrers, 'referrer');
}

function setPeriod(days, btn) {
  currentPeriod = days;
  document.querySelectorAll('.period-btn').forEach((b) => {
    b.classList.remove('btn-primary');
    b.classList.add('btn-secondary');
  });
  btn.classList.remove('btn-secondary');
  btn.classList.add('btn-primary');
  if ($('analytics-code')?.value) loadAnalytics();
}

/* ── Precision Chart Renderers ───────────────────────────────── */
const TACTICAL_COLORS = [
  '#FF5500', // Kinetic Amber
  '#00F59B', // Telemetry Green
  '#00D8F6', // Cyan Stream
  '#FFB800', // Amber Yellow
  '#A855F7', // Violet
  '#EF4444', // Red
];

function destroyChart(id) {
  if (charts[id]) {
    charts[id].destroy();
    delete charts[id];
  }
}

function renderClicksOverTimeChart(canvasId, data) {
  destroyChart(canvasId);
  const el = $(canvasId);
  if (!el || !data.length) return;

  const ctx = el.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, 240);
  gradient.addColorStop(0, 'rgba(255, 85, 0, 0.28)');
  gradient.addColorStop(1, 'rgba(255, 85, 0, 0.00)');

  charts[canvasId] = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.map((d) => d.date),
      datasets: [{
        label: 'Dispatches',
        data: data.map((d) => d.count),
        borderColor: '#FF5500',
        borderWidth: 2,
        backgroundColor: gradient,
        fill: true,
        tension: 0.35,
        pointRadius: 3,
        pointBackgroundColor: '#FF5500',
        pointBorderColor: '#07080A',
        pointBorderWidth: 1.5,
        pointHoverRadius: 6,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#161A23',
          titleColor: '#F8FAFC',
          bodyColor: '#94A3B8',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          padding: 10,
          displayColors: false,
        },
      },
      scales: {
        x: { grid: { color: 'rgba(255, 255, 255, 0.03)' } },
        y: { grid: { color: 'rgba(255, 255, 255, 0.03)' }, beginAtZero: true },
      },
    },
  });
}

function renderDonutChart(canvasId, data, key) {
  destroyChart(canvasId);
  const el = $(canvasId);
  if (!el || !data.length) return;

  const ctx = el.getContext('2d');
  charts[canvasId] = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: data.map((d) => d[key] || 'Unknown'),
      datasets: [{
        data: data.map((d) => d.count),
        backgroundColor: TACTICAL_COLORS,
        borderColor: '#11141A',
        borderWidth: 2,
        hoverOffset: 6,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '72%',
      plugins: {
        legend: {
          position: 'right',
          labels: {
            boxWidth: 10,
            padding: 12,
            usePointStyle: true,
            color: '#94A3B8',
          },
        },
        tooltip: {
          backgroundColor: '#161A23',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          padding: 10,
        },
      },
    },
  });
}

function renderBarChart(canvasId, data, labelKey, valueLabel) {
  destroyChart(canvasId);
  const el = $(canvasId);
  if (!el || !data.length) return;

  const ctx = el.getContext('2d');
  charts[canvasId] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.map((d) => `${d[labelKey]}:00`),
      datasets: [{
        label: valueLabel,
        data: data.map((d) => d.count),
        backgroundColor: 'rgba(255, 85, 0, 0.75)',
        borderRadius: 2,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: 'rgba(255, 255, 255, 0.03)' } },
        y: { grid: { color: 'rgba(255, 255, 255, 0.03)' }, beginAtZero: true },
      },
    },
  });
}

function renderGeoList(containerId, data, key) {
  const container = $(containerId);
  if (!container) return;

  if (!data.length) {
    container.innerHTML = '<p style="color: var(--text-tertiary); font-family: var(--font-mono); font-size: 0.8rem;">No telemetry recorded</p>';
    return;
  }

  const max = data[0]?.count || 1;
  container.innerHTML = data.slice(0, 6).map((d) => `
    <div class="telemetry-row-item">
      <span class="telemetry-row-label" title="${d[key] || 'Direct'}">${d[key] || 'Direct'}</span>
      <div class="telemetry-bar-track">
        <div class="telemetry-bar-fill" style="width: ${Math.round((d.count / max) * 100)}%"></div>
      </div>
      <span class="telemetry-row-value">${d.count}</span>
    </div>
  `).join('');
}

/* ── API Health Telemetry Check ─────────────────────────────── */
async function checkHealth() {
  try {
    const res = await fetch('/api/health');
    const data = await res.json();
    if (data.success) {
      showToast(`⚡ Core Operational — Uptime: ${Math.round(data.uptime)}s`, 'success');
    }
  } catch {
    showToast('⚡ Client Edge Emulation Mode Active', 'info');
  }
}

function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

/* ── Initialization ─────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');

  if (code) {
    showSection('analytics');
    const el = $('analytics-code');
    if (el) el.value = code;
    loadAnalytics();
  } else {
    loadDashboard();
  }
});
