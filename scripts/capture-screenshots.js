const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

async function capture() {
  const screenshotDir = path.resolve(__dirname, '../screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

  console.log('📸 Launching headless Chrome via puppeteer-core...');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // 1. Landing Page Desktop
  console.log('Capturing Landing Page (Desktop)...');
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: path.join(screenshotDir, '01_landing_desktop.png'), fullPage: false });

  // 2. Landing Page Mobile
  console.log('Capturing Landing Page (Mobile 390px)...');
  await page.setViewport({ width: 390, height: 844 });
  await page.screenshot({ path: path.join(screenshotDir, '02_landing_mobile.png'), fullPage: false });

  // Reset to Desktop
  await page.setViewport({ width: 1440, height: 900 });

  // 3. Login Page
  console.log('Capturing Login Page...');
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: path.join(screenshotDir, '03_login.png') });

  // 4. Perform Login
  console.log('Logging in with demo account...');
  await page.type('input[type="email"]', 'demo@kairo.sh');
  await page.type('input[type="password"]', 'Password123!');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle0' });

  // 5. Dashboard Overview
  console.log('Capturing Dashboard Overview...');
  await new Promise((r) => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(screenshotDir, '04_dashboard_overview.png') });

  // 6. Links Management
  console.log('Capturing Links Management Table...');
  await page.goto('http://localhost:3000/dashboard/links', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: path.join(screenshotDir, '05_links_management.png') });

  // 7. Individual Link Analytics
  console.log('Capturing Individual Link Analytics...');
  await page.goto('http://localhost:3000/dashboard/links/lnk_kairo_01', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: path.join(screenshotDir, '06_link_analytics.png') });

  // 8. Global Analytics Suite
  console.log('Capturing Analytics Suite...');
  await page.goto('http://localhost:3000/dashboard/analytics', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: path.join(screenshotDir, '07_global_analytics.png') });

  // 9. Settings
  console.log('Capturing Settings Page...');
  await page.goto('http://localhost:3000/dashboard/settings', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: path.join(screenshotDir, '08_settings.png') });

  console.log('🎉 All screenshots successfully captured!');
  await browser.close();
}

capture().catch(console.error);
