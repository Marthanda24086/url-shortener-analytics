const http = require('http');

async function request(urlPath, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, 'http://localhost:3000');
    const reqOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch {}
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data,
          json,
        });
      });
    });

    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runE2E() {
  console.log('🚀 Starting KAIRO End-to-End Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    // 1. Landing Page
    const landing = await request('/');
    assert(landing.status === 200 && landing.data.includes('KAIRO'), 'Public landing page renders HTTP 200 with brand wordmark');

    // 2. User Registration
    const testEmail = `tester_${Date.now()}@kairo.sh`;
    const regRes = await request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { name: 'E2E Automated Bot', email: testEmail, password: 'SecurePassword2026!' },
    });
    assert(regRes.status === 201 && regRes.json?.success === true, 'User registration succeeds with 201 Created');
    const cookie = regRes.headers['set-cookie'] ? regRes.headers['set-cookie'][0].split(';')[0] : '';

    // 3. Current User Verification
    const meRes = await request('/api/auth/me', {
      headers: { Cookie: cookie },
    });
    assert(meRes.status === 200 && meRes.json?.user?.email === testEmail, 'Session cookie verifies user identity');

    // 4. URL Validation: Reject executable scheme (XSS / Abuse prevention)
    const badSchemeRes = await request('/api/links', {
      method: 'POST',
      headers: { Cookie: cookie, 'Content-Type': 'application/json' },
      body: { originalUrl: 'javascript:alert(document.cookie)' },
    });
    assert(badSchemeRes.status === 400, 'Security: Rejects javascript: executable URL scheme');

    // 5. URL Validation: Reject SSRF loopback
    const loopbackRes = await request('/api/links', {
      method: 'POST',
      headers: { Cookie: cookie, 'Content-Type': 'application/json' },
      body: { originalUrl: 'http://127.0.0.1:8080/admin' },
    });
    assert(loopbackRes.status === 400, 'Security: Rejects private loopback IP destination');

    // 6. Reserved Alias Prevention
    const reservedRes = await request('/api/links', {
      method: 'POST',
      headers: { Cookie: cookie, 'Content-Type': 'application/json' },
      body: { originalUrl: 'https://github.com', customAlias: 'api' },
    });
    assert(reservedRes.status === 400, 'Security: Rejects reserved system route "api" as alias');

    // 7. Successful Short Link Creation
    const customSlug = `e2e-slug-${Date.now().toString().slice(-4)}`;
    const createRes = await request('/api/links', {
      method: 'POST',
      headers: { Cookie: cookie, 'Content-Type': 'application/json' },
      body: {
        originalUrl: 'https://docs.github.com/en/rest',
        customAlias: customSlug,
        title: 'GitHub REST Documentation',
      },
    });
    assert(createRes.status === 201 && createRes.json?.link?.shortCode === customSlug, 'Create short link with custom alias succeeds');
    const linkId = createRes.json?.link?.id;

    // 8. Duplicate Alias Prevention
    const dupRes = await request('/api/links', {
      method: 'POST',
      headers: { Cookie: cookie, 'Content-Type': 'application/json' },
      body: { originalUrl: 'https://google.com', customAlias: customSlug },
    });
    assert(dupRes.status === 409, 'Uniqueness constraint: Rejects duplicate custom alias');

    // 9. Short Link Redirection & Telemetry Capture
    const redirectRes = await request(`/r/${customSlug}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://twitter.com/kairo_platform',
      },
    });
    assert(redirectRes.status === 302, 'HTTP 302 redirect issued for active link');
    assert(redirectRes.headers.location === 'https://docs.github.com/en/rest', 'Redirect Location matches original destination');

    // Give asynchronous event ingestion 100ms
    await new Promise((r) => setTimeout(r, 200));

    // 10. Individual Link Analytics Verification
    const analyticsRes = await request(`/api/analytics/link/${linkId}`, {
      headers: { Cookie: cookie },
    });
    assert(analyticsRes.status === 200 && analyticsRes.json?.metrics?.totalClicks >= 1, 'Analytics pipeline records click event');
    assert(analyticsRes.json?.browsers?.some((b) => b.name === 'Chrome'), 'Parsed user agent browser correctly identified as Chrome');
    assert(analyticsRes.json?.referrers?.some((r) => r.name === 'X / Twitter'), 'Parsed referrer correctly canonicalized as X / Twitter');

    // 11. Pause Link
    const pauseRes = await request(`/api/links/${linkId}`, {
      method: 'PATCH',
      headers: { Cookie: cookie, 'Content-Type': 'application/json' },
      body: { isActive: false },
    });
    assert(pauseRes.status === 200 && pauseRes.json?.link?.isActive === false, 'Link successfully paused');

    // 12. Paused Link Access Check
    const pausedAccess = await request(`/r/${customSlug}`);
    assert(pausedAccess.status === 403 && pausedAccess.data.includes('Paused'), 'Paused link returns HTTP 403 Paused page');

    // 13. Reactivate Link
    const reactivateRes = await request(`/api/links/${linkId}`, {
      method: 'PATCH',
      headers: { Cookie: cookie, 'Content-Type': 'application/json' },
      body: { isActive: true },
    });
    assert(reactivateRes.status === 200 && reactivateRes.json?.link?.isActive === true, 'Link successfully reactivated');

    // 14. Tenant Isolation Check
    // Create another user
    const otherUserRes = await request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { name: 'Tenant B User', email: `tenantB_${Date.now()}@kairo.sh`, password: 'Password123!' },
    });
    const cookieB = otherUserRes.headers['set-cookie'][0].split(';')[0];
    const unauthorizedGet = await request(`/api/links/${linkId}`, {
      headers: { Cookie: cookieB },
    });
    assert(unauthorizedGet.status === 404, 'Multi-tenant isolation: User B cannot access User A link');

    // 15. Delete Link
    const deleteRes = await request(`/api/links/${linkId}`, {
      method: 'DELETE',
      headers: { Cookie: cookie },
    });
    assert(deleteRes.status === 200 && deleteRes.json?.success === true, 'Link successfully deleted');

    // 16. Verify 404 on deleted link
    const deletedAccess = await request(`/r/${customSlug}`);
    assert(deletedAccess.status === 404 && deletedAccess.data.includes('Not Found'), 'Deleted link returns HTTP 404 Not Found');

    console.log(`\n========================================`);
    console.log(`📊 Test Results: ${passed} passed, ${failed} failed.`);
    console.log(`========================================\n`);

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  }
}

runE2E();
