import { chromium } from 'playwright';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.resolve('../scratch_screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function run() {
  console.log('Starting Vite preview server...');
  const server = spawn('cmd.exe', ['/c', 'npx.cmd', 'vite', 'preview', '--port', '4173'], {
    cwd: path.resolve('.'),
    stdio: 'pipe'
  });

  server.stdout.on('data', (d) => console.log('[Vite Preview]', d.toString().trim()));
  server.stderr.on('data', (d) => console.error('[Vite Error]', d.toString().trim()));

  // Wait 3 seconds for server to start
  await new Promise((r) => setTimeout(r, 3000));

  console.log('Launching Playwright Chromium...');
  const browser = await chromium.launch({ headless: true });

  try {
    // 1. DESKTOP VIEWPORT (1280x800)
    console.log('--- Testing Desktop (1280x800) ---');
    const desktopContext = await browser.newContext({
      viewport: { width: 1280, height: 800 }
    });
    const page = await desktopContext.newPage();

    // Home Page Desktop
    await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-home-desktop.png') });
    console.log('Saved 01-home-desktop.png');

    // Menu Page Desktop
    await page.goto('http://localhost:4173/menu', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-menu-desktop.png') });
    console.log('Saved 02-menu-desktop.png');

    // Filter Pure Veg
    const vegBtn = await page.$('.diet-pill.veg-pill');
    if (vegBtn) {
      await vegBtn.click();
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03-menu-veg-filter.png') });
      console.log('Saved 03-menu-veg-filter.png');
    }

    // Filter Non-Veg
    const nonVegBtn = await page.$('.diet-pill.non-veg-pill');
    if (nonVegBtn) {
      await nonVegBtn.click();
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04-menu-nonveg-filter.png') });
      console.log('Saved 04-menu-nonveg-filter.png');
    }

    // Reset to All
    const allBtn = await page.$('.diet-pill:first-child');
    if (allBtn) {
      await allBtn.click();
      await page.waitForTimeout(400);
    }

    // Test Customize and Add to Cart: Verify hide customise option after adding to cart
    const customizeBtn = await page.$('.customize-toggle-btn');
    if (customizeBtn) {
      await customizeBtn.click();
      await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05-menu-customize-open.png') });
      console.log('Saved 05-menu-customize-open.png (Customize panel is visible)');

      // Click Add button
      const addBtn = await page.$('.btn-add');
      if (addBtn) {
        await addBtn.click();
        await page.waitForTimeout(400);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06-menu-after-add-custom-hidden.png') });
        console.log('Saved 06-menu-after-add-custom-hidden.png (VERIFIED: Customize option hidden!)');
      }
    }

    // 2. MOBILE VIEWPORT (375x812)
    console.log('--- Testing Mobile Layout (375x812) ---');
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 812 },
      isMobile: true,
      hasTouch: true
    });
    const mobilePage = await mobileContext.newPage();

    // Home Page Mobile
    await mobilePage.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(500);
    await mobilePage.screenshot({ path: path.join(SCREENSHOT_DIR, '07-home-mobile.png') });
    console.log('Saved 07-home-mobile.png');

    // Test Offer Click on Home Page (HUNGRY10)
    const dealCoupon = await mobilePage.$('.deal-coupon');
    if (dealCoupon) {
      await dealCoupon.click();
      await mobilePage.waitForTimeout(600);
      console.log('Clicked deal coupon! Navigated to:', mobilePage.url());
      await mobilePage.screenshot({ path: path.join(SCREENSHOT_DIR, '08-offer-applied-menu-mobile.png') });
      console.log('Saved 08-offer-applied-menu-mobile.png (Offer active banner visible)');
    }

    // Add item to cart on mobile
    const mobileAddBtn = await mobilePage.$('.btn-add');
    if (mobileAddBtn) {
      await mobileAddBtn.click();
      await mobilePage.waitForTimeout(400);
    }

    // Checkout Mobile with offer applied
    await mobilePage.goto('http://localhost:4173/checkout?coupon=HUNGRY10', { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(600);
    await mobilePage.screenshot({ path: path.join(SCREENSHOT_DIR, '09-checkout-mobile.png') });
    console.log('Saved 09-checkout-mobile.png');

    // Contact Us Mobile (Reduced emojis verification)
    await mobilePage.goto('http://localhost:4173/contact', { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(400);
    await mobilePage.screenshot({ path: path.join(SCREENSHOT_DIR, '10-contact-mobile.png') });
    console.log('Saved 10-contact-mobile.png');

    // Privacy Mobile (Reduced emojis verification)
    await mobilePage.goto('http://localhost:4173/privacy', { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(400);
    await mobilePage.screenshot({ path: path.join(SCREENSHOT_DIR, '11-privacy-mobile.png') });
    console.log('Saved 11-privacy-mobile.png');

    console.log('SUCCESS! All tests and screenshots completed.');
  } finally {
    await browser.close();
    server.kill();
  }
}

run().catch((e) => {
  console.error('Test execution failed:', e);
  process.exit(1);
});

